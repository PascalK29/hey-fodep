import { DEFAULT_SOLVA_THRESHOLDS, type SolvabiliteThresholds } from "@heyfodep/kernel";
import type { Repositories } from "./repositories";

/** Clé des seuils de solvabilité. `annee = 0` = valeur par défaut (fallback). */
const CLE_SEUILS = "solvabilite.seuils";
const ANNEE_DEFAUT = 0;

/** Amorce les paramètres réglementaires par défaut si absents (idempotent). */
export async function seedDefaults(repos: Repositories): Promise<void> {
  if (!(await repos.parametres.get(CLE_SEUILS, ANNEE_DEFAUT))) {
    await repos.parametres.set(CLE_SEUILS, ANNEE_DEFAUT, DEFAULT_SOLVA_THRESHOLDS);
  }
}

/** Récupère les seuils de solvabilité applicables (année précise, sinon défaut). */
export async function getSolvaThresholds(repos: Repositories, annee: number): Promise<SolvabiliteThresholds> {
  const row =
    (await repos.parametres.get(CLE_SEUILS, annee)) ?? (await repos.parametres.get(CLE_SEUILS, ANNEE_DEFAUT));
  if (!row) return DEFAULT_SOLVA_THRESHOLDS;
  try {
    return JSON.parse(row.valeur) as SolvabiliteThresholds;
  } catch {
    return DEFAULT_SOLVA_THRESHOLDS;
  }
}
