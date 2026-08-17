import type { DispruDef } from "../core/types";
import { input, sumDef } from "./helpers";

/**
 * Calcul des fonds propres sur BASE INDIVIDUELLE (états EP03/EP04).
 * Source : Notice technique FODEP (BCEAO), section VI.1 ; dispositif prudentiel §11-58.
 *
 * CONVENTION DE SIGNE (importante, documentée pour audit) :
 *   La notice impose qu'aucune valeur positive ne figure dans un poste précédé de « (-) »
 *   (instruction générale §3.3). Ces postes de DÉDUCTION sont donc saisis en valeurs <= 0,
 *   et les TOTAUX sont des sommes pures de leurs composantes.
 *   NB : la notice écrit « FPI08 - FPI09 + FPI10 + ... » pour FPI14 ; le « - » isolé devant
 *   FPI09 est une incohérence typographique du document (tous les autres postes « (-) » sont
 *   additionnés). Nous retenons la convention cohérente « déductions négatives + somme pure »,
 *   validée par un contrôle de signe (voir validateInputs). La base consolidée (EP05-EP07),
 *   traitée ultérieurement, sera recalée sur un vrai gabarit FODEP.
 */

const S = "fonds-propres" as const;
const EP = "EP03";

// ── A. Fonds propres de base durs (CET1) ────────────────────────────────────
const cet1Positifs: DispruDef[] = [
  input({ code: "FPI01", ep: EP, label: "Capital social libéré", section: S, paragraphes: ["15", "25"] }),
  input({ code: "FPI02", ep: EP, label: "Primes liées à l'émission des instruments CET1", section: S, paragraphes: ["15"] }),
  input({ code: "FPI03", ep: EP, label: "Réserve spéciale", section: S, paragraphes: ["15"] }),
  input({ code: "FPI04", ep: EP, label: "Autres réserves", section: S, paragraphes: ["15"] }),
  input({ code: "FPI05", ep: EP, label: "Report à nouveau créditeur", section: S, paragraphes: ["15"] }),
  input({ code: "FPI06", ep: EP, label: "Résultat bénéficiaire", section: S, paragraphes: ["16-24"] }),
  input({ code: "FPI07", ep: EP, label: "Éléments de CET1 non admissibles au 1er janvier 2018 (dispositions transitoires)", section: S, paragraphes: ["497-498"] }),
];

const cet1Deductions: DispruDef[] = [
  input({ code: "FPI09", ep: EP, label: "Report à nouveau débiteur", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "FPI10", ep: EP, label: "Résultat déficitaire", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "IM012", ep: EP, label: "Immobilisations incorporelles (nettes d'impôts différés passif)", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "ID009", ep: EP, label: "Impôt différé actif dépendant de la rentabilité future (net d'IDP)", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "PA156", ep: EP, label: "Participations croisées éligibles au CET1", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "PA173", ep: EP, label: "Participations significatives éligibles au CET1 (hors actions ordinaires)", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "FPI11", ep: EP, label: "Réserves de valorisation pour positions moins liquides", section: S, sign: "deduction", paragraphes: ["28", "345-347"] }),
  input({ code: "PA149", ep: EP, label: "Excédent de la limite de participations dans des entités commerciales", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "IM006", ep: EP, label: "Excédent de la limite applicable aux immobilisations hors exploitation", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "IM010", ep: EP, label: "Excédent de la limite applicable au total des immobilisations et participations", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "PR004", ep: EP, label: "Excédent de la limite applicable aux prêts aux actionnaires, dirigeants et personnel", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "FPI12", ep: EP, label: "Expositions sur les établissements disposant de fonds propres négatifs", section: S, sign: "deduction", paragraphes: ["28"] }),
  input({ code: "FPI13", ep: EP, label: "Ajustements réglementaires CET1 (insuffisance AT1 pour couvrir les déductions)", section: S, sign: "deduction", paragraphes: ["28"] }),
];

const cet1Totaux: DispruDef[] = [
  sumDef({ code: "FPI08", ep: EP, label: "Total des fonds propres CET1 avant déductions applicables", section: S, deps: ["FPI01", "FPI02", "FPI03", "FPI04", "FPI05", "FPI06", "FPI07"], paragraphes: ["15-27"] }),
  sumDef({ code: "FPI14", ep: EP, label: "Total des fonds propres CET1 ajustés avant déductions liées à des seuils", section: S, deps: ["FPI08", "FPI09", "FPI10", "IM012", "ID009", "PA156", "PA173", "FPI11", "PA149", "IM006", "IM010", "PR004", "FPI12", "FPI13"], paragraphes: ["28"] }),
  input({ code: "PA163", ep: EP, label: "Participations non significatives éligibles au CET1 (au-delà de 10 %)", section: S, sign: "deduction", paragraphes: ["28"] }),
  sumDef({ code: "FPI15", ep: EP, label: "Total des fonds propres CET1 ajustés des déductions liées aux participations non significatives", section: S, deps: ["FPI14", "PA163"] }),
  input({ code: "PA172", ep: EP, label: "Participations significatives éligibles au CET1 (au-delà de 10 %)", section: S, sign: "deduction", paragraphes: ["28-33"] }),
  input({ code: "ID011", ep: EP, label: "Impôts différés actifs sur différences temporaires (au-delà de 10 %)", section: S, sign: "deduction", paragraphes: ["28-33"] }),
  sumDef({ code: "FPI16", ep: EP, label: "Total des fonds propres CET1 ajustés des déductions liées aux participations significatives et IDA", section: S, deps: ["FPI15", "PA172", "ID011"] }),
  input({ code: "FPI20", ep: EP, label: "Montant dépassant le seuil de 15 % du CET1", section: S, sign: "deduction", paragraphes: ["28-33"] }),
  input({ code: "FPI21", ep: EP, label: "Autres déductions applicables au CET1", section: S, sign: "deduction" }),
  sumDef({ code: "FPI22", ep: EP, label: "TOTAL DES FONDS PROPRES CET1", section: S, deps: ["FPI16", "FPI20", "FPI21"], paragraphes: ["15-33"] }),
];

// ── B. Fonds propres de base additionnels (AT1) ─────────────────────────────
const at1: DispruDef[] = [
  input({ code: "FPI23", ep: EP, label: "Instruments de capital libérés (AT1)", section: S, paragraphes: ["34-35", "47"] }),
  input({ code: "FPI24", ep: EP, label: "Primes liées à l'émission des instruments AT1", section: S, paragraphes: ["34"] }),
  input({ code: "FPI25", ep: EP, label: "Instruments de CET1 non admissibles au 1er janvier 2018 éligibles AT1 (transitoire)", section: S, paragraphes: ["27", "497-498"] }),
  sumDef({ code: "FPI26", ep: EP, label: "Total des fonds propres AT1 avant déductions applicables", section: S, deps: ["FPI23", "FPI24", "FPI25"], paragraphes: ["34-35"] }),
  input({ code: "PA157", ep: EP, label: "Participations croisées éligibles à l'AT1", section: S, sign: "deduction", paragraphes: ["38"] }),
  input({ code: "PA164", ep: EP, label: "Participations non significatives éligibles à l'AT1 (au-delà de 10 %)", section: S, sign: "deduction", paragraphes: ["38"] }),
  input({ code: "PA174", ep: EP, label: "Participations significatives éligibles à l'AT1", section: S, sign: "deduction", paragraphes: ["38"] }),
  input({ code: "FPI27", ep: EP, label: "Ajustements réglementaires AT1 (insuffisance T2 pour couvrir les déductions)", section: S, sign: "deduction", paragraphes: ["38"] }),
  sumDef({ code: "FPI28", ep: EP, label: "TOTAL DES FONDS PROPRES AT1", section: S, deps: ["FPI26", "PA157", "PA164", "PA174", "FPI27"] }),
];

// ── C. Fonds propres de base (T1) ───────────────────────────────────────────
const t1: DispruDef[] = [
  sumDef({ code: "FPI29", ep: EP, label: "TOTAL DES FONDS PROPRES DE BASE T1", section: S, deps: ["FPI22", "FPI28"], paragraphes: ["11-12"] }),
];

// ── D. Fonds propres complémentaires (T2) ───────────────────────────────────
const t2: DispruDef[] = [
  input({ code: "FPI30", ep: EP, label: "Emprunts subordonnés", section: S, paragraphes: ["39-41"] }),
  input({ code: "FPI31", ep: EP, label: "Autres instruments de capital libérés (T2)", section: S, paragraphes: ["39-41"] }),
  input({ code: "FPI32", ep: EP, label: "Primes liées à l'émission des instruments T2", section: S, paragraphes: ["39"] }),
  input({ code: "FPI33", ep: EP, label: "Autres éléments de CET1 non admissibles au 1er janvier 2018 inclus en T2 (transitoire)", section: S, paragraphes: ["27", "497-501"] }),
  input({ code: "FPI34", ep: EP, label: "Éléments de T2 non admissibles au 1er janvier 2018 inclus dans les fonds propres (transitoire)", section: S, paragraphes: ["43", "497-501"] }),
  input({ code: "FPI35", ep: EP, label: "Provisions réglementées", section: S, paragraphes: ["39-40"] }),
  input({ code: "FPI36", ep: EP, label: "Fonds affectés", section: S, paragraphes: ["39-41"] }),
  input({ code: "FPI37", ep: EP, label: "Subventions d'investissement", section: S, paragraphes: ["39-41"] }),
  input({ code: "FPI38", ep: EP, label: "Comptes bloqués d'actionnaires ou d'associés", section: S, paragraphes: ["39-41"] }),
  sumDef({ code: "FPI39", ep: EP, label: "Total des fonds propres T2 avant déductions applicables", section: S, deps: ["FPI30", "FPI31", "FPI32", "FPI33", "FPI34", "FPI35", "FPI36", "FPI37", "FPI38"], paragraphes: ["39-41"] }),
  input({ code: "PA158", ep: EP, label: "Participations croisées éligibles au T2", section: S, sign: "deduction", paragraphes: ["44"] }),
  input({ code: "PA165", ep: EP, label: "Participations non significatives éligibles au T2 (au-delà de 10 %)", section: S, sign: "deduction", paragraphes: ["44"] }),
  input({ code: "PA175", ep: EP, label: "Participations significatives éligibles au T2", section: S, sign: "deduction", paragraphes: ["44"] }),
  sumDef({ code: "FPI40", ep: EP, label: "TOTAL DES FONDS PROPRES T2", section: S, deps: ["FPI39", "PA158", "PA165", "PA175"] }),
];

// ── C. Fonds propres effectifs ──────────────────────────────────────────────
const effectifs: DispruDef[] = [
  sumDef({ code: "FPI41", ep: EP, label: "FONDS PROPRES EFFECTIFS", section: S, deps: ["FPI29", "FPI40"], paragraphes: ["11-12"] }),
  input({ code: "FPI42", ep: EP, label: "Fonds Propres Nets (pour calcul des grands risques)", section: S, paragraphes: ["346"] }),
];

export const fondsPropresCodes: DispruDef[] = [
  ...cet1Positifs,
  ...cet1Deductions,
  ...cet1Totaux,
  ...at1,
  ...t1,
  ...t2,
  ...effectifs,
];
