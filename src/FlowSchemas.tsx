/*
 * FlowSchemas — composant React autonome (dépendance : React seul) affichant les schémas de flux de l'API
 * publique de paiement, chaque case coral ouvrant le payload exact. Style scopé sous `.pfs` (aucune fuite
 * dans le BO). À poser tel quel dans la page Intégration → Documentation API Public.
 *
 *   import { FlowSchemas } from '@septeo/payments-flow-schemas';
 *   <FlowSchemas />                       // suit prefers-color-scheme
 *   <FlowSchemas theme="light" />         // force le thème (ex. thème MUI courant)
 *
 * Contenu = src/data.ts (source de vérité, typée). Ne pas éditer le style ni le moteur pour un ajout.
 */
import { useState, useCallback, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { families, payloads, webhooks } from './data';
import { flowToSvg, hl } from './flowchart';
import type { Payload } from './types';
import './flowSchemas.css';

export interface FlowSchemasProps {
  /** Force le thème ('light' | 'dark'). Sinon suit `prefers-color-scheme`. */
  theme?: 'light' | 'dark';
  /** Base d'URL affichée dans la modale de payload. Défaut : /api/public/v1. */
  apiBase?: string;
  /** Classe additionnelle sur la racine. */
  className?: string;
}

const HERO_P =
  "Pour chaque cas : <b>2-3 phrases</b> qui disent ce qui se passe et pourquoi, puis le <b>schéma</b> du flux. " +
  "Dans le schéma, chaque case <b>coral</b> est un <b>appel API</b> : <b>clique dessus</b> et le <b>payload exact</b> " +
  "+ l'URL s'affichent. Montants en unités mineures (10000 = 100,00 €).";

const SOCLE_HTML =
  '<p class="fam-lead" style="margin-top:10px">Trois axes se pilotent à l\'ouverture de session (<code class="inl">POST /sessions</code>) ; le quatrième est un réglage du compte Adyen.</p>' +
  '<div class="tw"><table>' +
  '<tr><th>Axe</th><th>Choix</th><th>Ce que le PMS met</th></tr>' +
  '<tr><td rowspan="2"><b>Autorisation</b></td><td>pré-autorisation</td><td><code class="inl">"preAuth": true</code> (+ <code class="inl">capture.mode:"MANUAL"</code>)</td></tr>' +
  '<tr><td>finale (vente ferme)</td><td><code class="inl">"preAuth": false</code></td></tr>' +
  '<tr><td rowspan="2"><b>Token</b></td><td>avec token</td><td><code class="inl">"tokenization": { shopperReference, recurringModel }</code></td></tr>' +
  '<tr><td>sans token</td><td>pas de bloc <code class="inl">tokenization</code></td></tr>' +
  '<tr><td rowspan="2"><b>Capture</b></td><td>à la main</td><td><code class="inl">"capture": { "mode":"MANUAL" }</code></td></tr>' +
  '<tr><td>immédiate</td><td><code class="inl">"capture": { "mode":"IMMEDIATE" }</code></td></tr>' +
  '<tr><td><b>Capture multiple</b></td><td>ON / OFF</td><td>⚠️ réglage <b>du compte Adyen</b>, pas un champ API : détermine si on peut enchaîner plusieurs captures partielles.</td></tr>' +
  '</table></div>' +
  '<div class="callout info">Le <code class="inl">pspReference</code> vient du webhook <code class="inl">AUTHORISATION</code>. « Complément » = ré-autoriser la différence sur le token quand Adyen refuse d\'augmenter une autorisation — <b>possible seulement avec token</b>.</div>';

function mcls(m: string): string {
  return m === 'GET' ? 'get' : m === 'DELETE' ? 'del' : 'post';
}

/** Classe de couleur du badge d'interaction, dérivée du libellé de flux. */
function flowCls(f: string): string {
  if (/MOTO/.test(f)) return 'moto';
  if (/POS/.test(f)) return 'pos';
  if (/ContAuth/.test(f) && !/ECOM/.test(f)) return 'contauth';
  return '';
}
function flowIcon(f: string): string {
  if (/POS/.test(f)) return '🖥️';
  if (/MOTO/.test(f)) return '📞';
  if (/ContAuth/.test(f) && !/ECOM/.test(f)) return '🔁';
  return '🛒';
}

export function FlowSchemas({ theme, apiBase = '/api/public/v1', className }: FlowSchemasProps) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [webhook, setWebhook] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onDiagClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const g = (e.target as HTMLElement).closest?.('.node.call, .node.whk') as HTMLElement | null;
    if (!g) return;
    const wh = g.getAttribute('data-wh');
    if (wh) { setWebhook(wh); setPayload(null); setCopied(false); return; }
    setPayload({
      key: g.getAttribute('data-k') || '',
      method: (g.getAttribute('data-m') || 'POST') as Payload['method'],
      path: g.getAttribute('data-p') || '',
    });
    setWebhook(null);
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!payload && !webhook) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPayload(null); setWebhook(null); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [payload, webhook]);

  const body = payload && payload.key && payloads[payload.key] ? payloads[payload.key] : null;
  const url = payload ? apiBase + payload.path : '';

  const copyText = (t: string | null) => {
    if (t && navigator.clipboard) navigator.clipboard.writeText(t).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };
  const copy = () => copyText(body);

  return (
    <div className={'pfs' + (className ? ' ' + className : '')} data-theme={theme}>
      <div className="pfs-wrap">
        <div className="pfs-hero">
          <h2>Chaque flux, expliqué puis en schéma cliquable</h2>
          <p dangerouslySetInnerHTML={{ __html: HERO_P }} />
        </div>

        <section className="pfs-step">
          <details className="pfs-socle">
            <summary>Rappel — comment un PMS met en place un schéma (4 axes + opérations)</summary>
            <div dangerouslySetInnerHTML={{ __html: SOCLE_HTML }} />
          </details>
        </section>

        {families.map((fam) => (
          <section className="pfs-step" key={fam.tag + fam.title}>
            <h3 className="pfs-fam"><span className="tag">{fam.tag}</span> {fam.title}</h3>
            <p className="fam-lead">{fam.lead}</p>
            {fam.schemas.map((s, i) => (
              <div className="schema" key={i}>
                <h4>{s.h}</h4>
                {fam.flow && <div><span className={'flowbadge ' + flowCls(fam.flow)}>{flowIcon(fam.flow)} {fam.flow}</span></div>}
                <div className="axes">
                  {s.axes.map((a, j) => <span className={'ax ' + (a[1] || '')} key={j}>{a[0]}</span>)}
                </div>
                <p className="why" dangerouslySetInnerHTML={{ __html: s.why }} />
                <p className="diag-hint">Schéma — les cases <b>coral</b> sont cliquables (payload). Défile à l'horizontale au besoin.</p>
                <div className="diag" onClick={onDiagClick} dangerouslySetInnerHTML={{ __html: flowToSvg(s.d) }} />
                {s.warn && <div className="callout warn" dangerouslySetInnerHTML={{ __html: s.warn }} />}
                {s.info && <div className="callout info" dangerouslySetInnerHTML={{ __html: s.info }} />}
              </div>
            ))}
          </section>
        ))}
      </div>

      {payload && (
        <div className="ov show" role="dialog" aria-modal="true"
             onClick={(e) => { if (e.target === e.currentTarget) setPayload(null); }}>
          <div className="modal">
            <div className="modal-h">
              <span className="tu">TU ENVOIES</span>
              <span className="arw">→</span>
              <span className={'mm ' + mcls(payload.method)}>{payload.method}</span>
              <span className="url">{url}</span>
              <button className="x" aria-label="Fermer" onClick={() => setPayload(null)}>✕</button>
            </div>
            <div className="modal-b">
              {body ? (
                <>
                  <pre dangerouslySetInnerHTML={{ __html: hl(body) }} />
                  <button className="cp" onClick={copy}>{copied ? 'Copié ✓' : 'Copier le payload'}</button>
                </>
              ) : (
                <p className="nobody">Pas de corps JSON : cet appel ne porte pas de payload (les paramètres sont dans l'URL).</p>
              )}
            </div>
          </div>
        </div>
      )}

      {webhook && webhooks[webhook] && (
        <div className="ov show" role="dialog" aria-modal="true"
             onClick={(e) => { if (e.target === e.currentTarget) setWebhook(null); }}>
          <div className="modal">
            <div className="modal-h">
              <span className="tu recv">TU REÇOIS</span>
              <span className="arw recv">←</span>
              <span className="mm wh">webhook</span>
              <span className="url">Adyen → notification-service → ton PMS</span>
              <button className="x" aria-label="Fermer" onClick={() => setWebhook(null)}>✕</button>
            </div>
            <div className="modal-b">
              <pre dangerouslySetInnerHTML={{ __html: hl(webhooks[webhook]) }} />
              <button className="cp" onClick={() => copyText(webhooks[webhook])}>{copied ? 'Copié ✓' : 'Copier le webhook'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlowSchemas;
