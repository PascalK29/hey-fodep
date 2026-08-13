import type { Decimal } from "../core/money";
import { evaluate } from "../dispru/registry";

export interface RisqueCreditAnalyse {
  valeurs: Map<string, Decimal>;
  totalApr: Decimal;
}

export function analyseRisqueCredit(
  inputs: Record<string, number | string | Decimal>
): RisqueCreditAnalyse {
  // Evaluates all DISPRU codes registered in the system (including risque credit)
  const valeurs = evaluate(inputs);

  // We fetch the calculated total APR for credit risk
  // "RC_TOTAL_APR" is the code we defined in codes.risque-credit.ts
  const totalApr = valeurs.get("RC_TOTAL_APR") || valeurs.get("EP12_20_SOUV_APR") || evaluate({}).get("RC_TOTAL_APR")!; // Fallback if missing during init

  return {
    valeurs,
    totalApr,
  };
}
