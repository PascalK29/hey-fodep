import type { Client } from "@libsql/client";

/**
 * DDL idempotent appliqué à l'ouverture de la base. Aligné sur schema.ts.
 * (Migration minimaliste, sans dépendance à drizzle-kit — robuste et hors-ligne.)
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS etablissements (
     id          TEXT PRIMARY KEY,
     nom         TEXT NOT NULL,
     type        TEXT NOT NULL DEFAULT 'banque',
     devise      TEXT NOT NULL DEFAULT 'XOF',
     created_at  INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS arretes (
     id                TEXT PRIMARY KEY,
     etablissement_id  TEXT NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
     date_arrete       TEXT NOT NULL,
     base              TEXT NOT NULL DEFAULT 'individuelle',
     statut            TEXT NOT NULL DEFAULT 'brouillon',
     created_at        INTEGER NOT NULL,
     updated_at        INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_arretes_etab ON arretes(etablissement_id)`,
  `CREATE TABLE IF NOT EXISTS saisies (
     id           TEXT PRIMARY KEY,
     arrete_id    TEXT NOT NULL REFERENCES arretes(id) ON DELETE CASCADE,
     code_dispru  TEXT NOT NULL,
     valeur       TEXT NOT NULL DEFAULT '0',
     source       TEXT,
     updated_at   INTEGER NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_saisies_arrete_code ON saisies(arrete_id, code_dispru)`,
  `CREATE TABLE IF NOT EXISTS snapshots (
     id          TEXT PRIMARY KEY,
     arrete_id   TEXT NOT NULL REFERENCES arretes(id) ON DELETE CASCADE,
     created_at  INTEGER NOT NULL,
     payload     TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
     id           TEXT PRIMARY KEY,
     ts           INTEGER NOT NULL,
     utilisateur  TEXT NOT NULL DEFAULT 'local',
     action       TEXT NOT NULL,
     cible        TEXT,
     details      TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts)`,
  `CREATE TABLE IF NOT EXISTS parametres (
     id          TEXT PRIMARY KEY,
     cle         TEXT NOT NULL,
     annee       INTEGER NOT NULL,
     valeur      TEXT NOT NULL,
     updated_at  INTEGER NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_param_cle_annee ON parametres(cle, annee)`,
];

export async function migrate(sqlite: Client): Promise<void> {
  await sqlite.executeMultiple(STATEMENTS.join(";\n"));
}
