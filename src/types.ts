/** Types du contenu des schémas de flux. */

/** Un axe affiché sous un schéma : [libellé, état] ('on' = actif, 'acc' = accent/warning, '' = neutre). */
export type Axis = [string, '' | 'on' | 'acc'];

/**
 * Un schéma (un cas concret d'une famille d'opérations).
 *  - `d` : mini-flowchart (sous-ensemble de la syntaxe mermaid `flowchart LR`) interprété par flowchart.ts.
 *  - `why` / `warn` / `info` : texte pouvant contenir un peu de HTML (<b>, <code class="inl">…).
 */
export interface Schema {
  h: string;
  axes: Axis[];
  why: string;
  d: string;
  warn?: string;
  info?: string;
}

/** Une famille d'opérations (ex. « Ajustement du montant »), avec son ticket, son intro et ses schémas. */
export interface Family {
  tag: string;
  title: string;
  lead: string;
  /** Type d'interaction du paiement d'origine, affiché en badge : ECOM / MOTO / ContAuth / POS (ou combinaison). */
  flow?: string;
  schemas: Schema[];
}

/** Payload cliquable ouvert au clic sur un nœud coral. */
export interface Payload {
  key: string;
  method: 'POST' | 'GET' | 'DELETE';
  path: string;
}
