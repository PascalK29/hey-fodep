import { type DispruDef, type EvalCtx } from "../core/types";
import { Decimal } from "../core/money";

const S = "grands-risques";

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
// EP40: Grands Risques
// ----------------------------------------------------------------------------
const EP40_CODES: DispruDef[] = [
  input("EP40_TOTAL_EXPOSITIONS", "EP40", "Total des expositions (Grands Risques)"),
  // Le ratio de division des risques (max 25% FP par signature) se calcule au cas par cas
  // Ratio global (max 8x FP)
  computed("EP40_RATIO_GLOBAL", "EP40", "Ratio global des grands risques", ["EP40_TOTAL_EXPOSITIONS", "FPI42"], "Total Expo / Fonds Propres Effectifs", (ctx) => {
    const fp = ctx.get("FPI42")?.toNumber() || 1; // FPI42 = Total Fonds Propres Nets
    const totalExpo = ctx.get("EP40_TOTAL_EXPOSITIONS")?.toNumber() || 0;
    return fp > 0 ? (totalExpo / fp) * 100 : 0;
  })
];

// Ajout des 5 plus grands risques individuels (limite 25% FP)
for (let i = 1; i <= 5; i++) {
  EP40_CODES.push(input(`EP40_C${i}_EXPO`, "EP40", `Exposition Grand Client ${i}`));
  EP40_CODES.push(computed(`EP40_C${i}_RATIO`, "EP40", `Ratio individuel Client ${i}`, [`EP40_C${i}_EXPO`, "FPI42"], "Expo / FP Nets", (ctx) => {
    const fp = ctx.get("FPI42")?.toNumber() || 1;
    const expo = ctx.get(`EP40_C${i}_EXPO`)?.toNumber() || 0;
    return fp > 0 ? (expo / fp) * 100 : 0;
  }));
}

export const grandsRisquesCodes: DispruDef[] = [
  ...EP40_CODES,
];
