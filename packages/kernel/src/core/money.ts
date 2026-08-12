import Decimal from "decimal.js";

// Précision large : les montants sont en millions de FCFA, on garde de la marge.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };
export type DecimalValue = Decimal.Value;

/** Montant en millions de FCFA (unité de déclaration du FODEP). */
export type Money = Decimal;

export const ZERO = new Decimal(0);

/** Convertit une valeur quelconque en Decimal (null/undefined -> 0). */
export function d(v: DecimalValue | null | undefined): Decimal {
  if (v === null || v === undefined || v === "") return new Decimal(0);
  return new Decimal(v);
}

/** Somme d'une liste de Decimal. */
export function sum(values: Decimal[]): Decimal {
  return values.reduce((a, b) => a.plus(b), new Decimal(0));
}

/**
 * Arrondi BCEAO au million de FCFA (notice FODEP §2.3) :
 * - au million inférieur si les centaines de milliers < 500 000 FCFA ;
 * - au million supérieur si les centaines de milliers >= 500 000 FCFA.
 * Entrée en FCFA, sortie en millions de FCFA (entier).
 */
export function roundToMillionFCFA(valueFCFA: DecimalValue): Decimal {
  return new Decimal(valueFCFA).div(1_000_000).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

/** Arrondi d'un pourcentage à deux décimales (notice FODEP §2.3). */
export function roundPercent(v: DecimalValue): Decimal {
  return new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Ratio en pourcentage (numérateur/dénominateur × 100), 2 décimales. 0 si dénominateur <= 0. */
export function ratioPercent(numerator: Decimal, denominator: Decimal): Decimal {
  if (denominator.lte(0)) return new Decimal(0);
  return roundPercent(numerator.div(denominator).mul(100));
}
