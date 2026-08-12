// @heyfodep/db — base locale SQLite (offline) + accès typé (Drizzle).

export { openDatabase, type Db, type DbHandle } from "./client";
export { makeRepositories, type Repositories } from "./repositories";
export { seedDefaults, getSolvaThresholds } from "./seed";
export * as schema from "./schema";
export type {
  Etablissement,
  NewEtablissement,
  Arrete,
  NewArrete,
  Saisie,
  Parametre,
} from "./schema";
