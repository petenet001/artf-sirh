# Architecture — Nouveau SIRH (Nuxt 4)

> Document de référence pour la reconstruction propre du projet `artf-rh`.
> Objectif : **une seule façon de faire chaque chose**, des couches nettement
> séparées, un typage de bout en bout, du code documenté et testable.

---

## 1. Principes directeurs

1. **Séparation stricte des couches.** Une donnée traverse toujours le même
   chemin : `API HTTP → couche api/ (repository) → composable → page/composant`.
   Aucune couche ne saute par-dessus une autre (jamais de `$fetch` dans une page).
2. **Une seule source de vérité par donnée.** Pas de re-stockage manuel dans des
   `ref` de ce que `useAsyncData` ou un store détient déjà.
3. **Typage de bout en bout.** Les types sont inférés depuis Zod (`z.infer`) et
   propagés jusqu'aux composants. Zéro `any` non justifié, zéro `as any` en template.
4. **Une seule convention de retour.** Les fonctions de la couche `api/` *throwent*
   en cas d'erreur ; la gestion (toast, log) est centralisée. On n'invente pas
   un format `{ success, data, error }` ad hoc par endroit.
5. **Le backend fait son travail.** Pagination, recherche, tri et filtrage sont
   délégués à l'API, pas reconstruits côté client.
6. **Tout est documenté.** Chaque module a un en-tête JSDoc ; les décisions
   transverses vivent dans ce document et dans les README de dossier.

---

## 2. Stack retenue

| Domaine            | Choix                                   | Note |
|--------------------|------------------------------------------|------|
| Framework          | Nuxt 4 (dossier `app/`)                  | conservé |
| UI                 | `@nuxt/ui` v4                            | conservé |
| État global        | Pinia + `pinia-plugin-persistedstate`   | conservé, mais usage restreint (voir §6) |
| Validation         | Zod (source des types via `z.infer`)    | généralisé à tous les formulaires |
| Auth               | **Couche maison** (voir §8)             | remplace `@sidebase/nuxt-auth` + `next-auth` |
| Images / Polices   | `@nuxt/image`, `@nuxt/fonts`            | conservé |
| i18n               | `@nuxtjs/i18n`                          | **ajouté** dès le départ |
| Qualité            | ESLint + Prettier + `vue-tsc` (typecheck)| renforcé |
| Tests              | Vitest (unitaire) + `@nuxt/test-utils`  | ajouté |

**Dépendances retirées :** `@sidebase/nuxt-auth`, `next-auth` (remplacées par
la couche auth maison, plus légère et plus lisible).

---

## 3. Arborescence cible

```
app/
├── api/                      # COUCHE REPOSITORY — seul endroit où vivent les URLs
│   ├── client.ts             # instance $fetch unique (baseURL, auth, erreurs)
│   ├── agents.ts             # agentsApi.list(), .getById(), .create()…
│   ├── carriere.ts
│   ├── recrutement.ts
│   ├── remuneration.ts
│   ├── absences.ts
│   ├── referentiels.ts       # diplômes, fonctions, directions, services…
│   └── auth.ts
│
├── schemas/                  # Zod — validation ET source des types
│   ├── agent.ts              # export const agentSchema = z.object({...})
│   ├── carriere.ts           #   → export type Agent = z.infer<typeof agentSchema>
│   └── ...
│
├── types/                    # types transverses non dérivés d'un schéma
│   ├── api.ts                # ApiResponse<T>, Paginated<T>, ApiError
│   └── ui.ts                 # types de colonnes de table, items de menu…
│
├── composables/              # logique réactive + orchestration (1 responsabilité)
│   ├── useAgents.ts          # data-fetching via useAsyncData
│   ├── useAgentForm.ts       # logique d'un formulaire (validation, submit)
│   ├── useApiError.ts        # mapping erreur → toast
│   └── useFormatDate.ts
│
├── stores/                   # Pinia — UNIQUEMENT l'état réellement global
│   ├── auth.ts               # session utilisateur courant
│   └── ui.ts                 # préférences UI (sidebar repliée, thème…)
│
├── components/
│   ├── base/                 # primitives transverses
│   │   ├── DataState.vue     # gère loading / empty / error en un seul endroit
│   │   ├── PageHeader.vue
│   │   └── Breadcrumb.vue
│   ├── agent/                # composants par feature (déjà bien amorcé)
│   ├── carriere/
│   └── ...
│
├── pages/                    # arborescence UNIQUE, alignée sur le menu (voir §7)
│   ├── index.vue
│   ├── agents/
│   ├── recrutement/
│   ├── carriere/
│   ├── formation/
│   ├── temps-absences/
│   ├── remuneration/
│   ├── retraite/
│   ├── action-sociale/
│   └── administration/
│
├── layouts/
│   ├── default.vue           # app authentifiée (sidebar + header)
│   └── auth.vue              # écran de connexion
│
├── middleware/
│   └── auth.global.ts        # garde d'authentification globale
│
├── plugins/
│   └── api.client.ts         # injecte le client api configuré (si besoin runtime)
│
├── utils/                    # fonctions PURES, sans état (formatters, helpers)
├── constants/                # menu, listes statiques, clés de config
├── assets/css/
└── app.config.ts

i18n/
└── locales/fr.json           # toutes les chaînes (zéro texte en dur dans le code)
```

**Règle de nommage** : kebab-case pour les dossiers/routes, PascalCase pour les
composants, camelCase pour les fonctions et fichiers de logique. Un seul pluriel
par ressource (`agents`, pas `agent`/`agents` mélangés ; jamais `carriere` ET
`carrieres`).

---

## 4. Couche API (`app/api/`)

C'est la correction la plus importante par rapport à l'existant : **toutes les URLs
vivent ici**, et il n'y a **qu'un seul client HTTP**.

### 4.1 Le client unique

```ts
// app/api/client.ts
import type { ApiError } from '~/types/api'

/**
 * Client HTTP unique de l'application.
 * - injecte le token Bearer
 * - normalise les en-têtes
 * - centralise la gestion des erreurs 401/403
 */
export function createApiClient() {
  const { apiBase } = useRuntimeConfig().public
  const token = useAuthToken() // cookie réactif (voir §8)

  return $fetch.create({
    baseURL: apiBase,
    onRequest({ options }) {
      options.headers = {
        Accept: 'application/json',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...options.headers,
      }
    },
    onResponseError({ response }) {
      if (response.status === 401 || response.status === 403) {
        useAuthStore().clearSession()
        navigateTo('/login', { replace: true })
      }
    },
  })
}
```

> Différence clé avec l'existant : on **ne fait pas** `return response._data`
> dans `onResponse`. On laisse `$fetch` renvoyer le corps normalement et on type
> l'enveloppe (voir §5). Plus prévisible.

### 4.2 Un module par ressource

```ts
// app/api/agents.ts
import type { ApiResponse, Paginated } from '~/types/api'
import type { Agent, AgentInput } from '~/schemas/agent'

/**
 * Repository Agents. Seul endroit autorisé à connaître les routes /agents.
 * Toutes les fonctions throwent en cas d'erreur (gérées en amont).
 */
export const agentsApi = {
  list: (params?: { page?: number; search?: string }) =>
    useApiClient()<Paginated<Agent>>('/agents', { query: params }),

  getById: (id: number) =>
    useApiClient()<ApiResponse<Agent>>(`/agents/${id}`),

  create: (payload: AgentInput) =>
    useApiClient()<ApiResponse<Agent>>('/agents', { method: 'POST', body: payload }),

  update: (id: number, payload: Partial<AgentInput>) =>
    useApiClient()<ApiResponse<Agent>>(`/agents/${id}`, { method: 'PATCH', body: payload }),

  remove: (id: number) =>
    useApiClient()<void>(`/agents/${id}`, { method: 'DELETE' }),
}
```

> Comme l'API est **évolutive** (décision actée), on en profite pour **uniformiser
> les préfixes** côté backend : une ressource = un préfixe. Fini le doublon
> `/agents/{id}/contacts-urgence` vs `/recrutement/agents/{id}/contacts-urgence`.

---

## 5. Types & schémas

L'enveloppe de l'API (style Laravel) est typée une seule fois :

```ts
// app/types/api.ts
export interface ApiResponse<T> { data: T }
export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
}
export interface ApiError { message: string; errors?: Record<string, string[]> }
```

Les entités du domaine sont définies **une seule fois** via Zod, et le type en
est dérivé — plus de double déclaration `models/` + `schema/` :

```ts
// app/schemas/agent.ts
import { z } from 'zod'

export const agentSchema = z.object({
  id: z.number(),
  nom: z.string(),
  prenom: z.string(),
  date_naissance: z.coerce.date(),
  // ...
})

/** Payload de création/édition (sans les champs serveur). */
export const agentInputSchema = agentSchema.omit({ id: true })

export type Agent = z.infer<typeof agentSchema>
export type AgentInput = z.infer<typeof agentInputSchema>
```

Le même `agentInputSchema` sert à valider le formulaire côté UI (`@nuxt/ui`
+ `UForm` accepte un schéma Zod). **Validation et typage partagent une seule
définition.**

---

## 6. Données réactives : composables vs stores

Règle de décision simple :

- **Donnée propre à un écran** (liste d'agents d'une page, fiche affichée) →
  **composable** avec `useAsyncData`/`useFetch`. Pas de store.
- **État réellement global** (utilisateur connecté, préférences UI, référentiels
  mis en cache et réutilisés partout) → **store Pinia**.

L'existant met *tout* en store (≈24 stores), avec du boilerplate
`try/catch/finally + loading` recopié dans chaque action. On supprime ça :
`useAsyncData` gère `pending`, `error` et le cache nativement.

```ts
// app/composables/useAgents.ts
/**
 * Charge et expose la liste paginée des agents.
 * pending/error sont fournis par useAsyncData — aucun ref manuel.
 */
export function useAgents() {
  const page = ref(1)
  const search = ref('')

  const { data, pending, error, refresh } = useAsyncData(
    'agents',
    () => agentsApi.list({ page: page.value, search: search.value }),
    { watch: [page, search] }, // pagination/recherche côté serveur
  )

  return { agents: computed(() => data.value?.data ?? []),
           meta: computed(() => data.value?.meta),
           page, search, pending, error, refresh }
}
```

Le store auth, lui, reste minimal et explicite :

```ts
// app/stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  async function fetchSession() { user.value = (await authApi.me()).data }
  function clearSession() { user.value = null; useAuthToken().value = null }

  return { user, isAuthenticated, fetchSession, clearSession }
})
```

---

## 7. Pages : arborescence unique (fin des doublons)

Le menu latéral est la **structure canonique**. On garde une seule version de
chaque module et on supprime les arbres legacy.

| Module canonique (à garder) | Doublons legacy (à supprimer)                 |
|-----------------------------|-----------------------------------------------|
| `pages/agents/`             | `pages/gestion-agents/`                       |
| `pages/carriere/`           | `pages/carrieres/`                            |
| `pages/action-sociale/`     | `pages/securite-sociale/` (déplacé sous social)|
| `pages/temps-absences/`     | `pages/conges-absences/`                      |
| `pages/remuneration/`       | — (vérifier `parametres.vue` orphelin)        |

Chaque page reste mince : elle orchestre un composable et délègue l'affichage
des états à `DataState`.

```vue
<!-- app/pages/agents/index.vue -->
<script setup lang="ts">
const { agents, pending, error, search } = useAgents()
</script>

<template>
  <div>
    <PageHeader :title="$t('agents.title')" />
    <DataState :pending="pending" :error="error" :empty="!agents.length">
      <AgentTable :agents="agents" v-model:search="search" />
    </DataState>
  </div>
</template>
```

`DataState` centralise le spinner / l'état vide / l'erreur — qui étaient
recopiés à la main dans chaque page de l'ancien projet.

---

## 8. Authentification (couche maison)

Remplace `@sidebase/nuxt-auth` + `next-auth`. ~3 petits fichiers, tout est lisible.

```ts
// app/composables/useAuthToken.ts
/** Token persistant en cookie, réactif et partagé client/serveur. */
export const useAuthToken = () =>
  useCookie<string | null>('auth.token', {
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    secure: !import.meta.dev,
  })
```

```ts
// app/api/auth.ts
export const authApi = {
  login: (body: { email: string; password: string }) =>
    useApiClient()<ApiResponse<{ access_token: string }>>('/login', { method: 'POST', body }),
  logout: () => useApiClient()('/logout', { method: 'POST' }),
  me: () => useApiClient()<ApiResponse<User>>('/user'),
}
```

```ts
// app/middleware/auth.global.ts
/** Redirige vers /login si non authentifié ; protège toutes les routes sauf publiques. */
export default defineNuxtRouteMiddleware((to) => {
  const token = useAuthToken()
  const isPublic = ['/login'].includes(to.path)
  if (!token.value && !isPublic) return navigateTo('/login')
  if (token.value && isPublic) return navigateTo('/')
})
```

Avantages vs l'existant : pas de dépendance lourde, configuration auth **hors
`nuxt.config` codé en dur sur localhost** (tout passe par `runtimeConfig` +
variables d'environnement), contrôle total du refresh et du logout.

---

## 9. Gestion d'erreurs centralisée

Une seule fonction transforme une erreur API en notification utilisateur :

```ts
// app/composables/useApiError.ts
export function useApiError() {
  const toast = useToast()
  return function handle(err: unknown) {
    const e = err as { data?: ApiError }
    toast.add({ title: e.data?.message ?? 'Une erreur est survenue', color: 'error' })
  }
}
```

Les composants ne font plus de `catch {}` vides : ils appellent `handle(err)`.

---

## 10. Configuration & environnement

```ts
// nuxt.config.ts (extrait)
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@pinia/nuxt',
            'pinia-plugin-persistedstate/nuxt', '@nuxt/image',
            '@nuxt/fonts', '@nuxtjs/i18n'],
  runtimeConfig: {
    public: { apiBase: process.env.NUXT_PUBLIC_API_BASE }, // jamais en dur
  },
  i18n: { defaultLocale: 'fr', locales: [{ code: 'fr', file: 'fr.json' }] },
})
```

Un fichier `.env.example` documente les variables attendues (`NUXT_PUBLIC_API_BASE`…).

---

## 11. Qualité & outillage

- **ESLint + Prettier** : formatage et règles unifiés, `lint` + `lint:fix`.
- **Typecheck** : `vue-tsc --noEmit` en script `typecheck`, bloquant en CI.
- **Tests** : Vitest pour les composables et la couche `api/` (mock du client),
  `@nuxt/test-utils` pour quelques tests de composants critiques.
- **Hooks pré-commit** (optionnel) : `lint-staged` + `husky`.
- **CI** : pipeline `install → lint → typecheck → test → build`.

---

## 12. Plan de mise en œuvre proposé

1. **Squelette** : nouveau projet Nuxt 4, modules, structure de dossiers vide,
   client api, types `ApiResponse/Paginated`, auth maison, layout + login.
2. **Module pilote « Agents »** de bout en bout (schéma Zod → api → composable →
   pages liste/fiche/édition → composants), qui sert de **référence** à copier.
3. **Référentiels** (diplômes, fonctions, directions, services) — socle réutilisé.
4. **Modules métier** un à un, dans l'ordre du menu, en réutilisant le patron pilote.
5. **i18n** : externalisation des chaînes au fil de l'eau.
6. **Tests + CI** activés dès le module pilote pour figer les conventions.

---

### Récapitulatif des corrections clés vs l'existant

| Problème existant | Correction |
|-------------------|------------|
| 2 couches API (`useApi` + `$api`) mélangées | 1 client unique + couche `api/` repository |
| Endpoints incohérents par copier-coller | URLs centralisées dans `api/`, préfixes uniformisés |
| Retours `throw` vs `{success,data}` mélangés | 1 convention (throw) + handler d'erreur central |
| `any` / `as any` partout | types Zod inférés, bout en bout |
| Triple couche d'état, sources de vérité floues | `useAsyncData` pour l'écran, Pinia pour le global |
| Modules dupliqués (`carriere`/`carrieres`…) | 1 arborescence alignée sur le menu |
| Filtrage/pagination côté client | délégués au backend |
| Chaînes FR en dur | i18n dès le départ |
| Auth lourde, config en dur localhost | auth maison + `runtimeConfig`/env |
| Pas de tests | Vitest + CI |
