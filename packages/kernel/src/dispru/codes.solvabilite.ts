import type { DispruDef } from "../core/types";
import { ratioPercent } from "../core/money";
import { computed } from "./helpers";

/**
 * Ratios de solvabilité (EP02) et total des actifs pondérés des risques (EP08).
 * Source : Notice technique FODEP, sections V et VII ; dispositif prudentiel titre III.
 *
 * EP08 est ici un poste SAISI (stub) : il sera alimenté automatiquement par l'agrégation
 * des APR crédit + marché + opérationnel quand ces sections seront implémentées.
 */

export const APR_TOTAL = "APR_TOTAL";

export const solvabiliteCodes: DispruDef[] = [
  // EP08 — dénominateur des ratios (somme des APR).
  computed({
    code: APR_TOTAL,
    ep: "EP08",
    label: "Total des actifs pondérés des risques (APR)",
    section: "apr",
    unit: "MFCFA",
    deps: ["RC_TOTAL_APR", "EP39_TOTAL_APR", "EP21_APR", "EP23_TOTAL_APR"],
    formula: (ctx) => {
      return ctx.get("RC_TOTAL_APR")
        .plus(ctx.get("EP39_TOTAL_APR"))
        .plus(ctx.get("EP21_APR"))
        .plus(ctx.get("EP23_TOTAL_APR"));
    },
  }),

  // EP02 — ratios de solvabilité (numérateur = fonds propres ; dénominateur = APR).
  computed({
    code: "RS_CET1",
    ep: "EP02",
    label: "Ratio de fonds propres CET1",
    section: "solvabilite",
    unit: "PCT",
    deps: ["FPI22", APR_TOTAL],
    formula: (ctx) => ratioPercent(ctx.get("FPI22"), ctx.get(APR_TOTAL)),
  }),
  computed({
    code: "RS_T1",
    ep: "EP02",
    label: "Ratio de fonds propres T1",
    section: "solvabilite",
    unit: "PCT",
    deps: ["FPI29", APR_TOTAL],
    formula: (ctx) => ratioPercent(ctx.get("FPI29"), ctx.get(APR_TOTAL)),
  }),
  computed({
    code: "RS_TOTAL",
    ep: "EP02",
    label: "Ratio de solvabilité total",
    section: "solvabilite",
    unit: "PCT",
    deps: ["FPI41", APR_TOTAL],
    formula: (ctx) => ratioPercent(ctx.get("FPI41"), ctx.get(APR_TOTAL)),
  }),
];
