import type { DispruDef, PostSign } from "../core/types";
import { Decimal } from "../core/money";

// ============================================================================
// CATÉGORIES D'EXPOSITIONS (LIGNES)
// ============================================================================
export const CATEGORIES_EXPOSITIONS = [
  { id: "SOUV", label: "Souverains", paragraphes: ["114-118"] },
  { id: "OP", label: "Organismes publics hors administration centrale", paragraphes: ["119-122"] },
  { id: "BMD", label: "Banques multilatérales de développement", paragraphes: ["123-127"] },
  { id: "IF", label: "Institutions financières", paragraphes: ["128-131"] },
  { id: "ENT", label: "Entreprises", paragraphes: ["132-134"] },
  { id: "DET", label: "Clientèle de détail", paragraphes: ["135-141"] },
  { id: "PIR", label: "Prêts garantis par l'immobilier résidentiel", paragraphes: ["142-145"] },
  { id: "PIC", label: "Prêts garantis par l'immobilier commercial", paragraphes: ["146-149"] },
  { id: "CS", label: "Créances en souffrance", paragraphes: ["152-160"] },
  { id: "CRE", label: "Créances à risque élevé", paragraphes: ["161"] },
  { id: "AA", label: "Autres actifs", paragraphes: ["162-163"] },
];

const S = "risque-credit";

function input(code: string, ep: string, label: string, paragraphes?: string[], sign: PostSign = "normal"): DispruDef {
  return { code, ep, label, section: S, unit: "MFCFA", kind: "input", scope: "fodep", sign, paragraphes };
}

export const risqueCreditCodes: DispruDef[] = [];

// ============================================================================
// EP09 : Exposition totale au bilan
// ============================================================================
const EP09 = "EP09";
CATEGORIES_EXPOSITIONS.forEach(cat => {
  // Inputs
  risqueCreditCodes.push(input(`${EP09}_${cat.id}_BRUT`, EP09, `Exposition brute - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP09}_${cat.id}_CS`, EP09, `Créances en souffrance - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP09}_${cat.id}_CRE`, EP09, `Créances à risque élevé - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP09}_${cat.id}_PROV`, EP09, `(-) Provisions - ${cat.label}`, cat.paragraphes, "deduction"));
  risqueCreditCodes.push(input(`${EP09}_${cat.id}_DED`, EP09, `(-) Eléments déduits des fonds propres - ${cat.label}`, cat.paragraphes, "deduction"));
  
  // Computed : Nette = Brut - Prov - Ded
  risqueCreditCodes.push({
    code: `${EP09}_${cat.id}_NET`,
    ep: EP09,
    label: `Exposition nette - ${cat.label}`,
    section: S,
    unit: "MFCFA",
    kind: "computed",
    scope: "fodep",
    deps: [`${EP09}_${cat.id}_BRUT`, `${EP09}_${cat.id}_PROV`, `${EP09}_${cat.id}_DED`],
    formula: (ctx) => {
      return ctx.get(`${EP09}_${cat.id}_BRUT`)
        .minus(ctx.get(`${EP09}_${cat.id}_PROV`).abs())
        .minus(ctx.get(`${EP09}_${cat.id}_DED`).abs());
    }
  });
});

// ============================================================================
// EP10 : Engagements totaux hors bilan
// ============================================================================
const EP10 = "EP10";
CATEGORIES_EXPOSITIONS.forEach(cat => {
  risqueCreditCodes.push(input(`${EP10}_${cat.id}_BRUT_AVANT`, EP10, `Exposition brute avant FCEC - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP10}_${cat.id}_BRUT_APRES`, EP10, `Exposition brute après FCEC - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP10}_${cat.id}_PROV`, EP10, `(-) Provisions - ${cat.label}`, cat.paragraphes, "deduction"));
  
  risqueCreditCodes.push({
    code: `${EP10}_${cat.id}_NET`,
    ep: EP10,
    label: `Exposition nette - ${cat.label}`,
    section: S,
    unit: "MFCFA",
    kind: "computed",
    scope: "fodep",
    deps: [`${EP10}_${cat.id}_BRUT_APRES`, `${EP10}_${cat.id}_PROV`],
    formula: (ctx) => {
      return ctx.get(`${EP10}_${cat.id}_BRUT_APRES`)
        .minus(ctx.get(`${EP10}_${cat.id}_PROV`).abs());
    }
  });
});

// ============================================================================
// EP11 : Expositions au risque de contrepartie
// ============================================================================
const EP11 = "EP11";
CATEGORIES_EXPOSITIONS.forEach(cat => {
  risqueCreditCodes.push(input(`${EP11}_${cat.id}_CR`, EP11, `Coût de Remplacement - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP11}_${cat.id}_EFP`, EP11, `Exposition Future Potentielle - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push({
    code: `${EP11}_${cat.id}_NET`,
    ep: EP11,
    label: `Exposition nette - ${cat.label}`,
    section: S,
    unit: "MFCFA",
    kind: "computed",
    scope: "fodep",
    deps: [`${EP11}_${cat.id}_CR`, `${EP11}_${cat.id}_EFP`],
    formula: (ctx) => {
      const cr = ctx.get(`${EP11}_${cat.id}_CR`).toNumber();
      const efp = ctx.get(`${EP11}_${cat.id}_EFP`);
      // Le CR ne peut être négatif dans la méthode de l'exposition courante
      return new Decimal(Math.max(0, cr)).plus(efp);
    }
  });
});

// ============================================================================
// EP12 à EP20 : Actifs Pondérés (On va faire un state générique "EP_APR")
// Les colonnes: Expo nette avant ARC, Ajustement ARC, Expo après ARC, Pondération (%), APR
// ============================================================================
const EP_APR = "EP12_20";
CATEGORIES_EXPOSITIONS.forEach(cat => {
  risqueCreditCodes.push(input(`${EP_APR}_${cat.id}_AVANT_ARC`, EP_APR, `Exposition nette avant ARC - ${cat.label}`, cat.paragraphes));
  risqueCreditCodes.push(input(`${EP_APR}_${cat.id}_AJUST_ARC`, EP_APR, `(+/-) Ajustement pour ARC - ${cat.label}`, cat.paragraphes));
  
  risqueCreditCodes.push({
    code: `${EP_APR}_${cat.id}_APRES_ARC`,
    ep: EP_APR,
    label: `Exposition après ARC - ${cat.label}`,
    section: S,
    unit: "MFCFA",
    kind: "computed",
    scope: "fodep",
    deps: [`${EP_APR}_${cat.id}_AVANT_ARC`, `${EP_APR}_${cat.id}_AJUST_ARC`],
    formula: (ctx) => {
      return ctx.get(`${EP_APR}_${cat.id}_AVANT_ARC`).plus(ctx.get(`${EP_APR}_${cat.id}_AJUST_ARC`));
    }
  });

  risqueCreditCodes.push({
    code: `${EP_APR}_${cat.id}_POND`,
    ep: EP_APR,
    label: `Pondération (%) - ${cat.label}`,
    section: S,
    unit: "PCT",
    kind: "input",
    scope: "fodep",
    paragraphes: cat.paragraphes
  });

  risqueCreditCodes.push({
    code: `${EP_APR}_${cat.id}_APR`,
    ep: EP_APR,
    label: `Actifs pondérés - ${cat.label}`,
    section: S,
    unit: "MFCFA",
    kind: "computed",
    scope: "fodep",
    deps: [`${EP_APR}_${cat.id}_APRES_ARC`, `${EP_APR}_${cat.id}_POND`],
    formula: (ctx) => {
      const apres = ctx.get(`${EP_APR}_${cat.id}_APRES_ARC`);
      const pond = ctx.get(`${EP_APR}_${cat.id}_POND`);
      return apres.mul(pond).div(100);
    }
  });
});

// ============================================================================
// TOTAL APR CRÉDIT
// ============================================================================
risqueCreditCodes.push({
  code: "RC_TOTAL_APR",
  ep: "TOTAL",
  label: "TOTAL ACTIFS PONDÉRÉS RISQUE DE CRÉDIT",
  section: S,
  unit: "MFCFA",
  kind: "computed",
  scope: "fodep",
  deps: CATEGORIES_EXPOSITIONS.map(c => `${EP_APR}_${c.id}_APR`),
  formula: (ctx) => {
    let total = ctx.get(`${EP_APR}_${CATEGORIES_EXPOSITIONS[0]!.id}_APR`).mul(0); // Zero Decimal
    CATEGORIES_EXPOSITIONS.forEach(c => {
      total = total.plus(ctx.get(`${EP_APR}_${c.id}_APR`));
    });
    return total;
  }
});
