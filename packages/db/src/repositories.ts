import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Db } from "./client";
import {
  arretes,
  auditLog,
  etablissements,
  parametres,
  saisies,
  snapshots,
  type Arrete,
  type Etablissement,
  type Parametre,
  type Saisie,
} from "./schema";

export interface Repositories {
  etablissements: {
    create(input: { nom: string; type?: string; devise?: string }): Promise<Etablissement>;
    list(): Promise<Etablissement[]>;
    get(id: string): Promise<Etablissement | undefined>;
  };
  arretes: {
    create(input: { etablissementId: string; dateArrete: string; base?: string }): Promise<Arrete>;
    listByEtablissement(etablissementId: string): Promise<Arrete[]>;
    get(id: string): Promise<Arrete | undefined>;
    setStatut(id: string, statut: "brouillon" | "valide"): Promise<void>;
  };
  saisies: {
    listByArrete(arreteId: string): Promise<Saisie[]>;
    /** Retourne les saisies sous forme { codeDispru: valeur } pour alimenter le kernel. */
    asInputRecord(arreteId: string): Promise<Record<string, string>>;
    upsert(input: { arreteId: string; codeDispru: string; valeur: string; source?: string | null }): Promise<void>;
    upsertMany(arreteId: string, entries: Array<{ codeDispru: string; valeur: string; source?: string | null }>): Promise<void>;
  };
  snapshots: {
    create(arreteId: string, payload: unknown): Promise<string>;
  };
  audit: {
    log(input: { action: string; cible?: string; details?: unknown; utilisateur?: string }): Promise<void>;
    recent(limit?: number): Promise<Array<typeof auditLog.$inferSelect>>;
  };
  parametres: {
    get(cle: string, annee: number): Promise<Parametre | undefined>;
    set(cle: string, annee: number, valeur: unknown): Promise<void>;
  };
}

export function makeRepositories(db: Db): Repositories {
  return {
    etablissements: {
      async create({ nom, type = "banque", devise = "XOF" }) {
        const row = { id: randomUUID(), nom, type, devise, createdAt: Date.now() };
        await db.insert(etablissements).values(row);
        return row;
      },
      async list() {
        return await db.select().from(etablissements).orderBy(etablissements.nom);
      },
      async get(id) {
        const res = await db.select().from(etablissements).where(eq(etablissements.id, id));
        return res[0];
      },
    },

    arretes: {
      async create({ etablissementId, dateArrete, base = "individuelle" }) {
        const ts = Date.now();
        const row = {
          id: randomUUID(),
          etablissementId,
          dateArrete,
          base,
          statut: "brouillon",
          createdAt: ts,
          updatedAt: ts,
        } as Arrete;
        await db.insert(arretes).values(row);
        return row;
      },
      async listByEtablissement(etablissementId) {
        return await db
          .select()
          .from(arretes)
          .where(eq(arretes.etablissementId, etablissementId))
          .orderBy(desc(arretes.dateArrete));
      },
      async get(id) {
        const res = await db.select().from(arretes).where(eq(arretes.id, id));
        return res[0];
      },
      async setStatut(id, statut) {
        await db.update(arretes).set({ statut, updatedAt: Date.now() }).where(eq(arretes.id, id));
      },
    },

    saisies: {
      async listByArrete(arreteId) {
        return await db.select().from(saisies).where(eq(saisies.arreteId, arreteId));
      },
      async asInputRecord(arreteId) {
        const rows = await db.select().from(saisies).where(eq(saisies.arreteId, arreteId));
        const out: Record<string, string> = {};
        for (const r of rows) out[r.codeDispru] = r.valeur;
        return out;
      },
      async upsert({ arreteId, codeDispru, valeur, source = null }) {
        await db
          .insert(saisies)
          .values({ id: randomUUID(), arreteId, codeDispru, valeur, source, updatedAt: Date.now() })
          .onConflictDoUpdate({
            target: [saisies.arreteId, saisies.codeDispru],
            set: { valeur, source, updatedAt: Date.now() },
          });
      },
      async upsertMany(arreteId, entries) {
        await db.transaction(async (tx) => {
          const ts = Date.now();
          for (const e of entries) {
            await tx
              .insert(saisies)
              .values({
                id: randomUUID(),
                arreteId,
                codeDispru: e.codeDispru,
                valeur: e.valeur,
                source: e.source ?? null,
                updatedAt: ts,
              })
              .onConflictDoUpdate({
                target: [saisies.arreteId, saisies.codeDispru],
                set: { valeur: e.valeur, source: e.source ?? null, updatedAt: ts },
              });
          }
        });
      },
    },

    snapshots: {
      async create(arreteId, payload) {
        const id = randomUUID();
        await db
          .insert(snapshots)
          .values({ id, arreteId, createdAt: Date.now(), payload: JSON.stringify(payload) });
        return id;
      },
    },

    audit: {
      async log({ action, cible, details, utilisateur = "local" }) {
        await db
          .insert(auditLog)
          .values({
            id: randomUUID(),
            ts: Date.now(),
            utilisateur,
            action,
            cible: cible ?? null,
            details: details === undefined ? null : JSON.stringify(details),
          });
      },
      async recent(limit = 100) {
        return await db.select().from(auditLog).orderBy(desc(auditLog.ts)).limit(limit);
      },
    },

    parametres: {
      async get(cle, annee) {
        const res = await db
          .select()
          .from(parametres)
          .where(and(eq(parametres.cle, cle), eq(parametres.annee, annee)));
        return res[0];
      },
      async set(cle, annee, valeur) {
        await db
          .insert(parametres)
          .values({ id: randomUUID(), cle, annee, valeur: JSON.stringify(valeur), updatedAt: Date.now() })
          .onConflictDoUpdate({
            target: [parametres.cle, parametres.annee],
            set: { valeur: JSON.stringify(valeur), updatedAt: Date.now() },
          });
      },
    },
  };
}
