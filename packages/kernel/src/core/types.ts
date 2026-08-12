import type Decimal from "decimal.js";

/** Les 13 sections fonctionnelles de l'outil (regroupent les états EP01→EP39). */
export type SectionId =
  | "conformite"
  | "solvabilite"
  | "fonds-propres"
  | "apr"
  | "risque-credit"
  | "risque-operationnel"
  | "risque-marche"
  | "grands-risques"
  | "ratio-levier"
  | "reglementation-operations";

export type Unit = "MFCFA" | "PCT";

/** Un poste est soit saisi par l'utilisateur, soit calculé par une formule. */
export type DispruKind = "input" | "computed";

/**
 * Isolation stricte : "fodep" = poste réglementaire obligatoire ;
 * "intermediaire" = indicateur hors-FODEP toléré pour faciliter les calculs, tracé à part.
 */
export type DispruScope = "fodep" | "intermediaire";

/**
 * "deduction" : poste dont l'intitulé est précédé de « (-) » dans le FODEP.
 * La notice impose qu'aucune valeur positive n'y figure (valeur <= 0).
 */
export type PostSign = "normal" | "deduction";

export interface EvalCtx {
  get(code: string): Decimal;
}

/**
 * Définition d'un poste identifié par son « code DISPRU » (clé unique du FODEP).
 * C'est la SOURCE UNIQUE DE VÉRITÉ du noyau de calcul.
 */
export interface DispruDef {
  /** Code DISPRU, ex. "FPI22". */
  code: string;
  /** État prudentiel de rattachement, ex. "EP03". */
  ep: string;
  /** Libellé officiel du poste. */
  label: string;
  section: SectionId;
  unit: Unit;
  kind: DispruKind;
  scope: DispruScope;
  /** Contrainte de signe (par défaut "normal"). */
  sign?: PostSign;
  /** Codes dont dépend la formule (obligatoire si kind === "computed"). */
  deps?: string[];
  /** Formule de calcul (obligatoire si kind === "computed"). */
  formula?: (ctx: EvalCtx) => Decimal;
  /** Paragraphes du dispositif prudentiel (traçabilité réglementaire). */
  paragraphes?: string[];
}
