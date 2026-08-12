// @heyfodep/kernel — noyau de calcul prudentiel (domaine pur, zéro I/O).

// Cœur
export * from "./core/types";
export {
  Decimal,
  ZERO,
  d,
  sum,
  ratioPercent,
  roundPercent,
  roundToMillionFCFA,
  type DecimalValue,
  type Money,
} from "./core/money";
export {
  DEFAULT_SOLVA_THRESHOLDS,
  evalNormeMin,
  type NormResult,
  type Situation,
  type SolvabiliteThresholds,
} from "./core/norm";

// Registre DISPRU
export {
  ALL_DEFS,
  REGISTRY,
  getDef,
  evaluate,
  topoSort,
  validateInputs,
  type ValidationIssue,
} from "./dispru/registry";
export { fondsPropresCodes } from "./dispru/codes.fonds-propres";
export { solvabiliteCodes, APR_TOTAL } from "./dispru/codes.solvabilite";

// Sections
export {
  analyseSolvabilite,
  type SolvabiliteAnalyse,
  type FondsPropresBreakdown,
} from "./sections/solvabilite";

/** Métadonnées de version du référentiel prudentiel implémenté. */
export const KERNEL_META = {
  version: "0.1.0",
  dispositif: "Dispositif prudentiel UMOA (Bâle II/III) — en vigueur depuis le 1er janvier 2018",
  instruction: "Instruction BCEAO n°005-08-2017 (FODEP)",
  sectionsImplementees: ["fonds-propres", "solvabilite", "apr"],
} as const;
