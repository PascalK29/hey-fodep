import { Decimal } from "../core/money";
import {
  DEFAULT_SOLVA_THRESHOLDS,
  evalNormeMin,
  type NormResult,
  type SolvabiliteThresholds,
} from "../core/norm";
import { APR_TOTAL } from "../dispru/codes.solvabilite";
import { evaluate, validateInputs, type ValidationIssue } from "../dispru/registry";

export interface FondsPropresBreakdown {
  cet1: Decimal; // FPI22
  at1: Decimal; // FPI28
  t1: Decimal; // FPI29
  t2: Decimal; // FPI40
  effectifs: Decimal; // FPI41
}

export interface SolvabiliteAnalyse {
  fondsPropres: FondsPropresBreakdown;
  apr: Decimal;
  ratios: { cet1: Decimal; t1: Decimal; total: Decimal };
  /** Faux si l'APR est nul : ratios non calculables. */
  computable: boolean;
  normes: NormResult[];
  /** Toutes les valeurs calculées (code DISPRU -> Decimal). */
  valeurs: Map<string, Decimal>;
  /** Anomalies de saisie (ex. déduction positive). */
  anomalies: ValidationIssue[];
}

/**
 * Analyse complète Fonds propres + Solvabilité pour un arrêté.
 * @param inputs saisies (code DISPRU -> valeur), en millions de FCFA.
 * @param thresholds seuils réglementaires (par défaut : minima de base).
 */
export function analyseSolvabilite(
  inputs: Record<string, Decimal.Value>,
  thresholds: SolvabiliteThresholds = DEFAULT_SOLVA_THRESHOLDS,
): SolvabiliteAnalyse {
  const valeurs = evaluate(inputs);
  const get = (c: string): Decimal => valeurs.get(c) ?? new Decimal(0);

  const apr = get(APR_TOTAL);
  const computable = apr.gt(0);

  const fondsPropres: FondsPropresBreakdown = {
    cet1: get("FPI22"),
    at1: get("FPI28"),
    t1: get("FPI29"),
    t2: get("FPI40"),
    effectifs: get("FPI41"),
  };

  const ratios = {
    cet1: get("RS_CET1"),
    t1: get("RS_T1"),
    total: get("RS_TOTAL"),
  };

  const normes: NormResult[] = [
    evalNormeMin({
      code: "SOLVA_CET1",
      libelle: "Ratio de fonds propres CET1",
      reference: "Dispositif prudentiel — Titre III",
      requis: thresholds.cet1,
      observe: ratios.cet1,
      computable,
    }),
    evalNormeMin({
      code: "SOLVA_T1",
      libelle: "Ratio de fonds propres T1",
      reference: "Dispositif prudentiel — Titre III",
      requis: thresholds.t1,
      observe: ratios.t1,
      computable,
    }),
    evalNormeMin({
      code: "SOLVA_TOTAL",
      libelle: "Ratio de solvabilité total",
      reference: "Dispositif prudentiel — Titre III",
      requis: thresholds.total,
      observe: ratios.total,
      computable,
    }),
  ];

  return {
    fondsPropres,
    apr,
    ratios,
    computable,
    normes,
    valeurs,
    anomalies: validateInputs(inputs),
  };
}
