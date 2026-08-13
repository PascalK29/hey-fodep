import { Decimal } from "../core/money";
import { evaluate } from "../dispru/registry";

export interface RisqueOperationnelAnalyse {
  exigenceAIB: Decimal;
  aprAIB: Decimal;
  exigenceAS: Decimal;
  aprAS: Decimal;
}

export function analyseRisqueOperationnel(inputs: Record<string, number | string | Decimal>): RisqueOperationnelAnalyse {
  const valeurs = evaluate(inputs);
  const getVal = (code: string) => valeurs.get(code) || new Decimal(0);

  return {
    exigenceAIB: getVal("EP21_EXIGENCE"),
    aprAIB: getVal("EP21_APR"),
    exigenceAS: getVal("EP23_TOTAL_EXIGENCE"),
    aprAS: getVal("EP23_TOTAL_APR"),
  };
}
