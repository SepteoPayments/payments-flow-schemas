# @septeo/payments-flow-schemas

Composant **React** autonome affichant les **schémas de flux interactifs** de l'API publique de paiement Septeo :
pour chaque famille d'opération (ajustement, prolongation, capture, remboursement, tokenisation, order ANCV+CB…),
une explication courte + un **schéma cliquable** où chaque case **coral** est un appel API qui ouvre le **payload exact**.

Pensé pour être posé tel quel dans le BO, page **Intégration › Documentation API Public**.

- **Dépendance** : React uniquement (pas de MUI/Tailwind requis).
- **Style scopé** sous `.pfs` : aucune règle globale, rien ne fuit dans le reste du BO.
- **Thème** : suit `prefers-color-scheme`, ou forçable via la prop `theme` (pour coller au thème MUI courant).
- **Contenu typé** dans `src/data.ts` (source de vérité), rendu par un moteur SVG maison (`src/flowchart.ts`).

## Intégration dans le BO

```tsx
// src/presentation/application/integrateurs/documentation/documentation_view.tsx
import { FlowSchemas } from '@septeo/payments-flow-schemas';

export function DocumentationView() {
  // theme optionnel : passe le thème MUI courant si tu veux le forcer
  return <FlowSchemas theme={mode /* 'light' | 'dark' */} />;
}
```

Props (`FlowSchemasProps`) :

| Prop        | Type                   | Défaut             | Rôle |
|-------------|------------------------|--------------------|------|
| `theme`     | `'light' \| 'dark'`    | (prefers-color-scheme) | Force le thème du composant. |
| `apiBase`   | `string`               | `/api/public/v1`   | Base d'URL affichée dans la modale de payload. |
| `className` | `string`               | —                  | Classe additionnelle sur la racine `.pfs`. |

### Polices (optionnel)
Le composant utilise **IBM Plex Sans / Mono** si disponibles, sinon un fallback système. Pour le rendu exact,
charger une fois dans le BO :
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
```

### Thème MUI
Pour aligner sur le thème du BO, surcharger les variables CSS sur `.pfs` (ex. dans un style global) :
```css
.pfs { --accent: <primary MUI>; --surface: <paper MUI>; --ink: <text MUI>; --line: <divider MUI>; }
```

## Mettre à jour le contenu

**Un seul fichier à éditer : `src/data.ts`.** Ne jamais toucher au style (`src/flowSchemas.css`) ni au moteur
(`src/flowchart.ts`) ; une nouveauté **réutilise le style à l'identique**.

- `payloads` : les corps JSON exacts, indexés par clé (référencés par les nœuds cliquables).
- `families` : les familles et leurs schémas. Chaque schéma :

```ts
{
  h: 'Titre du cas',
  axes: [['preAuth:true', 'on'], ['token', 'on'], ['multi-capture ON', 'acc']], // 'on' actif, 'acc' accent, '' neutre
  why: "2-3 phrases (un peu de HTML autorisé : <b>, <code class=\"inl\">…).",
  d: 'flowchart LR\n A["Auth"] --> B["POST /amount"]:::call\n click B call pay("amtUp15","POST","/payments/{ref}/amount")',
  warn?: '…', info?: '…'
}
```

### Le mini-DSL des schémas (`d`)
Sous-ensemble de la syntaxe mermaid `flowchart LR`, interprété par `flowchart.ts` :

| Élément | Écriture |
|---|---|
| Nœud rectangle | `A["Libellé"]` (`<br/>` pour 2 lignes) |
| Décision (losange pointillé) | `X{"Adyen accepte ?"}` |
| Arête | `A --> B` |
| Arête étiquetée | `A -->|OK| B` |
| **Nœud coral = appel API cliquable** | `B["POST /amount"]:::call` |
| Payload rattaché au clic | `click B call pay("<clé payloads>","POST\|GET\|DELETE","/chemin")` |

## Structure

```
src/
  index.ts          exports publics
  FlowSchemas.tsx   le composant React (modale payload en state, SVG injecté, thème)
  flowchart.ts      moteur : DSL -> SVG (aucune dépendance)
  data.ts           CONTENU (payloads + familles/schémas) — le seul fichier à éditer
  types.ts          types (Family, Schema, Axis, Payload)
  flowSchemas.css   styles scopés .pfs (thème par variables)
```

## Synchronisation avec l'API

Le schéma doit rester fidèle à **public-transaction-service** (branche `main`). Un **skill dédié** (harnais de
sécurité : lecture seule Azure, jamais de merge, s'arrête avant commit, un humain relit/merge) proposera les mises à
jour de `src/data.ts` **par branche** sur ce repo, en comparant à `main`. Il ne touche jamais au style.

## Dév / typecheck

```bash
npm install
npm run typecheck
```
(La prévisualisation se fait dans le BO, ou via un petit hôte Vite/React de ton choix qui rend `<FlowSchemas />`.)
