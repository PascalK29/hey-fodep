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
  // mais globalement (max 8x FP) :
  computed("EP40_RATIO_GLOBAL", "EP40", "Ratio global des grands risques", ["EP40_TOTAL_EXPOSITIONS", "FPI42"], "Total Expo / Fonds Propres Effectifs", (ctx) => {
    const fp = ctx.get("FPI42")?.toNumber() || 1; // FPI42 = Total Fonds Propres Nets
    const totalExpo = ctx.get("EP40_TOTAL_EXPOSITIONS")?.toNumber() || 0;
    return fp > 0 ? (totalExpo / fp) * 100 : 0;
  })
];

export const grandsRisquesCodes: DispruDef[] = [
  ...EP40_CODES,
];
