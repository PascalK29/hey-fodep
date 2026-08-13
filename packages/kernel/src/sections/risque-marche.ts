import { Decimal } from "../core/money";
import { evaluate } from "../dispru/registry";

export interface RisqueMarcheAnalyse {
  exigenceTaux: Decimal;
  exigenceActions: Decimal;
  exigenceChange: Decimal;
  exigenceMatPrem: Decimal;
  exigenceTotale: Decimal;
  aprTotal: Decimal;
}

export function analyseRisqueMarche(inputs: Record<string, number | string | Decimal>): RisqueMarcheAnalyse {
  const valeurs = evaluate(inputs);
  const getVal = (code: string) => valeurs.get(code) || new Decimal(0);

  return {
    exigenceTaux: getVal("EP26_EXIGENCE_TAUX"),
    exigenceActions: getVal("EP28_EXIGENCE_ACTIONS"),
    exigenceChange: getVal("EP36_EXIGENCE_CHANGE"),
    exigenceMatPrem: getVal("EP38_EXIGENCE_MATPREM"),
    exigenceTotale: getVal("EP39_TOTAL_EXIGENCE"),
    aprTotal: getVal("EP39_TOTAL_APR"),
  };
}
