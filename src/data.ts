/*
 * data.ts — CONTENU des schémas de flux (le seul fichier à éditer pour ajouter/mettre à jour un cas).
 * Ne pas toucher au style (flowSchemas.css) ni au moteur (flowchart.ts) : une nouveauté réutilise le style à l'identique.
 *
 *  STORE    : publicStoreId d'exemple (placeholder d'affichage dans les payloads).
 *  P        : payloads exacts, indexés par clé (référencés par les nœuds cliquables via `pay("<clé>", ...)`).
 *  FAMILIES : familles d'opérations. Chaque schéma :
 *    { h:titre, axes:[[label,'on'|'acc'|''],...], why:"2-3 phrases", d:"<mini-flowchart>", warn?, info? }
 *    `d` = sous-ensemble de la syntaxe mermaid `flowchart LR` interprété par app.js :
 *      - `A["Libellé"] --> B["Autre"]`   (nœud rectangle ; `<br/>` pour 2 lignes)
 *      - `X{"Décision ?"}`               (losange pointillé)
 *      - `... -->|label| ...`            (libellé d'arête)
 *      - `N["..."]:::call`               (nœud CORAL = appel API cliquable)
 *      - `click N call pay("<clé P>","POST|GET|DELETE","/chemin")`  (payload ouvert au clic)
 */
import type { Family } from './types';

export const STORE = '547c…';
export const payloads: Record<string, string> = {
  amtUp15:'{\n  "amount": { "value": 15000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  amt12:'{\n  "amount": { "value": 12000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  amtDown7:'{\n  "amount": { "value": 7000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  compl5:'{\n  "amount": { "value": 5000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "token": "<token stocké>",\n  "shopperReference": "client-42",\n  "recurringModel": "UNSCHEDULED",\n  "reference": "CMD-1-complement"\n}',
  compl2:'{\n  "amount": { "value": 2000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "token": "<token>",\n  "shopperReference": "client-42",\n  "recurringModel": "UNSCHEDULED",\n  "reference": "CMD-1-complement"\n}',
  cap40:'{\n  "amount": { "value": 4000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  capTotal:'{\n  "amount": { "value": 10000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  reauth6:'{\n  "amount": { "value": 6000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "token": "<token>",\n  "shopperReference": "client-42",\n  "recurringModel": "UNSCHEDULED",\n  "reference": "CMD-1-b"\n}',
  reste6:'{\n  "amount": { "value": 6000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "token": "<token>",\n  "shopperReference": "client-42",\n  "recurringModel": "UNSCHEDULED",\n  "reference": "CMD-1-reste"\n}',
  extend:'{\n  "amount": { "value": 10000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "reason": "DELAYED_CHARGE"\n}',
  reauth10:'{\n  "amount": { "value": 10000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "token": "<token>",\n  "shopperReference": "client-42",\n  "recurringModel": "UNSCHEDULED",\n  "reference": "CMD-1-reauth"\n}',
  cancel:'{\n  "publicStoreId": "'+STORE+'"\n}',
  refundTotal:'{\n  "amount": { "value": 10000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  refund30:'{\n  "amount": { "value": 3000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'"\n}',
  tokenise:'{\n  "amount": { "value": 0, "currency": "EUR" },\n  "reference": "TOKENISE-1",\n  "publicStoreId": "'+STORE+'",\n  "returnUrl": "https://ton-pms/retour",\n  "capture": { "mode": "MANUAL" },\n  "tokenization": { "shopperReference": "client-42", "recurringModel": "CARD_ON_FILE" }\n}',
  mit10:'{\n  "amount": { "value": 10000, "currency": "EUR" },\n  "publicStoreId": "'+STORE+'",\n  "token": "<token>",\n  "shopperReference": "client-42",\n  "recurringModel": "UNSCHEDULED",\n  "reference": "MIT-1"\n}'
};

export const families: Family[] = [
 {tag:'#2739',title:'Ajustement du montant',lead:'Changer le montant autorisé (avant/pendant la capture) sur une pré-autorisation.',schemas:[
   {h:'Avec token · sans capture',axes:[['preAuth:true','on'],['MANUAL','on'],['token','on']],
    why:"Tu as pré-autorisé un montant et gardé un token. Tu peux le monter ou le baisser avant capture. Si Adyen refuse une hausse, le token te sauve : tu ré-autorises juste le complément à part.",
    d:'flowchart LR\n A["Auth pré-aut"] --> H{"Sens ?"}\n H -->|hausse| B["POST /amount<br/>hausse"]:::call\n B --> U{"Adyen accepte ?"}\n U -->|OK| U1["Montant augmenté"]\n U -->|KO| C["POST /payments<br/>complément"]:::call\n C --> C1["Auth + complément"]\n H -->|baisse| D["POST /amount<br/>baisse"]:::call\n D --> D1["Montant diminué"]\n click B call pay("amtUp15","POST","/payments/{ref}/amount")\n click C call pay("compl5","POST","/payments")\n click D call pay("amtDown7","POST","/payments/{ref}/amount")'},
   {h:'Sans token · sans capture',axes:[['preAuth:true','on'],['MANUAL','on'],['sans token','']],
    why:"Même principe, mais sans filet : sans token, si Adyen refuse la hausse tu ne peux pas rattraper le complément. Le montant initial reste, point.",
    d:'flowchart LR\n A["Auth pré-aut"] --> B["POST /amount"]:::call\n B --> U{"Adyen accepte ?"}\n U -->|OK| U1["Montant modifié"]\n U -->|KO| U2["Montant initial conservé"]\n click B call pay("amtUp15","POST","/payments/{ref}/amount")',
    warn:"Pour couvrir le refus de hausse, ouvre la session <b>avec token</b>."},
   {h:'Avec token · avec capture · capture multiple ON',axes:[['preAuth:true','on'],['MANUAL','on'],['token','on'],['multi-capture ON','acc']],
    why:"Tu encaisses en plusieurs fois ET tu peux encore ajuster : la capture multiple garde l'autorisation ouverte après une capture partielle ; le token sert de repli si une hausse est refusée.",
    d:'flowchart LR\n A["Auth pré-aut"] --> P["POST /captures<br/>partielle"]:::call\n P --> B["POST /amount"]:::call\n B --> U{"Adyen accepte ?"}\n U -->|OK| U1["Montant augmenté"]\n U -->|KO| C["POST /payments<br/>complément"]:::call\n C --> C1["Auth + complément"]\n click P call pay("cap40","POST","/payments/{ref}/captures")\n click B call pay("amt12","POST","/payments/{ref}/amount")\n click C call pay("compl5","POST","/payments")'},
   {h:'Avec/sans token · avec capture · capture multiple OFF',axes:[['preAuth:true','on'],['MANUAL','on'],['multi-capture OFF','acc']],
    why:"Piège : sans capture multiple, une capture partielle CLÔTURE l'autorisation. Plus d'ajustement possible. La seule suite, c'est ré-autoriser sur le token (il faut donc un token).",
    d:'flowchart LR\n A["Auth pré-aut"] --> P["POST /captures<br/>partielle"]:::call\n P --> X["Autorisation<br/>clôturée"]\n X --> R["POST /payments<br/>nouvelle pré-auth"]:::call\n click P call pay("cap40","POST","/payments/{ref}/captures")\n click R call pay("reauth6","POST","/payments")',
    warn:"Sans token ici, le reste est perdu (ni 2ᵉ capture, ni ré-auth)."},
   {h:'Sans token · avec capture · capture multiple ON',axes:[['preAuth:true','on'],['MANUAL','on'],['sans token',''],['multi-capture ON','acc']],
    why:"Comme le cas token + multi-capture, mais sans repli : tu peux capturer partiellement puis ajuster, sauf qu'une hausse refusée reste sans solution (pas de complément sans token).",
    d:'flowchart LR\n A["Auth pré-aut"] --> P["POST /captures<br/>partielle"]:::call\n P --> B["POST /amount"]:::call\n B --> U{"Adyen accepte ?"}\n U -->|OK| U1["Montant augmenté"]\n U -->|KO| U2["Montant initial conservé"]\n click P call pay("cap40","POST","/payments/{ref}/captures")\n click B call pay("amt12","POST","/payments/{ref}/amount")'}
 ]},
 {tag:'#2740',title:'Prolongation de validité',lead:"Étendre la durée d'une autorisation (caution), montant inchangé. Appel /extend avec un reason.",schemas:[
   {h:'Avec token · sans capture',axes:[['preAuth:true','on'],['MANUAL','on'],['token','on']],
    why:"Ta caution va expirer et tu veux la garder valide plus longtemps, sans changer le montant. Si Adyen refuse (ou si c'est déjà expiré), tu repars sur une (nouvelle) autorisation via le token.",
    d:'flowchart LR\n A["Auth pré-aut"] --> E["POST /extend"]:::call\n E --> R{"Adyen accepte ?"}\n R -->|OK| OK["Durée prolongée"]\n R -->|KO / expirée| S["POST /payments<br/>auth sur token"]:::call\n S --> S1["Nouvelle auth"]\n click E call pay("extend","POST","/payments/{ref}/extend")\n click S call pay("reauth10","POST","/payments")',
    info:"<code class='inl'>reason</code> possibles : <code class='inl'>DELAYED_CHARGE</code>, <code class='inl'>NO_SHOW</code>, <code class='inl'>INSTALLMENT</code>."},
   {h:'Sans token · sans capture',axes:[['preAuth:true','on'],['MANUAL','on'],['sans token','']],
    why:"Pareil, mais sans token pas de repli : si la prolongation est refusée, la durée initiale reste et tu ne peux pas ré-autoriser.",
    d:'flowchart LR\n A["Auth pré-aut"] --> E["POST /extend"]:::call\n E --> R{"Adyen accepte ?"}\n R -->|OK| OK["Durée prolongée"]\n R -->|KO| K["Durée initiale conservée"]\n click E call pay("extend","POST","/payments/{ref}/extend")'},
   {h:'Avec token · avec capture · capture multiple ON',axes:[['preAuth:true','on'],['MANUAL','on'],['token','on'],['multi-capture ON','acc']],
    why:"Tu as déjà capturé une partie et tu prolonges le reste de la caution. Repli sur token si le extend est refusé.",
    d:'flowchart LR\n A["Auth pré-aut"] --> P["POST /captures<br/>partielle"]:::call\n P --> E["POST /extend"]:::call\n E --> R{"Adyen accepte ?"}\n R -->|OK| OK["Nouvelle validité"]\n R -->|KO| S["POST /payments<br/>2e auth"]:::call\n S --> Sa["Auth + nouvelle"]\n click P call pay("cap40","POST","/payments/{ref}/captures")\n click E call pay("extend","POST","/payments/{ref}/extend")\n click S call pay("reauth10","POST","/payments")'},
   {h:'Avec/sans token · avec capture · capture multiple OFF',axes:[['preAuth:true','on'],['MANUAL','on'],['multi-capture OFF','acc']],
    why:"Même piège que l'ajustement : la capture partielle clôture l'autorisation, donc plus de prolongation. Seule suite : ré-autoriser sur le token.",
    d:'flowchart LR\n A["Auth pré-aut"] --> P["POST /captures<br/>partielle"]:::call\n P --> X["Clôturée"]\n X --> R["POST /payments<br/>nouvelle pré-auth"]:::call\n click P call pay("cap40","POST","/payments/{ref}/captures")\n click R call pay("reauth10","POST","/payments")'},
   {h:'Sans token · avec capture · capture multiple ON',axes:[['preAuth:true','on'],['MANUAL','on'],['sans token',''],['multi-capture ON','acc']],
    why:"Comme le cas token + multi-capture, mais sans repli : tu captures une partie puis tu prolonges le reste ; si le extend est refusé, la durée initiale reste et tu ne peux pas ré-autoriser (pas de token).",
    d:'flowchart LR\n A["Auth pré-aut"] --> P["POST /captures<br/>partielle"]:::call\n P --> E["POST /extend"]:::call\n E --> R{"Adyen accepte ?"}\n R -->|OK| OK["Nouvelle validité"]\n R -->|KO| K["Durée initiale conservée"]\n click P call pay("cap40","POST","/payments/{ref}/captures")\n click E call pay("extend","POST","/payments/{ref}/extend")',
    warn:"Sans token, un extend refusé est sans recours (pas de ré-auth)."}
 ]},
 {tag:'#2565',title:'Capture totale',lead:"Encaisser l'intégralité. Vaut pour la pré-aut comme la finale (seule l'ouverture de session change) — à une nuance près : sur une autorisation finale, l'ajustement /amount n'existe pas, un dépassement passe directement par une ré-autorisation sur token (ou est impossible sans token).",schemas:[
   {h:'Avec token',axes:[['MANUAL','on'],['token','on']],
    why:"Tu encaisses tout d'un coup. Si le montant à encaisser dépasse l'autorisé, tu ajustes à la hausse ; et si Adyen refuse la hausse, le token permet d'autoriser le manquant à part.",
    d:'flowchart LR\n A["Autorisation"] --> C["POST /captures<br/>totale"]:::call\n C --> M{"Montant vs autorisé"}\n M -->|exact| T["Capture totale"]\n M -->|supérieur| ADJ["POST /amount<br/>hausse"]:::call\n ADJ -->|OK| T2["Capture du nouveau montant"]\n ADJ -->|KO| RE["POST /payments<br/>complément"]:::call\n RE --> T3["Capture + 2e auth"]\n click C call pay("capTotal","POST","/payments/{ref}/captures")\n click ADJ call pay("amt12","POST","/payments/{ref}/amount")\n click RE call pay("compl2","POST","/payments")',
    info:"Ce schéma vaut pour une <b>pré-autorisation</b>. Sur une <b>autorisation finale</b>, l'ajustement <code class='inl'>/amount</code> n'est pas disponible : un dépassement passe directement par une <b>ré-autorisation sur token</b> (ou est impossible sans token)."},
   {h:'Sans token',axes:[['MANUAL','on'],['sans token','']],
    why:"Capture totale simple. Mais si l'encaissement dépasse l'autorisé et qu'Adyen refuse la hausse, impossible d'aller au-delà (pas de complément sans token).",
    d:'flowchart LR\n A["Autorisation"] --> C["POST /captures<br/>totale"]:::call\n C --> M{"Montant vs autorisé"}\n M -->|exact| T["Capture totale"]\n M -->|supérieur| ADJ["POST /amount<br/>hausse"]:::call\n ADJ -->|OK| T2["Capture du nouveau montant"]\n ADJ -->|KO| X["Au-delà impossible<br/>sans token"]\n click C call pay("capTotal","POST","/payments/{ref}/captures")\n click ADJ call pay("amt12","POST","/payments/{ref}/amount")',
    warn:"Pour dépasser l'autorisé en cas de refus, ouvre la session <b>avec token</b>."}
 ]},
 {tag:'#2565',title:'Capture partielle',lead:'Encaisser en plusieurs fois. Le nombre de captures dépend du réglage capture multiple du compte.',schemas:[
   {h:'Avec/sans token · capture multiple ON',axes:[['MANUAL','on'],['multi-capture ON','acc']],
    why:"Tu encaisses par tranches tant que la somme reste ≤ l'autorisé. Quand tu as fini, tu clôtures le solde non capturé (sinon il se clôt seul quand la somme atteint l'autorisé).",
    d:'flowchart LR\n A["Autorisation"] --> C1["POST /captures<br/>tranche 1"]:::call\n C1 --> C2["POST /captures<br/>tranche 2…"]:::call\n C2 --> Z["POST /cancels<br/>clôturer le solde"]:::call\n Z --> ZF["Clôturée"]\n click C1 call pay("cap40","POST","/payments/{ref}/captures")\n click C2 call pay("cap40","POST","/payments/{ref}/captures")\n click Z call pay("cancel","POST","/payments/{ref}/cancels")'},
   {h:'Avec token · capture multiple OFF',axes:[['MANUAL','on'],['token','on'],['multi-capture OFF','acc']],
    why:"Une seule capture possible : elle clôture l'autorisation. Pour encaisser le reste, tu ré-autorises le solde sur le token.",
    d:'flowchart LR\n A["Autorisation"] --> C["POST /captures<br/>partielle"]:::call\n C --> X["Clôturée"]\n X --> R["POST /payments<br/>reste sur token"]:::call\n click C call pay("cap40","POST","/payments/{ref}/captures")\n click R call pay("reste6","POST","/payments")'},
   {h:'Sans token · capture multiple OFF',axes:[['MANUAL','on'],['sans token',''],['multi-capture OFF','acc']],
    why:"Le pire cas : une capture partielle clôture l'autorisation et le solde non capturé est définitivement perdu (ni 2ᵉ capture, ni ré-auth sans token).",
    d:'flowchart LR\n A["Autorisation"] --> C["POST /captures<br/>partielle"]:::call\n C --> X["Clôturée<br/>reste perdu"]\n click C call pay("cap40","POST","/payments/{ref}/captures")',
    warn:"À éviter si un reliquat est probable."}
 ]},
 {tag:'#2566',title:'Clôture / Annulation',lead:"Libérer la partie non capturée d'une autorisation. Pré-aut comme finale. Appel /cancels.",schemas:[
   {h:'Sans capture (avec ou sans token)',axes:[['MANUAL','on']],
    why:"Tu renonces au paiement avant tout encaissement : l'autorisation est annulée et les fonds du client sont libérés.",
    d:'flowchart LR\n A["Autorisation"] --> D["POST /cancels<br/>clôture totale"]:::call\n D -->|OK| Z["Clôturée / annulée"]\n D -->|KO| E["Toujours en cours"]\n click D call pay("cancel","POST","/payments/{ref}/cancels")'},
   {h:'Avec capture partielle',axes:[['MANUAL','on']],
    why:"Tu as encaissé une partie et tu libères le reste : seule la part non capturée est annulée ; le montant déjà capturé reste dû (et pourra être remboursé).",
    d:'flowchart LR\n A["Autorisation"] --> C["POST /captures<br/>partielle"]:::call\n C --> D["POST /cancels<br/>clôture du restant"]:::call\n D --> Z["Partiellement clôturée"]\n click C call pay("cap40","POST","/payments/{ref}/captures")\n click D call pay("cancel","POST","/payments/{ref}/cancels")',
    info:"La clôture n'annule que la part <b>non capturée</b>."}
 ]},
 {tag:'#2567',title:'Remboursement',lead:"Rendre tout ou partie d'un montant déjà capturé. Appel /refunds (montant obligatoire).",schemas:[
   {h:'Remboursement total',axes:[['capturé','on']],
    why:"Le paiement est capturé et tu rends tout au client, en un appel.",
    d:'flowchart LR\n A["Capturé"] --> R["POST /refunds<br/>total"]:::call\n R -->|OK| Z["Remboursé"]\n R -->|KO| E["Reste capturé"]\n click R call pay("refundTotal","POST","/payments/{ref}/refunds")'},
   {h:'Remboursement partiel (en plusieurs fois)',axes:[['capturé','on']],
    why:"Tu rembourses par morceaux ; tant que la somme cumulée ne dépasse pas le capturé, ça passe. Un remboursement qui ferait dépasser le total capturé est refusé.",
    d:'flowchart LR\n A["Capturé 100,00"] --> R1["POST /refunds<br/>tranche 1"]:::call\n R1 --> R2["POST /refunds<br/>tranche 2…"]:::call\n R2 --> T["Total remboursé"]\n R1 -->|dépasserait| KO["Refusé"]\n click R1 call pay("refund30","POST","/payments/{ref}/refunds")\n click R2 call pay("refund30","POST","/payments/{ref}/refunds")',
    warn:"Un remboursement dont la somme cumulée dépasse le capturé est refusé."}
 ]},
 {tag:'#2548',title:'Tokenisation simple',lead:"Enregistrer un moyen de paiement sans débiter (session à montant 0), pour l'utiliser plus tard.",schemas:[
   {h:'Tokeniser puis réutiliser',axes:[['montant 0','on'],['token','on']],
    why:"Tu enregistres la carte du client sans rien débiter (session à 0). Le token obtenu peut ensuite être révoqué, ou servir à autoriser un paiement plus tard (initié marchand).",
    d:'flowchart LR\n A["Client"] --> S["POST /sessions<br/>montant 0 + token"]:::call\n S --> T{"Token créé ?"}\n T -->|OK| Tok["Token disponible"]\n T -->|KO| F["Échec"]\n Tok --> R["DELETE<br/>/stored-payment-methods"]:::call\n Tok --> Uu["POST /payments<br/>utiliser (MIT)"]:::call\n click S call pay("tokenise","POST","/sessions")\n click R call pay("","DELETE","/stored-payment-methods/{token}")\n click Uu call pay("mit10","POST","/payments")'}
 ]},
 {tag:'#2822',title:'Annulation d\'order (ANCV + CB)',lead:"Défaire un paiement composite (plusieurs moyens sur un même achat) en inversant chaque jambe. Appel /orders/{orderPspReference}/reversals.",schemas:[
   {h:'Order composite ANCV + carte',axes:[['ANCV + carte','on'],['1 seul appel','on']],
    why:"Un achat payé 40 € en ANCV + 60 € en carte forme un « order ». On ne peut pas appeler le /orders/cancel natif d\'Adyen (il exige un orderData jamais visible via le Drop-in, périmètre PCI) : un seul appel retrouve les deux jambes et les inverse chacune. La carte revient toujours ; la jambe ANCV seulement dans les 4h.",
    d:'flowchart LR\n A["ORDER_CLOSED<br/>orderPspRef reçu"] --> R["POST /orders/{ref}<br/>/reversals"]:::call\n R --> RES["Résolution<br/>des 2 jambes"]\n RES --> CB["Jambe carte<br/>reversée"]\n RES --> AN{"Jambe ANCV<br/>dans les 4h ?"}\n AN -->|oui| K1["ANCV reversée"]\n AN -->|non| K2["ANCV refusée"]\n CB --> S["Réponse par jambe<br/>+ status"]\n K1 --> S\n K2 --> S\n click R call pay("cancel","POST","/orders/{orderPspReference}/reversals")',
    warn:"Jambe ANCV hors des 4h → elle ressort <b>REFUSED</b> pendant que la carte est bien inversée : <code class=\'inl\'>status</code> global = <b>PARTIAL</b>. Rejouable avec la même Idempotency-Key.",
    info:"<code class=\'inl\'>status</code> : RECEIVED (toutes) · PARTIAL (mélange) · FAILED (toutes en échec). Chaque jambe porte son <code class=\'inl\'>outcome</code> (RECEIVED / REFUSED / UNAVAILABLE)."}
 ]}
];
