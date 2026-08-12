import { Decimal } from "./money";

/** Situation d'un établissement au regard d'une norme (EP01). */
export type Situation = "conforme" | "infraction" | "non_calculable";

export interface NormResult {
  /** Identifiant de la norme, ex. "SOLVA_TOTAL". */
  code: string;
  libelle: string;
  /** Référence réglementaire (titre / paragraphes du dispositif). */
  reference: string;
  /** Niveau à respecter (en %). */
  requis: Decimal;
  /** Niveau observé (en %). */
  observe: Decimal;
  situation: Situation;
  /** Faux si le ratio n'est pas calculable (ex. APR = 0). */
  computable: boolean;
}

/**
 * Seuils de solvabilité (en %). Minima de base du dispositif prudentiel (titre III).
 * Le coussin de conservation (2,5 % à terme, phasé) est paramétrable et sera stocké,
 * versionné par année, dans la table `parametres` de la base locale.
 */
export interface SolvabiliteThresholds {
  cet1: number;
  t1: number;
  total: number;
}

export const DEFAULT_SOLVA_THRESHOLDS: SolvabiliteThresholds = {
  cet1: 5,
  t1: 6,
  total: 8,
};

/** Évalue une norme « niveau observé >= niveau requis ». */
export function evalNormeMin(params: {
  code: string;
  libelle: string;
  reference: string;
  requis: Decimal.Value;
  observe: Decimal;
  computable: boolean;
}): NormResult {
  const requis = new Decimal(params.requis);
  const situation: Situation = !params.computable
    ? "non_calculable"
    : params.observe.gte(requis)
      ? "conforme"
      : "infraction";
  return {
    code: params.code,
    libelle: params.libelle,
    reference: params.reference,
    requis,
    observe: params.observe,
    situation,
    computable: params.computable,
  };
}
