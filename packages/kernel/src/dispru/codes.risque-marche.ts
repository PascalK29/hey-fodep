import { type DispruDef, type EvalCtx } from "../core/types";
import { Decimal } from "../core/money";

const S = "risque-marche";

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
// EP25 & EP26: Risque de Taux d'intérêt
// ----------------------------------------------------------------------------
const EP25_CODES: DispruDef[] = [
  input("EP25_TAUX_SPECIFIQUE", "EP25", "Risque Spécifique - Titres de créance"),
  input("EP25_TAUX_GENERAL", "EP25", "Risque Général - Titres de créance"),
  computed("EP26_EXIGENCE_TAUX", "EP26", "Exigence pour risque de taux", ["EP25_TAUX_SPECIFIQUE", "EP25_TAUX_GENERAL"], "Specifique + General", (ctx) => {
    return (ctx.get("EP25_TAUX_SPECIFIQUE")?.toNumber() || 0) + (ctx.get("EP25_TAUX_GENERAL")?.toNumber() || 0);
  })
];

// ----------------------------------------------------------------------------
// EP27 & EP28: Risque sur Titres de Propriété (Actions)
// ----------------------------------------------------------------------------
const EP27_CODES: DispruDef[] = [
  input("EP27_ACTIONS_SPECIFIQUE", "EP27", "Risque Spécifique - Actions"),
  input("EP27_ACTIONS_GENERAL", "EP27", "Risque Général - Actions"),
  computed("EP28_EXIGENCE_ACTIONS", "EP28", "Exigence pour risque sur actions", ["EP27_ACTIONS_SPECIFIQUE", "EP27_ACTIONS_GENERAL"], "Specifique + General", (ctx) => {
    return (ctx.get("EP27_ACTIONS_SPECIFIQUE")?.toNumber() || 0) + (ctx.get("EP27_ACTIONS_GENERAL")?.toNumber() || 0);
  })
];

// ----------------------------------------------------------------------------
// EP35 & EP36: Risque de Change
// ----------------------------------------------------------------------------
const EP35_CODES: DispruDef[] = [
  input("EP35_CHANGE_POSITION_NETTE", "EP35", "Position Nette Globale de Change"),
  computed("EP36_EXIGENCE_CHANGE", "EP36", "Exigence pour risque de change (8%)", ["EP35_CHANGE_POSITION_NETTE"], "Position * 0.08", (ctx) => {
    return (ctx.get("EP35_CHANGE_POSITION_NETTE")?.toNumber() || 0) * 0.08;
  })
];

// ----------------------------------------------------------------------------
// EP37 & EP38: Risque sur Matières Premières
// ----------------------------------------------------------------------------
const EP37_CODES: DispruDef[] = [
  input("EP37_MATPREM_POSITION_BRUTE", "EP37", "Position brute Matières Premières"),
  input("EP37_MATPREM_POSITION", "EP37", "Position nette Matières Premières"),
  computed("EP38_EXIGENCE_MATPREM", "EP38", "Exigence pour risque matières premières (15% brut + 3% net)", ["EP37_MATPREM_POSITION_BRUTE", "EP37_MATPREM_POSITION"], "Brut * 0.15 + Net * 0.03", (ctx) => {
    const brut = ctx.get("EP37_MATPREM_POSITION_BRUTE")?.toNumber() || 0;
    const net = ctx.get("EP37_MATPREM_POSITION")?.toNumber() || 0;
    return (brut * 0.15) + (net * 0.03);
  })
];

// ----------------------------------------------------------------------------
// EP39: Total Risque de Marché
// ----------------------------------------------------------------------------
const EP39_CODES: DispruDef[] = [
  computed("EP39_TOTAL_EXIGENCE", "EP39", "Exigences totales pour risques de marché", [
    "EP26_EXIGENCE_TAUX", 
    "EP28_EXIGENCE_ACTIONS", 
    "EP36_EXIGENCE_CHANGE", 
    "EP38_EXIGENCE_MATPREM"
  ], "Somme des exigences", (ctx) => {
    return (ctx.get("EP26_EXIGENCE_TAUX")?.toNumber() || 0) +
           (ctx.get("EP28_EXIGENCE_ACTIONS")?.toNumber() || 0) +
           (ctx.get("EP36_EXIGENCE_CHANGE")?.toNumber() || 0) +
           (ctx.get("EP38_EXIGENCE_MATPREM")?.toNumber() || 0);
  }),
  computed("EP39_TOTAL_APR", "EP39", "Actifs pondérés totaux (Risque de Marché)", ["EP39_TOTAL_EXIGENCE"], "Exigences * 12.5", (ctx) => {
    return (ctx.get("EP39_TOTAL_EXIGENCE")?.toNumber() || 0) * 12.5;
  })
];

export const risqueMarcheCodes: DispruDef[] = [
  ...EP25_CODES,
  ...EP27_CODES,
  ...EP35_CODES,
  ...EP37_CODES,
  ...EP39_CODES,
];
