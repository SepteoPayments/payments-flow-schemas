/*
 * flowchart.ts — moteur autonome (aucune dépendance) qui transforme le mini-DSL `d` d'un schéma en SVG.
 * Sous-ensemble de mermaid `flowchart LR` : nœuds `A["libellé"]` (rect) / `X{"décision"}` (losange pointillé),
 * arêtes `-->` avec libellé optionnel `-->|label|`, nœud d'appel API `N["..."]:::call`, et
 * `click N call pay("<clé>","POST|GET|DELETE","/chemin")` pour rattacher un payload cliquable.
 * Rendu = string SVG (les couleurs viennent des variables CSS via `currentColor`/`fill:var(--…)`).
 */

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Coloration syntaxique légère d'un payload JSON (renvoie du HTML). */
export function hl(json: string): string {
  return esc(json)
    .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="k">$1</span>$2')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="s">$1</span>')
    .replace(/:\s*(-?\d+)/g, ': <span class="n">$1</span>');
}

interface Ep { id: string; shape: 'rect' | 'dec' | null; label: string | null; call: boolean; }
interface FNode { id: string; label: string; shape: string; call: boolean; payload: { key: string; method: string; path: string } | null; w?: number; h?: number; x?: number; y?: number; lines?: string[]; }
interface FEdge { from: string; to: string; label: string; }
interface Graph { nodes: Record<string, FNode>; order: string[]; edges: FEdge[]; W?: number; H?: number; }

function parseEp(tok: string): Ep {
  const idm = tok.match(/^([A-Za-z0-9_]+)/);
  const id = idm ? idm[1] : tok;
  const call = /:::call/.test(tok);
  const r = tok.match(/\["([\s\S]*?)"\]/);
  const d = tok.match(/\{"([\s\S]*?)"\}/);
  let shape: 'rect' | 'dec' | null = null;
  let label: string | null = null;
  if (r) { shape = 'rect'; label = r[1]; } else if (d) { shape = 'dec'; label = d[1]; }
  return { id, shape, label, call };
}

function parseFlow(src: string): Graph {
  const N: Record<string, FNode> = {};
  const order: string[] = [];
  const edges: FEdge[] = [];
  function ensure(ep: Ep): FNode {
    if (!N[ep.id]) { N[ep.id] = { id: ep.id, label: ep.label || ep.id, shape: ep.shape || 'rect', call: !!ep.call, payload: null }; order.push(ep.id); }
    else { if (ep.shape) N[ep.id].shape = ep.shape; if (ep.label) N[ep.id].label = ep.label; if (ep.call) N[ep.id].call = true; }
    return N[ep.id];
  }
  src.split('\n').forEach((raw) => {
    const line = raw.trim(); if (!line) return;
    if (line.indexOf('click ') === 0) {
      const mm = line.match(/^click\s+(\w+)\s+call\s+pay\("([^"]*)","([^"]*)","([^"]*)"\)/);
      if (mm) { const nn = ensure({ id: mm[1], shape: null, label: null, call: true }); nn.call = true; nn.payload = { key: mm[2], method: mm[3], path: mm[4] }; }
      return;
    }
    if (line.indexOf('-->') < 0) return;
    const parts = line.split('-->'); if (parts.length < 2) return;
    let right = parts[1].trim(); let label = '';
    const left = parts[0].trim();
    const lm = right.match(/^\|([^|]*)\|\s*([\s\S]*)$/); if (lm) { label = lm[1].trim(); right = lm[2].trim(); }
    const s = parseEp(left), t = parseEp(right); ensure(s); ensure(t);
    if (s.id !== t.id) edges.push({ from: s.id, to: t.id, label });
  });
  return { nodes: N, order, edges };
}

function layout(g: Graph): Graph {
  const ids = g.order, N = g.nodes;
  const out: Record<string, string[]> = {}, indeg: Record<string, number> = {};
  ids.forEach((id) => { out[id] = []; indeg[id] = 0; });
  g.edges.forEach((e) => { out[e.from].push(e.to); indeg[e.to]++; });
  const rank: Record<string, number> = {}, indeg2: Record<string, number> = {};
  ids.forEach((id) => { rank[id] = 0; indeg2[id] = indeg[id]; });
  const q = ids.filter((id) => indeg[id] === 0);
  while (q.length) { const u = q.shift() as string; out[u].forEach((v) => { if (rank[v] < rank[u] + 1) rank[v] = rank[u] + 1; if (--indeg2[v] === 0) q.push(v); }); }
  const cols: Record<number, string[]> = {};
  ids.forEach((id) => { (cols[rank[id]] = cols[rank[id]] || []).push(id); });
  ids.forEach((id) => {
    const n = N[id], lines = String(n.label).split('<br/>'); let mc = 0;
    lines.forEach((l) => { mc = Math.max(mc, l.length); });
    n.w = Math.min(230, Math.max(86, Math.round(mc * 6.5) + 22)); n.h = lines.length > 1 ? 48 : 34; n.lines = lines;
  });
  const colGap = 52, rowH = 64, margin = 16;
  const ranks = Object.keys(cols).map(Number).sort((a, b) => a - b);
  const colW: Record<number, number> = {}, colX: Record<number, number> = {}; let x = margin;
  ranks.forEach((r) => { let w = 0; cols[r].forEach((id) => { w = Math.max(w, N[id].w as number); }); colW[r] = w; colX[r] = x; x += w + colGap; });
  let maxRows = 0; ranks.forEach((r) => { maxRows = Math.max(maxRows, cols[r].length); });
  ranks.forEach((r) => { cols[r].forEach((id, i) => { const n = N[id]; n.x = colX[r] + (colW[r] - (n.w as number)) / 2; n.y = margin + i * rowH + (rowH - (n.h as number)) / 2; }); });
  g.W = Math.max(x - colGap + margin, 120); g.H = margin * 2 + Math.max(maxRows, 1) * rowH;
  return g;
}

function outdeg(g: Graph, id: string): number { let c = 0; g.edges.forEach((e) => { if (e.from === id) c++; }); return c; }

function svgOf(g: Graph): string {
  let s = '<svg viewBox="0 0 ' + g.W + ' ' + g.H + '" width="' + g.W + '" height="' + g.H + '" role="img" aria-label="Schéma de flux" xmlns="http://www.w3.org/2000/svg">';
  s += '<defs><marker id="arr" markerWidth="9" markerHeight="9" refX="7.5" refY="3" orient="auto"><path class="arrow-mark" d="M0,0 L7,3 L0,6 Z"/></marker></defs>';
  g.edges.forEach((e) => {
    const a = g.nodes[e.from], b = g.nodes[e.to]; if (!a || !b || a.x == null || b.x == null) return;
    const x1 = (a.x as number) + (a.w as number), y1 = (a.y as number) + (a.h as number) / 2, x2 = b.x as number, y2 = (b.y as number) + (b.h as number) / 2, mx = (x1 + x2) / 2;
    s += '<path class="edge" d="M' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + (x2 - 3) + ' ' + y2 + '" marker-end="url(#arr)"/>';
    if (e.label) { const lx = mx, ly = (y1 + y2) / 2 - 3, wc = e.label.length * 5.6 + 8; s += '<rect class="edge-lbl-bg" x="' + (lx - wc / 2) + '" y="' + (ly - 10) + '" width="' + wc + '" height="14" rx="3"/><text class="edge-lbl" x="' + lx + '" y="' + (ly + 1) + '" text-anchor="middle">' + esc(e.label) + '</text>'; }
  });
  g.order.forEach((id) => {
    const n = g.nodes[id]; if (n.x == null) return;
    const isEnd = !n.call && n.shape !== 'dec' && outdeg(g, id) === 0;
    const cls = 'node' + (n.call ? ' call' : '') + (n.shape === 'dec' ? ' dec' : '') + (isEnd ? ' end' : '');
    const attr = n.call && n.payload ? (' data-k="' + esc(n.payload.key) + '" data-m="' + esc(n.payload.method) + '" data-p="' + esc(n.payload.path) + '"') : '';
    const lines = n.lines as string[];
    s += '<g class="' + cls + '"' + attr + '>';
    s += '<rect class="n-rect" x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="8"/>';
    const cx = (n.x as number) + (n.w as number) / 2;
    if (lines.length > 1) s += '<text class="n-txt" text-anchor="middle"><tspan x="' + cx + '" y="' + ((n.y as number) + (n.h as number) / 2 - 2) + '">' + esc(lines[0]) + '</tspan><tspan x="' + cx + '" dy="14">' + esc(lines[1]) + '</tspan></text>';
    else s += '<text class="n-txt" x="' + cx + '" y="' + ((n.y as number) + (n.h as number) / 2 + 4) + '" text-anchor="middle">' + esc(lines[0]) + '</text>';
    s += '</g>';
  });
  return s + '</svg>';
}

/** Point d'entrée : transforme une définition de flux `d` en SVG (avec repli lisible si le parse échoue). */
export function flowToSvg(d: string): string {
  try { return svgOf(layout(parseFlow(d))); }
  catch { return '<div class="diag-fallback">' + esc(d) + '</div>'; }
}
