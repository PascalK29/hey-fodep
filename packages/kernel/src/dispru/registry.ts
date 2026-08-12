import { Decimal } from "../core/money";
import type { DispruDef } from "../core/types";
import { fondsPropresCodes } from "./codes.fonds-propres";
import { solvabiliteCodes } from "./codes.solvabilite";

/** Tous les postes DISPRU connus du noyau (source unique de vérité). */
export const ALL_DEFS: DispruDef[] = [...fondsPropresCodes, ...solvabiliteCodes];

/** Index code -> définition. */
export const REGISTRY: ReadonlyMap<string, DispruDef> = new Map(
  ALL_DEFS.map((def) => [def.code, def]),
);

export function getDef(code: string): DispruDef | undefined {
  return REGISTRY.get(code);
}

/**
 * Tri topologique des postes selon leurs dépendances (deps).
 * Détecte les cycles (formule circulaire = erreur de configuration).
 */
export function topoSort(defs: DispruDef[] = ALL_DEFS): string[] {
  const byCode = new Map(defs.map((d) => [d.code, d]));
  const order: string[] = [];
  const state = new Map<string, "visiting" | "done">();

  const visit = (code: string, path: string[]): void => {
    const st = state.get(code);
    if (st === "done") return;
    if (st === "visiting") {
      throw new Error(`Dépendance circulaire détectée : ${[...path, code].join(" -> ")}`);
    }
    const def = byCode.get(code);
    if (!def) return; // dépendance externe non déclarée : ignorée (traitée comme 0)
    state.set(code, "visiting");
    for (const dep of def.deps ?? []) visit(dep, [...path, code]);
    state.set(code, "done");
    order.push(code);
  };

  for (const def of defs) visit(def.code, []);
  return order;
}

export interface ValidationIssue {
  code: string;
  label: string;
  message: string;
}

/**
 * Contrôle de cohérence des saisies : les postes de déduction (« (-) ») ne peuvent
 * porter de valeur strictement positive (instruction générale FODEP §3.3).
 */
export function validateInputs(
  inputs: Record<string, Decimal.Value>,
  defs: DispruDef[] = ALL_DEFS,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const def of defs) {
    if (def.kind !== "input" || def.sign !== "deduction") continue;
    const raw = inputs[def.code];
    if (raw === undefined || raw === null || raw === "") continue;
    if (new Decimal(raw).gt(0)) {
      issues.push({
        code: def.code,
        label: def.label,
        message: "Un poste de déduction « (-) » ne peut porter de valeur positive.",
      });
    }
  }
  return issues;
}

/**
 * Évalue l'ensemble des postes calculés à partir des saisies.
 * Déterministe : résout le graphe de dépendances puis applique les formules dans l'ordre.
 */
export function evaluate(
  inputs: Record<string, Decimal.Value>,
  defs: DispruDef[] = ALL_DEFS,
): Map<string, Decimal> {
  const values = new Map<string, Decimal>();

  // 1) Amorcer les postes saisis.
  for (const def of defs) {
    if (def.kind === "input") {
      values.set(def.code, new Decimal(inputs[def.code] ?? 0));
    }
  }

  // 2) Calculer les postes dérivés dans l'ordre topologique.
  const ctx = { get: (c: string) => values.get(c) ?? new Decimal(0) };
  for (const code of topoSort(defs)) {
    const def = REGISTRY.get(code);
    if (def?.kind === "computed" && def.formula) {
      values.set(code, def.formula(ctx));
    }
  }

  return values;
}
