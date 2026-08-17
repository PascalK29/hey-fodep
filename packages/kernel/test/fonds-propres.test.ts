import { describe, expect, it } from "vitest";
import { analyseSolvabilite, evaluate, topoSort, validateInputs } from "../src/index";

/**
 * Jeu de valeurs de référence (millions FCFA) — golden master.
 *
 * CET1 positifs : 10000 + 1000 + 2000 = 13000  (FPI08)
 * Déduction IM12 = -500                          -> FPI14 = 12500
 * Déduction PA31 = -200                          -> FPI16 = 12300
 *                                                -> FPI22 (CET1) = 12300
 * AT1 : FPI23 = 1000                             -> FPI28 = 1000
 * T1  : 12300 + 1000                             -> FPI29 = 13300
 * T2  : FPI30 = 800                              -> FPI40 = 800
 * FP effectifs : 13300 + 800                     -> FPI41 = 14100
 */
const INPUTS = {
  FPI01: 10000,
  FPI02: 1000,
  FPI06: 2000,
  IM12: -500,
  PA31: -200,
  FPI23: 1000,
  FPI30: 800,
  APR_TOTAL: 100000,
};

describe("Fonds propres (EP03) — agrégats", () => {
  const v = evaluate(INPUTS);
  const val = (c: string) => v.get(c)!.toNumber();

  it("FPI08 = somme des composantes CET1 positives", () => {
    expect(val("FPI08")).toBe(13000);
  });
  it("FPI14 intègre les déductions (négatives)", () => {
    expect(val("FPI14")).toBe(12500);
  });
  it("FPI22 = TOTAL CET1", () => {
    expect(val("FPI22")).toBe(12300);
  });
  it("FPI28 = TOTAL AT1", () => {
    expect(val("FPI28")).toBe(1000);
  });
  it("FPI29 = TOTAL T1 (CET1 + AT1)", () => {
    expect(val("FPI29")).toBe(13300);
  });
  it("FPI40 = TOTAL T2", () => {
    expect(val("FPI40")).toBe(800);
  });
  it("FPI41 = FONDS PROPRES EFFECTIFS (T1 + T2)", () => {
    expect(val("FPI41")).toBe(14100);
  });
});

describe("Solvabilité (EP02) — ratios et normes", () => {
  it("calcule les ratios à 2 décimales", () => {
    const a = analyseSolvabilite(INPUTS);
    expect(a.ratios.cet1.toNumber()).toBe(12.3); // 12300 / 100000
    expect(a.ratios.t1.toNumber()).toBe(13.3); // 13300 / 100000
    expect(a.ratios.total.toNumber()).toBe(14.1); // 14100 / 100000
  });

  it("verdicts conformes lorsque les seuils sont respectés", () => {
    const a = analyseSolvabilite(INPUTS);
    expect(a.normes.map((n) => n.situation)).toEqual(["conforme", "conforme", "conforme"]);
  });

  it("déclare une infraction lorsque le ratio total passe sous 9 %", () => {
    // APR porté à 200000 -> ratio total = 14100/200000 = 7,05 % < 9 %
    const a = analyseSolvabilite({ ...INPUTS, APR_TOTAL: 200000 });
    expect(a.ratios.total.toNumber()).toBe(7.05);
    const total = a.normes.find((n) => n.code === "SOLVA_TOTAL")!;
    expect(total.situation).toBe("infraction");
  });

  it("marque les ratios non calculables quand l'APR est nul", () => {
    const a = analyseSolvabilite({ ...INPUTS, APR_TOTAL: 0 });
    expect(a.computable).toBe(false);
    expect(a.normes.every((n) => n.situation === "non_calculable")).toBe(true);
  });
});

describe("Cohérence du référentiel", () => {
  it("le graphe DISPRU n'a pas de cycle", () => {
    expect(() => topoSort()).not.toThrow();
  });

  it("détecte une déduction saisie en positif", () => {
    const issues = validateInputs({ IM12: 500 });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe("IM12");
  });

  it("accepte une déduction nulle ou négative", () => {
    expect(validateInputs({ IM12: -500 })).toHaveLength(0);
    expect(validateInputs({ IM12: 0 })).toHaveLength(0);
  });
});
