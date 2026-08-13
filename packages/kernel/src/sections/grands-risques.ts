import { Decimal } from "../core/money";
import { evaluate } from "../dispru/registry";

export interface GrandsRisquesAnalyse {
  totalExpositions: Decimal;
  ratioGlobal: Decimal;
  limiteReglementaire: Decimal; // Ex: 800% ou 8x
}

export function analyseGrandsRisques(inputs: Record<string, number | string | Decimal>): GrandsRisquesAnalyse {
  const valeurs = evaluate(inputs);
  const getVal = (code: string) => valeurs.get(code) || new Decimal(0);

  return {
    totalExpositions: getVal("EP40_TOTAL_EXPOSITIONS"),
    ratioGlobal: getVal("EP40_RATIO_GLOBAL"),
    limiteReglementaire: new Decimal(800), // 8 fois les fonds propres
  };
}
