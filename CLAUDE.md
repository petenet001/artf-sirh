# CLAUDE.md — artf-sirh

Guide de référence pour travailler dans ce dépôt. À lire avant toute contribution
(humaine ou assistée). Ce projet est la reconstruction propre du SIRH de l'ARTF.

---

## 1. Vision

SIRH (Système d'Information Ressources Humaines) en SPA Nuxt 4, consommant une API
REST externe (Laravel) en `Bearer`. Priorités, dans l'ordre :

1. **Clarté** — code lisible, découpé, documenté. Pas de fourre-tout, pas de spaghetti.
2. **Légèreté** — le moins de dépendances et d'abstractions possible ; interfaces sobres.
3. **Fiabilité** — **chaque fonctionnalité est testée et validée avant d'être considérée terminée.**

> Règle d'or testing-first : une fonctionnalité sans test n'est pas terminée.
> On écrit/ajuste le test en même temps que le code, et `npm run test` doit passer.

---

## 2. Stack

- **Nuxt 4** (dossier `app/`, `future.compatibilityVersion: 4`)
- **Nuxt UI v4** comme bibliothèque de composants de base (préfixe `U`). Enregistre
  automatiquement `@nuxt/icon`, `@nuxt/fonts`, `@nuxtjs/color-mode` — ne pas les rajouter.
- **Tailwind CSS v4** (importé via `app/assets/css/main.css`)
- **Pinia** + `pinia-plugin-persistedstate` — uniquement pour l'état global
- **Zod** — validation ET source des types métier (`z.infer`)
- **Vitest** + `@nuxt/test-utils` — tests
- **ESLint** (`@nuxt/eslint`) + `vue-tsc` (typecheck)

Auth = **maison** (cookie + composable + middleware), pas de `@sidebase/nuxt-auth`.

---

## 3. Architecture en couches

Le flux d'une donnée est toujours le même, sans saut de couche :

```
API HTTP → app/api/ (repository) → composable → page / composant
```

| Dossier               | Rôle | Règle |
|-----------------------|------|-------|
| `app/types/`          | Types transverses (`ApiResponse`, `Paginated`, `ApiError`) | définis une fois |
| `app/schemas/`        | Schémas Zod par entité + types inférés | **source unique** model+validation |
| `app/api/`            | Repositories (`useAgentsApi`…), **auto-importés** (`imports.dirs`) | **seul** endroit où vivent les URLs |
| `app/composables/`    | Logique réactive, data-fetching (`useAsyncData`) | 1 responsabilité / fichier |
| `app/stores/`         | État **réellement global** (session, UI) | pas un store par entité |
| `app/components/base/`| Primitives transverses (`Panel`, `DataState`, `DefItem`, `CrudManager`) | tuent le boilerplate |
| `app/components/app/` | Chrome applicatif (Sidebar, UserMenu) | |
| `app/components/<feature>/` | Composants métier | par feature |
| `app/pages/`          | Routage, pages minces | délèguent à un composable + `DataState` |
| `app/constants/`      | Navigation, colonnes de table, listes statiques | |
| `app/middleware/`     | Gardes de route | |

Le seul client HTTP est `useApiClient()` (`app/composables/useApiClient.ts`).
**Ne jamais appeler `$fetch` directement** dans une page, un store ou un composant.

---

## 4. Conventions

- **Une seule convention de retour** : les fonctions `api/` *throwent*. La gestion
  d'erreur se fait via `useApiError()` (toast). On n'invente pas de `{ success, data }`.
- **Pas de `any`** non justifié, **jamais de `as any`** en template. Les types
  viennent des schémas Zod.
- **Pas de pagination côté API.** Les endpoints de liste renvoient une
  collection *plate* `{ data: [...] }` (type `ApiCollection<T>`). Le filtrage se
  fait par **égalité exacte** sur des champs whitelistés, passés en query
  (`?nom=...&statut=...`, type `ListParams`). Pas de `meta`, pas de `page`,
  pas de recherche floue ni de tri serveur. Ne jamais filtrer/paginer en mémoire.
- **Dates = `string`** (l'API renvoie/attend des chaînes `Y-m-d` / ISO ; les
  réponses ne sont pas re-parsées par Zod). Ne pas utiliser `z.coerce.date()`.
  **Jamais de date brute à l'écran** : passer par `utils/date.ts` (auto-importé)
  — `formatDate` (`15/08/2026`, tables), `formatDateLong` (`15 août 2026`,
  fiches), `formatDateTime` (horodatages), `formatDateRelative` (fils
  d'activité), `formatMoisAnnee`, `formatPeriode`. Une valeur absente donne
  `—`. En colonne de table : `dateColumn("date_demande", "Demande")`
  (`utils/tableColumns.ts`), qui combine en-tête triable et formatage.
- **Enveloppes** : ressource unique → `ApiResponse<T>` (`{ data, message? }`) ;
  collection → `ApiCollection<T>` (`{ data: T[] }`) ; suppression → `{ message }`.
- **Champs** : nullable en réponse → `.nullable().optional()` ; optionnel en
  entrée → `.nullish()`. Relations imbriquées toujours `.optional()` (chargées
  seulement sur le `show`, jamais sur l'`index`).
- **Nommage** : dossiers/routes en `kebab-case`, composants en `PascalCase`,
  fonctions/fichiers de logique en `camelCase`. Un seul pluriel par ressource
  (`agents`). Jamais deux variantes (`carriere` **et** `carrieres`).
- **i18n** : prévu comme prochaine étape (`@nuxtjs/i18n`). En attendant, garder les
  libellés regroupés et courts pour faciliter l'extraction. Éviter d'éparpiller le texte.
- **Composants** : utiliser Nuxt UI en priorité (`UButton`, `UTable`, `UForm`,
  `UCard`…). Ne créer un composant maison que si Nuxt UI ne couvre pas le besoin.
- **Interfaces légères** : sobriété visuelle, peu de couleurs, espacements réguliers.

---

## 5. Personnel : une seule population (agents)

L'API ne gère **qu'une population : les agents**. Un « stagiaire » n'est pas une
entité distincte — c'est un **agent** dont le *type d'intégration* est
« Stage professionnel » (cf. `TypeIntegrationSeeder`). Il n'existe donc pas
d'endpoint `/stagiaires` (et il n'y en aura pas — choix de modélisation).

- **Agents** : `/personnel/agents` (liste, fiche, **édition**) sur
  `/integration/agents` (authentifié). Socle `personneSchema` + `agentSchema`.
- ⚠️ **La création d'une personne n'existe pas dans Personnel.** On n'« ajoute
  pas un agent » : on **dépose un dossier d'intégration**, et c'est sa
  validation qui fait entrer la personne dans l'effectif. Point d'entrée unique
  `/integration/nouveau`, en deux temps :
  1. **choix du type d'intégration** (agent, stagiaire, consultant… — la liste
     vient du référentiel, elle s'étoffera). Ce choix *plante le décor* : pièces
     obligatoires, circuit de validation, nécessité d'un contrat / d'un compte,
     préfixe de matricule, durée maximale ;
  2. **fiche** (identité, coordonnées, carrière) → bouton **« Soumettre le
     dossier »** (jamais « Créer l'agent »). En coulisse : `POST
     /integration/agents` crée `{ agent, dossier }` en `BROUILLON`, puis la
     transition `soumettre` envoie le dossier en validation ; on atterrit sur
     l'espace du dossier. Si la soumission échoue, le dossier reste en brouillon
     et l'UI le dit (il reste soumettable depuis son espace).
- **Stagiaires** : **vue dérivée** des agents (`useStagiaires`) filtrant sur le
  type d'intégration « Stage professionnel » (id résolu dynamiquement, filtrage
  en mémoire car non exposé côté serveur). Route `/personnel/stagiaires`,
  réutilise les colonnes et les fiches agents. Pas de schéma ni de repo dédié.
- L'**intégration** est un *processus* (menu « Intégration »), pas une population.

---

## 6. Recette : ajouter un module métier

1. **Schéma** dans `app/schemas/<entite>.ts` (Zod) + son `<entite>InputSchema`.
2. **Test du schéma** `app/schemas/<entite>.test.ts` (valide + rejette).
3. **Repository** `app/api/<entite>.ts` (`use<Entite>Api`) — toutes les URLs ici.
4. **Composable** `app/composables/use<Entite>.ts` (`useAsyncData`).
5. **Colonnes** `app/constants/columns/<entite>.ts` si liste.
6. **Page(s)** `app/pages/.../index.vue` — mince, via `DataState`.
7. **Entrée de menu** dans `app/constants/navigation.ts` si nécessaire.
8. **Lancer `npm run test`, `npm run lint`, `npm run typecheck`** → tout doit passer.

---

## 7. Commandes

```bash
npm install            # installer (ou pnpm install)
npm run dev            # serveur de dev
npm run test           # tests (doit passer avant tout commit)
npm run test:watch     # tests en watch
npm run lint           # lint
npm run typecheck      # vérification de types
npm run build          # build production
```

Variable d'environnement requise : `NUXT_PUBLIC_API_BASE` (voir `.env.example`).

### Connexion à l'API en dev : backend local (défaut)

**Par défaut on développe contre le backend Laravel local**, dans
`../project-api-rh-artf` :

```bash
cd ../project-api-rh-artf && php artisan serve   # http://127.0.0.1:8000
```

- `.env` → `NUXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api`. Appel **direct**,
  sans proxy : le CORS de l'API est ouvert (`*`), préflight compris.
- Base **SQLite** (`database/database.sqlite`). Première mise en route :
  `php artisan migrate --seed`. Comptes livrés par `UserSeeder` (domaine
  **`artf.cg`** — corrigé côté API le 2026-09-17, l'ancien `arft.cg` était une
  coquille) : `admin@artf.cg` / `Admin@2026`, `rh@artf.cg` / `Rh@2026`,
  `dg@artf.cg` / `Dg@2026`, `agent@artf.cg` / `Agent@2026`, plus
  `directeur@`, `chef-service@` et `chef-bureau@` sur le même modèle.
- Une requête sans `Accept: application/json` sur une route protégée sort en
  `500` (« Route [login] not defined ») au lieu d'un `401` — c'est un artefact
  de curl, `useApiClient` envoie toujours l'en-tête.

### Tester depuis le réseau local

`npm run dev:host` (= `nuxt dev --host`) expose l'app sur l'IP du poste
(`Network: http://192.168.x.x:3000/`). Pour que les autres postes puissent se
connecter, l'API doit être appelée **via le proxy** et non en direct :
`.env` → `NUXT_PUBLIC_API_BASE=/api`. Leur navigateur ne parle qu'au serveur
Nuxt, qui relaie vers la cible du proxy :
- **API distante** : ne pas définir `API_PROXY_TARGET` (défaut de
  `nuxt.config.ts`) — vérifié le 2026-09-15, login compris ;
- **Laravel local** : `API_PROXY_TARGET=http://127.0.0.1:8000/api` (Laravel reste
  sur `127.0.0.1` ; en appel direct, `127.0.0.1` désignerait *leur* machine).

Autoriser `node` dans le pare-feu macOS au premier lancement.

### API distante : Tiger Protect (WAF o2switch)

Tiger Protect renvoie un challenge (`307`, ou `503` + page « Test de sécurité »,
en-tête `tiger-protect-security`) aux requêtes au **User-Agent de navigateur**,
POST en particulier. D'où le **proxy Nitro qui écrase le `user-agent`**
(`nitro.devProxy`) : au 2026-09-15, `POST /login` avec l'UA navigateur → `307`,
avec l'UA du proxy → réponse Laravel. L'API distante n'est donc utilisable
qu'avec `NUXT_PUBLIC_API_BASE=/api`, jamais en appel direct depuis le navigateur.

- Le comportement du WAF a déjà changé (il a bloqué tous les POST quel que soit
  l'UA) : si le login repart en `503`, repasser sur le backend local.
- Le WAF est **en amont** de l'hébergement : rien dans le compte ne peut le
  désactiver (ni `.htaccess`, ni conf, ni terminal cPanel). Le réglage est dans
  cPanel → *Outils Exclusifs* → **Tiger Protect** (offres Grow / Cloud / Pro),
  sinon ticket au support.
- Dépannage en lecture seule si les POST sont bloqués : émettre un token côté
  serveur (`php artisan tinker` → `createToken`), le poser dans le cookie
  `auth.token`, puis ouvrir `/profil` (qui appelle `fetchSession()`).

> **Prod** : pas de `devProxy` en production. Tiger Protect **doit** être
> désactivé sur l'API avant mise en ligne, sinon chaque navigateur sera
> challengé au login. Définir alors `NUXT_PUBLIC_API_BASE` sur l'URL réelle.

Après toute modif de `.env` ou `nuxt.config.ts` : **relancer** `npm run dev` et
recharger en dur le navigateur (`Ctrl+Shift+R`) — lus uniquement au démarrage.

---

## 8. À faire / à éviter

**Faire** : passer par `api/` pour tout appel réseau ; typer via Zod ; garder les
pages minces ; écrire le test en même temps que le code ; réutiliser `DataState`
et `PageHeader`.

**Éviter** : `$fetch` hors `useApiClient` ; `any`/`as any` ; dupliquer un module ou
une route ; filtrer/paginer en mémoire ; mélanger conventions de retour ; laisser du
code commenté ou des `catch {}` vides.

---

## 9. Alignement API (couche contrat)

La **couche contrat** (schémas Zod + repositories + tests) couvre l'intégralité de
l'API `project-api-rh-artf`. Les **pages/écrans** restent à construire module par
module en s'appuyant sur ces repos (recette §6). Modules alignés :

- **Auth** : `login` (`{ user, token }`), `logout`, `user`. `userSchema` =
  `{ id, name, email, agent_id, is_active, roles[], permissions[] }`. Le store
  expose `can()` / `hasRole()` (permissions aplaties depuis les rôles).
- **Intégration** (préfixe `/integration`, authentifié) : `agents` (+ sous-routes
  contrats/affectations/nominations/remises/compte), `dossiers` (+ transitions de
  workflow, historique, circuit, intégrer), `contrats`, `affectations`,
  `nominations`, `actes-administratifs`, `documents-dossier` (upload `FormData`),
  `validations`, `remises-materiel`, `prises-de-service`, `comptes-integration`.
  **UI livrée** : espace dossier piloté par la machine à états
  (`constants/integration-workflow.ts` = phases, libellés, couleurs, action
  principale par statut), pages `pages/integration/` (liste, `nouveau`,
  `dossiers/[id]`, `validations`) et composants `components/integration/`
  (stepper, badge, pièces, circuit, actes, historique, modales d'action).
  Source de vérité = `dossier.statut`.
- **Structure** : `localites`, `administrations`, `directions`, `services`,
  `bureaux` (+ sous-routes parent→enfants).
- **Référentiels** : `grades`, `categories`, `echelons`, `fonctions`, `diplomes`,
  `types-integrations`, `types-contrats`, `types-documents`, `types-absences`,
  `types-conges`, `motifs-administratifs`.
- **Grille salariale** : `grille-classes`, `grille-parametres` (`current`/`update`),
  `salaires` (`list`/`generate`).
- **Administration** : `users`, `roles` (+ `dupliquer`, `permissions`),
  `permissions`, `audit-logs`, `parametres-application`.
- **Salaires d'agents** (`salaire-agent` + `useSalairesAgentsApi`) : distinct de
  la grille calculée. Routes `/salaires-agents` (CRUD + `cloturer` + `bulletin`
  PDF) et sous-routes agent `/integration/agents/{id}/salaires`
  (`actuel`/`historique`/`bulletin`/`avancer-echelon`). Permissions
  `consulter-salaires` / `gerer-salaires`.
- **Stages** (`convention-stage` + `useStagesApi`) : entité `ConventionStage`
  distincte de la vue dérivée « stagiaires ». `/integration/stages`
  (`prolonger` = **PATCH**, `cloturer`, `attestation` PDF).
- **Circuit de validation** (`circuit-validation`) : configuration du circuit par
  type d'intégration, sous-routes de `useTypesIntegrationsApi()`
  (`circuit`/`remplacerCircuit`/`ajouterNiveau`/`retirerNiveau`).
- Divers : `agents.modifierMatricule` (PATCH), `dossiers.tachesPostIntegration`,
  `typeIntegrationSchema` étendu (`necessite_*`, `prefixe_matricule`,
  `duree_max_mois`, `documents_obligatoires`) + `documents_ids` en entrée.

Enums backend reflétés dans `app/constants/enums.ts` (`StatutDossier`,
`NiveauValidation`, `TypeActeAdministratif`, statut agent — dont `stagiaire`,
genre, `structurable_type`, `StatutSalaireAgent`, `TypeChangementSalaireAgent`,
`TypeStage`, `StatutConventionStage`).

---

## 10. UI : chrome « navbar horizontale » (style maquette E-Facture)

La chrome applicative est une **navbar horizontale sticky pleine largeur** + une
**surface de page centrée** (pas de sidebar), calée trait pour trait sur la
maquette de référence :

- `layouts/default.vue` : fenêtre blanche (`bg-default`), `<AppNavbar>` (sticky,
  pleine largeur), puis `<main>` = **grande surface arrondie centrée**
  (`max-w-[1600px]`, `rounded-xl`, bordure fine, fond `bg-primary/[0.03]`) qui
  contient tout le contenu. Toutes les pages authentifiées passent ici ;
  `login.vue` garde le layout `auth`.
- **`AppNavbar`** (`components/app/Navbar.vue`) : bande de `h-14`, logo + nom de
  marque à gauche (→ 1er module), **séparateur vertical**, puis **onglets =
  modules autorisés** (`useModules().tabs`) — l'onglet actif est en `primary` et
  souligné d'un trait de 3px collé à la bordure basse ; `AppUserMenu` (avatar
  seul, pastille `primary/10`) à l'extrémité droite. Onglets repliés en menu
  déroulant sur mobile.
- **`BasePanel`** : grand titre + sous-titre, slot `#actions` à droite, puis
  **`AppModuleNav`** (sous-navigation du module courant en pastilles — masquée
  pour un module mono-page) et le corps. C'est la coquille de **toutes** les pages
  → restyler `BasePanel`/`BaseStatCard` propage le look partout.
- Les listes passent par **`BaseCrudManager`** (lui-même un `BasePanel`) :
  table `UTable` + modale `UModal` de création/édition + suppression.
- **Formulaires à plusieurs sections** → **`BaseStepperForm`** (`components/base/`) :
  un `UForm` unique + stepper, une section = une étape (slot `#<step.key>`).
  Le passage à l'étape suivante valide d'abord `step.fields` ; une erreur au
  submit ramène à l'étape fautive. Type d'étape : `types/stepper.ts` (`StepperStep`).
  Exemple : `components/agents/Form.vue` (3 étapes), exposé en modale par
  `components/agents/FormModal.vue` (création depuis la liste ; l'édition reste
  sur sa page qui charge la fiche complète).

> Nuxt UI reste utilisé pour les composants « fonctionnels » (tables, formulaires,
> modales, boutons, dropdowns, badges) ; la chrome et les cartes sont en Tailwind.

### Bibliothèque d'éléments de base (maquette HRMS)

Les écrans se composent **uniquement** à partir de ces primitives (`components/base/`),
calées sur la maquette HRMS de référence. Ne pas réinventer une variante locale :
si un besoin manque, on étend la primitive.

| Primitive | Rôle (maquette) |
|---|---|
| `BaseTable` | Liste : barre d'outils (`#filters` à gauche, `#actions` à droite), table encadrée, pied « Affichage [10] — de X à Y sur N » + pagination |
| `BasePersonCell` | Cellule personne : avatar (photo ou initiales) + nom + sous-libellé |
| `BaseRowActions` | Fin de ligne : œil / crayon / corbeille |
| `BaseStepperForm` | Formulaire long : étapes en **onglets à icônes soulignés**, actions groupées en bas à droite (Précédent / Annuler / Suivant / Enregistrer) |
| `BasePhotoField` | Emplacement photo carré des formulaires d'identité |
| `BaseUploadZone` | Dépôt de fichier en pointillés (`UFileUpload` : glisser-déposer, formats acceptés, aperçu du fichier). `v-model` si l'appelant garde le fichier, `@select` + `auto-reset` s'il le dépose aussitôt |
| `BaseProfileHeader` | Carte d'en-tête de fiche : portrait, identité, méta, action principale |
| `BaseSideNav` | Colonne de sections d'une fiche (entrée active en plein `primary`) |
| `BaseDefItem` | Couple libellé/valeur des fiches : libellé discret au-dessus, séparateur fin |
| `BaseGroupCard` + `BaseGroupRow` | Carte « groupe » (direction/service/bureau) : titre + effectif + « Voir tout » + lignes membres |
| `BaseStatCard` | Chiffre clé : pastille d'icône, point de statut, libellé, valeur |

Règles d'application :

- **Liste** : la table porte sa propre barre d'outils. Le CTA de création vit dans
  `#actions` de la table (pas dans l'en-tête de page). Une population = un
  composant de table partagé (ex. `AgentsTable` pour agents **et** stagiaires) :
  les deux écrans doivent être visuellement identiques.
- **Création/édition d'une entité riche** → **page dédiée** (`/…/nouveau`,
  `/…/modifier`) avec `BaseStepperForm`. La **modale** reste réservée aux
  référentiels (`BaseCrudManager`), dont le formulaire tient en quelques champs.
- **Un seul point d'entrée par acte métier** : une liste ne porte un CTA de
  création que si *elle* est le bon endroit pour créer. Les listes Personnel
  (agents, stagiaires) n'en ont **pas** — l'arrivée d'une personne passe par
  `/integration/nouveau` (§5).
- **Fiche** : `BaseProfileHeader` puis grille `[240px_1fr]` = `BaseSideNav` +
  carte de détail en `BaseDefItem` (2 colonnes).
- **Aucun contrôle décoratif** : si l'API ne sait pas encore recevoir une donnée
  (ex. la photo d'agent — ni `agentInputSchema` ni `agentUpdateSchema` ne
  l'acceptent), l'emplacement est rendu **inactif** (`disabled`) avec sa légende
  d'explication, jamais un champ qui laisserait croire à un enregistrement.
- **Recherche et pagination des listes = client** (`BaseTable`), sur la
  collection plate déjà reçue ; les **filtres métier** (`#filters`) restent des
  égalités exactes envoyées à l'API (§4). Ne pas confondre les deux.

### Identité de marque ARTF

- **Couleurs** : échelles `artf` (bleu `#0F4C81`) et `artfred` (rouge `#ed1c24`)
  définies dans `assets/css/main.css` et câblées dans `app.config.ts`
  (`primary: "artf"`, `secondary: "artfred"`, `neutral: "slate"`). Aucune couleur
  de marque n'est écrite en dur ailleurs : tout passe par les jetons
  (`bg-primary`, `text-muted`, `bg-inverted`…), donc ces trois lignes suffisent à
  repeindre l'application.
- **Gabarit des contrôles** : taille globale `md`
  (`nuxt.config.ts` → `ui.theme.defaultVariants.size`) ; **boutons et champs de
  saisie** montent à `lg` avec un `py-2.5` supplémentaire (`app.config.ts`) —
  ce sont les éléments les plus manipulés, ils doivent rester confortables.
  Badges, tables et pastilles restent compacts.
  ⚠️ Les échelles maison sont déclarées en **`@theme static`** — obligatoire :
  Tailwind v4 élague toute variable de thème inutilisée par une classe, et le
  plugin de couleurs Nuxt UI résout `var(--color-artf-N, )` **sans fallback**
  pour une palette maison → nuance élaguée = valeur vide = **fond transparent**.
- **Libellés de marque** : `constants/branding.ts` (nom, logo, accroche…) —
  source unique, jamais de texte de marque en dur dans un composant.
- **Police** : `Ubuntu` (via `--font-sans`, téléchargée par `@nuxt/fonts`).
- **Mode clair uniquement** : pas de thème sombre (`colorMode` forcé `light`
  dans `nuxt.config.ts` + plugin `force-light.client.ts`).
- **Cartes** : blanches, `rounded-xl`, bordure fine + ombre douce (`shadow-sm`) ;
  `BaseStatCard` = pastille d'icône teintée + point de statut + libellé + valeur.
- **Toasts** : position **bas-droite** (`<UApp :toaster>`). Toute action de
  formulaire notifie — succès via `toast.add(... color:"success")`, échec via
  `useApiError` (toast rouge, messages de validation 422 inclus).
- **Listes** : tables encadrées (carte arrondie), en-tête discret, lignes
  survolées (thème `ui.table` global dans `app.config.ts`).
- **Authentification** : layout `auth` en deux colonnes (formulaire à gauche,
  panneau de marque/illustration à droite), bouton avec état de chargement.
- **Portail à modules** (`constants/modules.ts` = **source unique**) : chaque
  module = onglet de navbar + `nav` (sous-pages, → `AppModuleNav`) + `gate`
  (permissions/rôles). Helpers purs `accessibleModules` / `navModules` /
  `moduleForPath` / `landingRoute` / `canAccessModule` (testés dans
  `modules.test.ts`), exposés en réactif par `composables/useModules.ts`.
  - **Navigation** : la navbar liste les modules ; les sous-pages d'un module
    sont dans la page (`AppModuleNav`). **Pas de grille/lanceur** : `/` redirige
    vers le 1er module autorisé.
  - **Sous-onglets conditionnels** : `navGates` (clé = `to`) filtre les entrées
    du sous-menu ; `useModules().nav` livre le menu déjà filtré. Une règle peut
    porter sur une permission, un rôle, ou une **portée** (`anyScope`) dérivée
    des données — aujourd'hui `"entite"` uniquement.
  - **Module d'accueil `tableau-de-bord`** : ouvert à **tous** (pas de `gate`),
    il fusionne l'ancien « Mon espace » et l'ancien « Tableau de bord ». Ses
    onglets sont **cumulatifs** : `Mon espace` (toujours) → `Mon entité` (si on
    dirige une structure) → `Vue d'ensemble RH` (permission de reporting) →
    `Mon profil`. Tout le monde atterrit donc sur `/mon-espace`.
  - **« Mon entité »** (`pages/mon-entite.vue`, `useMonEntite` +
    `useEntiteApercu`) : vue globale de sa direction / son service / son bureau
    — chiffres clés, sous-structures, effectif, dossiers d'intégration en cours.
    Résolution du responsable : **poste de `nomination_active`** rapproché des
    mots-clés de `constants/entite.ts` (l'API n'expose pas de drapeau « chef de
    structure ») ; l'entité vient de `affectation_active`
    (`structurable_type`/`structurable_id`). C'est dans ce fichier de constantes,
    et nulle part ailleurs, qu'on ajuste la liste des intitulés.
  - **Atterrissage & garde** (`middleware/auth.global.ts`) : `/` → 1er module ;
    l'agent simple (aucun module métier) atterrit sur `/mon-espace` ; l'accès par
    URL à un module interdit renvoie sur l'atterrissage. `admin` voit tout.
  - Modules branchés : Mon espace (`/mon-espace`, via le menu utilisateur),
    Tableau de bord, Personnel, Intégration, Administration (Structure +
    Référentiels). Ajouter un module = une entrée dans `modules.ts`.
- **Tableau de bord** (`pages/tableau-de-bord.vue`) : récap via `useDashboardStats`
  (chiffres clés `BaseStatCard`, répartition des agents par statut, agents
  récents, accès rapides).
- **Profil** : `AppUserMenu` (navbar, avatar + menu : espace, profil,
  déconnexion) et page `pages/profil.vue` (compte, fiche agent liée, rôles &
  permissions de la session).
