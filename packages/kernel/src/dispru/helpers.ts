import { Decimal } from "../core/money";
import type { DispruDef, EvalCtx, PostSign, SectionId, Unit } from "../core/types";

/** Somme des valeurs d'une liste de codes dans le contexte d'évaluation. */
export function add(ctx: EvalCtx, codes: string[]): Decimal {
  return codes.reduce((acc, c) => acc.plus(ctx.get(c)), new Decimal(0));
}

interface BaseOpts {
  code: string;
  ep: string;
  label: string;
  section: SectionId;
  unit?: Unit;
  sign?: PostSign;
  paragraphes?: string[];
}

/** Poste saisi (input) — réglementaire FODEP par défaut. */
export function input(o: BaseOpts): DispruDef {
  return {
    kind: "input",
    scope: "fodep",
    unit: o.unit ?? "MFCFA",
    sign: o.sign ?? "normal",
    code: o.code,
    ep: o.ep,
    label: o.label,
    section: o.section,
    paragraphes: o.paragraphes,
  };
}

/** Poste calculé = somme pure d'une liste de codes (convention : déductions déjà négatives). */
export function sumDef(o: BaseOpts & { deps: string[] }): DispruDef {
  return {
    kind: "computed",
    scope: "fodep",
    unit: o.unit ?? "MFCFA",
    sign: o.sign ?? "normal",
    code: o.code,
    ep: o.ep,
    label: o.label,
    section: o.section,
    deps: o.deps,
    formula: (ctx) => add(ctx, o.deps),
    paragraphes: o.paragraphes,
  };
}

/** Poste calculé avec formule personnalisée (ex. ratios). */
export function computed(
  o: BaseOpts & { deps: string[]; formula: (ctx: EvalCtx) => Decimal },
): DispruDef {
  return {
    kind: "computed",
    scope: "fodep",
    unit: o.unit ?? "MFCFA",
    sign: o.sign ?? "normal",
    code: o.code,
    ep: o.ep,
    label: o.label,
    section: o.section,
    deps: o.deps,
    formula: o.formula,
    paragraphes: o.paragraphes,
  };
}
