# artf-sirh

SIRH de l'ARTF — front Nuxt 4 + Nuxt UI, architecture propre et testée.
Pour les conventions et l'architecture détaillée, voir [`CLAUDE.md`](./CLAUDE.md).

## Prérequis

- Node 20+
- Une API backend accessible (variable `NUXT_PUBLIC_API_BASE`)

## Installation

```bash
npm install            # ou pnpm install
cp .env.example .env   # puis ajuster NUXT_PUBLIC_API_BASE
```

## Développement

```bash
npm run dev            # http://localhost:3000
```

## Qualité (à lancer avant chaque commit)

```bash
npm run test           # tests unitaires (Vitest)
npm run lint           # ESLint
npm run typecheck      # vérification de types
```

> Règle du projet : une fonctionnalité n'est terminée que lorsqu'elle est testée
> et que `npm run test` passe.

## Structure

```
app/
├── api/            repositories (seul endroit avec des URLs)
├── schemas/        Zod : validation + types métier
├── types/          types transverses (réponses API)
├── composables/    logique réactive (data-fetching, auth, erreurs)
├── stores/         état global (session, UI)
├── components/     base/ (primitives) · app/ (chrome) · <feature>/
├── pages/          routage, pages minces
├── constants/      navigation, colonnes
├── middleware/     gardes de route
├── layouts/        default (app) · auth (login)
└── assets/css/     Tailwind + Nuxt UI
```

## Stack

Nuxt 4 · Nuxt UI v4 · Tailwind v4 · Pinia · Zod · Vitest · ESLint
