# HEYFODEP

**Outil de calcul et d'analyse des indicateurs prudentiels de l'UMOA — aboutissant au FODEP (BCEAO).**

Application **100 % hors-ligne** (bureau) : backend + base de données locale embarquée,
aucun accès internet requis pour démarrer ou fonctionner.

> FODEP = *Formulaire de Déclaration Prudentielle* des établissements de crédit et compagnies
> financières de l'UMOA, au titre de l'Instruction BCEAO n°005-08-2017 et du dispositif
> prudentiel (Bâle II/III, en vigueur depuis le 1er janvier 2018). Il regroupe **39 états
> prudentiels (EP01→EP39)**, en millions FCFA, transmis semestriellement à la BCEAO.

## Architecture

Monorepo pnpm — un seul langage : **TypeScript**.

| Élément | Emplacement | Rôle |
|---|---|---|
| Noyau de calcul | `packages/kernel` | Domaine pur, zéro I/O. Registre des **codes DISPRU** (source unique de vérité), calculateurs, normes, arrondi BCEAO. |
| Base de données | `packages/db` | SQLite embarqué (better-sqlite3) + Drizzle ORM. Établissements, arrêtés, saisies, audit. |
| Interop Excel | `packages/excel` | Import/export du classeur FODEP (ExcelJS). |
| Application | `apps/desktop` | Electron (backend local + IPC typé) + React/Vite (UI). |

**Principe d'or** : le noyau de calcul est totalement séparé de l'UI et piloté par les codes
DISPRU. Les indicateurs FODEP sont figés et stricts ; les intermédiaires hors-FODEP sont
isolés (`scope: "intermediaire"`) et tracés.

## Sections (13)

Conformité (EP01) · Solvabilité (EP02) · Fonds propres (EP03–EP07) · APR (EP08) ·
Risque de crédit (EP09–EP20) · Risque opérationnel (EP21–EP24) · Risque de marché (EP25–EP28) ·
Grands risques (EP29–EP32) · Ratio de levier (EP33) · Réglementation des opérations (EP34–EP39).

## Démarrage (développement)

```bash
pnpm install
pnpm test        # tests du noyau de calcul
pnpm dev         # lance l'application Electron
```

## État d'avancement

- [x] Fondation monorepo + charte
- [ ] Tranche verticale : **Fonds propres + Solvabilité** (EP02–EP04, EP08 stub)
- [ ] Sections suivantes (crédit, opérationnel, marché, grands risques, levier, opérations)
- [ ] Import/Export FODEP complet (42 feuilles)
