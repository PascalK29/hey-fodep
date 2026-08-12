import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "./migrate";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

export interface DbHandle {
  db: Db;
  sqlite: Client;
  close(): void;
}

/**
 * Ouvre (ou crée) la base locale SQLite, active les garde-fous et applique le DDL.
 * @param file chemin du fichier .sqlite (":memory:" possible pour les tests).
 */
export async function openDatabase(file: string): Promise<DbHandle> {
  const url = file === ":memory:" ? "file::memory:" : `file:${file}`;
  const sqlite = createClient({ url });
  
  await sqlite.execute("PRAGMA journal_mode = WAL");
  await sqlite.execute("PRAGMA foreign_keys = ON");
  
  await migrate(sqlite);
  
  const db = drizzle(sqlite, { schema });
  return {
    db,
    sqlite,
    close: () => sqlite.close(),
  };
}
