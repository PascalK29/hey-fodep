import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Schéma de la base locale SQLite (offline).
 * NB : le DDL idempotent appliqué au démarrage (migrate.ts) doit rester aligné sur ce schéma.
 */

const now = () => Date.now();

export const etablissements = sqliteTable("etablissements", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  /** 'banque' | 'etablissement_financier' | 'compagnie_financiere' */
  type: text("type").notNull().default("banque"),
  devise: text("devise").notNull().default("XOF"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const arretes = sqliteTable(
  "arretes",
  {
    id: text("id").primaryKey(),
    etablissementId: text("etablissement_id")
      .notNull()
      .references(() => etablissements.id, { onDelete: "cascade" }),
    /** Date d'arrêté comptable, format 'YYYY-MM-DD'. */
    dateArrete: text("date_arrete").notNull(),
    /** 'individuelle' | 'sous_consolidee' | 'consolidee' */
    base: text("base").notNull().default("individuelle"),
    /** 'brouillon' | 'valide' */
    statut: text("statut").notNull().default("brouillon"),
    createdAt: integer("created_at").notNull().$defaultFn(now),
    updatedAt: integer("updated_at").notNull().$defaultFn(now),
  },
  (t) => ({
    byEtab: index("idx_arretes_etab").on(t.etablissementId),
  }),
);

export const saisies = sqliteTable(
  "saisies",
  {
    id: text("id").primaryKey(),
    arreteId: text("arrete_id")
      .notNull()
      .references(() => arretes.id, { onDelete: "cascade" }),
    /** Code DISPRU du poste (clé unique FODEP). */
    codeDispru: text("code_dispru").notNull(),
    /** Valeur en millions de FCFA, stockée en texte décimal (exactitude). */
    valeur: text("valeur").notNull().default("0"),
    /** Colonne « Référence » du FODEP (source de la donnée). */
    source: text("source"),
    updatedAt: integer("updated_at").notNull().$defaultFn(now),
  },
  (t) => ({
    uniqArreteCode: uniqueIndex("uq_saisies_arrete_code").on(t.arreteId, t.codeDispru),
  }),
);

/** Gel d'un arrêté validé : instantané complet des valeurs calculées (audit/historique). */
export const snapshots = sqliteTable("snapshots", {
  id: text("id").primaryKey(),
  arreteId: text("arrete_id")
    .notNull()
    .references(() => arretes.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull().$defaultFn(now),
  /** JSON : { valeurs, ratios, normes, meta }. */
  payload: text("payload").notNull(),
});

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    ts: integer("ts").notNull().$defaultFn(now),
    utilisateur: text("utilisateur").notNull().default("local"),
    action: text("action").notNull(),
    cible: text("cible"),
    details: text("details"),
  },
  (t) => ({
    byTs: index("idx_audit_ts").on(t.ts),
  }),
);

/** Paramètres réglementaires versionnés par année (seuils, coussins, dispositions transitoires). */
export const parametres = sqliteTable(
  "parametres",
  {
    id: text("id").primaryKey(),
    cle: text("cle").notNull(),
    annee: integer("annee").notNull(),
    /** JSON. */
    valeur: text("valeur").notNull(),
    updatedAt: integer("updated_at").notNull().$defaultFn(now),
  },
  (t) => ({
    uniqCleAnnee: uniqueIndex("uq_param_cle_annee").on(t.cle, t.annee),
  }),
);

export const DDL = sql``; // marqueur : voir migrate.ts pour le DDL idempotent.

export type Etablissement = typeof etablissements.$inferSelect;
export type NewEtablissement = typeof etablissements.$inferInsert;
export type Arrete = typeof arretes.$inferSelect;
export type NewArrete = typeof arretes.$inferInsert;
export type Saisie = typeof saisies.$inferSelect;
export type Parametre = typeof parametres.$inferSelect;
