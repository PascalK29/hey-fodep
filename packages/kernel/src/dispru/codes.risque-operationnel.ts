import { type DispruDef, type EvalCtx } from "../core/types";
import { Decimal } from "../core/money";

const S = "risque-operationnel";

function input(code: string, ep: string, label: string): DispruDef {
  return { code, ep, label, section: S, unit: "MFCFA", kind: "input", scope: "fodep" };
}

function computed(code: string, ep: string, label: string, deps: string[], _formula: string, customCalc?: (ctx: EvalCtx) => any): DispruDef {
  return { 
    code, 
    ep, 
    label, 
    section: S, 
    unit: "MFCFA", 
    kind: "computed", 
    scope: "fodep", 
    deps, 
    formula: (ctx) => {
      if (customCalc) return new Decimal(customCalc(ctx));
      let result = deps.length > 0 ? ctx.get(deps[0]!) : ctx.get(code);
      return result;
    }
  };
}

// ----------------------------------------------------------------------------
// EP21: Risque Opérationnel - Approche Indicateur de Base (AIB)
// ----------------------------------------------------------------------------
const EP21_CODES: DispruDef[] = [
  input("EP21_PB_N1", "EP21", "Produit brut - Année n-1"),
  input("EP21_PB_N2", "EP21", "Produit brut - Année n-2"),
  input("EP21_PB_N3", "EP21", "Produit brut - Année n-3"),
  computed("EP21_MOYENNE_PB", "EP21", "Moyenne des produits bruts positifs", ["EP21_PB_N1", "EP21_PB_N2", "EP21_PB_N3"], "average(PB_N1, PB_N2, PB_N3)", (ctx) => {
    const p1 = ctx.get("EP21_PB_N1")?.toNumber() || 0;
    const p2 = ctx.get("EP21_PB_N2")?.toNumber() || 0;
    const p3 = ctx.get("EP21_PB_N3")?.toNumber() || 0;
    let sum = 0;
    let count = 0;
    if (p1 > 0) { sum += p1; count++; }
    if (p2 > 0) { sum += p2; count++; }
    if (p3 > 0) { sum += p3; count++; }
    return count > 0 ? sum / count : 0;
  }),
  computed("EP21_EXIGENCE", "EP21", "Exigence de fonds propres (15%)", ["EP21_MOYENNE_PB"], "EP21_MOYENNE_PB * 0.15", (ctx) => {
    return (ctx.get("EP21_MOYENNE_PB")?.toNumber() || 0) * 0.15;
  }),
  computed("EP21_APR", "EP21", "Actifs pondérés des risques", ["EP21_EXIGENCE"], "EP21_EXIGENCE * 12.5", (ctx) => {
    return (ctx.get("EP21_EXIGENCE")?.toNumber() || 0) * 12.5;
  })
];

// ----------------------------------------------------------------------------
// EP22 & EP24: Pertes (Catégories d'événements)
// ----------------------------------------------------------------------------
export const CATEGORIES_PERTES = [
  { id: "FI", label: "Fraude interne" },
  { id: "FE", label: "Fraude externe" },
  { id: "PE", label: "Pratiques en matière d'emploi et sécurité" },
  { id: "CP", label: "Clients, produits et pratiques commerciales" },
  { id: "DA", label: "Dommages aux actifs physiques" },
  { id: "IA", label: "Interruption d'activité et pannes de systèmes" },
  { id: "EL", label: "Exécution, livraison et gestion des processus" },
];

const EP22_CODES: DispruDef[] = CATEGORIES_PERTES.flatMap(cat => [
  { code: `EP22_${cat.id}_NB`, ep: "EP22", label: `Nombre d'événements - ${cat.label}`, section: S, unit: "MFCFA", kind: "input", scope: "fodep" },
  { code: `EP22_${cat.id}_MONTANT`, ep: "EP22", label: `Montant total - ${cat.label}`, section: S, unit: "MFCFA", kind: "input", scope: "fodep" },
  { code: `EP22_${cat.id}_MAX`, ep: "EP22", label: `Perte indiv. maximale - ${cat.label}`, section: S, unit: "MFCFA", kind: "input", scope: "fodep" },
  { code: `EP22_${cat.id}_TOP5`, ep: "EP22", label: `Somme des 5 plus grandes - ${cat.label}`, section: S, unit: "MFCFA", kind: "input", scope: "fodep" },
]);

// ----------------------------------------------------------------------------
// EP23: Approche Standard (AS) par ligne de métier
// ----------------------------------------------------------------------------
export const LIGNES_METIER_AS = [
  { id: "FE", label: "Financement d'entreprise", beta: 0.18 },
  { id: "VC", label: "Vente et courtage", beta: 0.18 },
  { id: "BD", label: "Banque de détail", beta: 0.12 },
  { id: "BC", label: "Banque commerciale", beta: 0.15 },
  { id: "PR", label: "Paiements et règlements", beta: 0.18 },
  { id: "SA", label: "Services d'agence", beta: 0.15 },
  { id: "GA", label: "Gestion d'actifs", beta: 0.12 },
  { id: "CD", label: "Courtage de détail", beta: 0.12 },
];

const EP23_CODES: DispruDef[] = LIGNES_METIER_AS.flatMap(lm => [
  input(`EP23_${lm.id}_PB_N1`, "EP23", `PB Année n-1 - ${lm.label}`),
  input(`EP23_${lm.id}_PB_N2`, "EP23", `PB Année n-2 - ${lm.label}`),
  input(`EP23_${lm.id}_PB_N3`, "EP23", `PB Année n-3 - ${lm.label}`),
  computed(`EP23_${lm.id}_PB_MOY`, "EP23", `PB Moyen - ${lm.label}`, [`EP23_${lm.id}_PB_N1`, `EP23_${lm.id}_PB_N2`, `EP23_${lm.id}_PB_N3`], "average", (ctx) => {
    const p1 = ctx.get(`EP23_${lm.id}_PB_N1`)?.toNumber() || 0;
    const p2 = ctx.get(`EP23_${lm.id}_PB_N2`)?.toNumber() || 0;
    const p3 = ctx.get(`EP23_${lm.id}_PB_N3`)?.toNumber() || 0;
    // Approche standard: la somme pour la ligne de métier prend aussi en compte les valeurs négatives,
    // mais si le total de toutes les lignes pour l'année est négatif, il est exclu du numérateur ou mis à 0. 
    // Pour simplifier ici, on fait la moyenne brute.
    return (p1 + p2 + p3) / 3;
  }),
  computed(`EP23_${lm.id}_EXIGENCE`, "EP23", `Exigence - ${lm.label}`, [`EP23_${lm.id}_PB_MOY`], `PB_MOY * ${lm.beta}`, (ctx) => {
    const moy = ctx.get(`EP23_${lm.id}_PB_MOY`)?.toNumber() || 0;
    return Math.max(0, moy) * lm.beta;
  })
]);

// Totaux EP23
EP23_CODES.push(computed(
  "EP23_TOTAL_EXIGENCE", "EP23", "Exigence globale AS", 
  LIGNES_METIER_AS.map(lm => `EP23_${lm.id}_EXIGENCE`), 
  "sum(Exigences)", 
  (ctx) => {
    return LIGNES_METIER_AS.reduce((acc, lm) => acc + (ctx.get(`EP23_${lm.id}_EXIGENCE`)?.toNumber() || 0), 0);
  }
));
EP23_CODES.push(computed(
  "EP23_TOTAL_APR", "EP23", "Actifs pondérés totaux AS", 
  ["EP23_TOTAL_EXIGENCE"], 
  "Exigence globale * 12.5", 
  (ctx) => {
    return (ctx.get("EP23_TOTAL_EXIGENCE")?.toNumber() || 0) * 12.5;
  }
));

export const risqueOperationnelCodes: DispruDef[] = [
  ...EP21_CODES,
  ...EP22_CODES,
  ...EP23_CODES,
];
