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

// Codes
export * from "./dispru/codes.fonds-propres";
export * from "./dispru/codes.solvabilite";
export * from "./dispru/codes.risque-credit";
export * from "./dispru/codes.risque-operationnel";
export * from "./dispru/codes.risque-marche";
export * from "./dispru/codes.grands-risques";

// Sections
export * from "./sections/risque-credit";
export * from "./sections/risque-operationnel";
export * from "./sections/risque-marche";
export * from "./sections/grands-risques";
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
  sectionsImplementees: ["fonds-propres", "solvabilite", "apr", "risque-credit", "risque-operationnel"],
} as const;
