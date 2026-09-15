# Alignement front ↔ API — septembre 2026

> Document **vivant** : cocher au fil des livraisons front.
> Référence backend : `project-api-rh-artf` branche `develop` @ `dc8641a` (2026-09-15).
> Référence front : `93986ca` (2026-09-06) + travail en cours (formulaire agent, login, branding).
> Contrat backend : `../project-api-rh-artf/doc/note-fe-etat-implementations.md` — **vérifié contre le code**
> (routes, FormRequests, Resources, enums) ; les écarts doc ↔ code sont signalés ⚠️.

---

## 1. Point des travaux backend (depuis le 06/09)

| Date | Livraison | Routes |
|------|-----------|--------|
| 07–08/09 | Congés : file `a-valider`, annulation, justificatif, bloc `agent` léger, soldes créés à la lecture, paliers d'ancienneté + `jours_anciennete` | +6 |
| 08/09 | Absences : file `a-valider`, signature N+1 seulement | +1 |
| 10/09 | Congés CCN art. 77 : 22 types seedés, paliers 0/6/8/…/18 j, 422 congé annuel < 12 mois et convenances perso < 15 j | — |
| 10/09 | Statuts agent CCN art. 79–80 : `disponibilite`, `sous_le_drapeau` (+ `detachement`, `position_exceptionnelle`) | — |
| 10/09 | **Évaluation P1–P5** : sessions, grille 24 critères /20, fiches, notation, avis N+1, signature agent, réclamations, avis hiérarchiques, validation RH, commissions préparatoire / avancement, avancer-échelon, bonification stage (art. 71), avancement exceptionnel (art. 72), connaissances complémentaires, stats | 60 |
| 14/09 | **Évaluation lots A–C** : N+1 = poste dominant sur 24 mois (art. 62), tableau d'avancement (`inscrit_tableau`), PDF fiche + PDF note de synthèse | +5 |
| 15/09 | **Reclassements art. 73–75** (`/carriere/reclassements`) + 3 nouveaux `type_changement` salaire ; DG reçoit `consulter-salaires` | +7 |

Front : **aucune** de ces livraisons n'est branchée à l'écran, sauf le socle congés (demandes, soldes, circuit, PDF, fériés, règles) livré le 04/09.

---

## 2. Écarts par domaine

Légende : ✅ fait · ⚠️ partiel / faux · ❌ absent.

### 2.1 Congés & absences

| Élément API | Front | Action |
|---|---|---|
| `GET /conges/demandes/a-valider` | ❌ | `aValider()` dans `api/demandes-conge.ts` + onglet « À valider » (gate `valider-conges`) |
| `GET /absences/a-valider` | ❌ | idem `api/absences.ts` ; ne plus afficher Valider/Rejeter sur la liste « toutes » |
| `POST /conges/demandes/{id}/annuler` (statut `soumise`, demandeur / créateur / admin) | ❌ | bouton sur `pages/conges/demandes/[id].vue` |
| Statut `annulee` | ❌ | `STATUTS_DEMANDE_CONGE` + libellé + couleur (`constants/conges.ts`), filtre liste |
| `GET /conges/demandes/{id}/justificatif` (blob) | ❌ | `justificatif: { nom, url }` dans le schéma + bouton télécharger (`utils/download.ts`) |
| Bloc `agent` léger `{ id, matricule, nom, prenom, nom_complet }` | ⚠️ typé `agentSchema` complet | réutiliser `schemas/agent-summary.ts` (ou un `agentIdentiteSchema`) |
| Soldes `jours_anciennete` | ❌ | schéma `conge-solde.ts` + colonne « dont ancienneté » |
| CRUD `/conges/paliers-anciennete` (`anciennete_min`, `anciennete_max` nullable, `jours_bonus`) | ❌ | schéma + repo + 3ᵉ `BaseCrudManager` dans `pages/conges/parametrage` (écriture : `valider-conges`) |
| `GET /conges/statistiques` | ⚠️ repo seul | cartes `BaseStatCard` en tête de la liste RH |
| 422 métier CCN (message seul) | ✅ `useApiError` | — |
| Flags type de congé, multipart, fiche PDF, fériés, règles | ✅ | — |

### 2.2 Statut agent

| Élément | Front | Action |
|---|---|---|
| 10 valeurs : `actif, inactif, suspendu, retraite, stagiaire, archive, detachement, position_exceptionnelle, disponibilite, sous_le_drapeau` | ⚠️ 5 seulement | compléter `STATUTS_AGENT` (`constants/enums.ts`) — alimente 4 `z.enum` |
| Libellés (l'API ne renvoie **pas** `statut_label`) | ❌ | `STATUT_AGENT_LABELS` : Actif, Inactif, Suspendu, Retraité, Stagiaire, Archivé, En détachement, Position exceptionnelle, En disponibilité, Sous le drapeau |
| Couleurs | ⚠️ dupliquées (`agents/Table.vue`, `personnel/agents/[id].vue`) | centraliser dans `constants/personnel.ts` |
| Valeurs modifiables : tout **sauf** `stagiaire`, `archive` | ⚠️ le formulaire propose `stagiaire` → 422 | liste `STATUTS_AGENT_MODIFIABLES` pour le select |
| Modification = `PUT /integration/agents/{id}` | ✅ | ⚠️ la note backend dit `PUT /personnel/agents/{id}` : **n'existe pas** |
| Dashboard « répartition par statut » | ⚠️ | suit l'enum automatiquement une fois complété |

### 2.3 Notifications (cloche)

| Domaine | Front | Action |
|---|---|---|
| `conge` / `absence` | ⚠️ icône seulement | `notificationLink()` → `/conges/demandes/{demande_id}` · `/conges/absences` |
| `evaluation` | ❌ | icône + lien → fiche `evaluation_id` ou session `session_id`. ⚠️ **le backend n'émet encore rien** (service jamais appelé) |

### 2.4 Rémunération

| Élément | Front | Action |
|---|---|---|
| `type_changement` salaire : + `reclassement`, `hors_classe`, `reconversion` | ❌ | `TYPES_CHANGEMENT_SALAIRE_AGENT` + libellés |
| DG a désormais `consulter-salaires` | ⚠️ | le module Rémunération (gate `consulter-salaires`) **s'ouvre au DG**, alors que la note rôles ne lui donne que la file reclassements → gater Grille / Salaires sur `anyRole: ["rh","admin"]` ou `gerer-salaires` (décision §6) |

### 2.5 Reclassements art. 73–75 — ❌ tout est à faire

Routes (`/carriere/…`) :

| Méthode | URI | Permission | Qui agit réellement |
|---|---|---|---|
| GET | `reclassements?agent_id=&type=&statut=` | `consulter-salaires` | RH, admin, DG |
| POST | `reclassements` | `gerer-salaires` | RH |
| GET | `reclassements/{id}` (+ `eligibilite`) | `consulter-salaires` | |
| POST | `reclassements/{id}/approuver` · `rejeter` `{ commentaire? }` | `consulter-salaires` | art. 73 → rôle `rh` ; 74 / 75 → `directeur-general` ; `admin` toujours (403 sinon) |
| POST | `reclassements/{id}/appliquer` | `gerer-salaires` | RH — idempotent, `meta.applique` |
| GET | `agents/{id}/reclassements` | `consulter-salaires` | historique fiche agent |

- `type` : `reclassement_formation` (73) · `reclassement_exceptionnel` (74a) · `hors_classe` (74b) · `reconversion` (75). Libellés et `article` fournis par l'API.
- `statut` : `soumis` → `approuve` | `rejete` → `applique` (`annule` réservé). `prochaine_etape` : `approuver` | `appliquer` | `null`.
- Formulaire conditionnel au `type` : 73 → `diplome_id` (déjà au dossier de l'agent) ; 74a → `classe_cible_id` ; 74b → rien (cible = Hors classe) ; 75 → `motif_reconversion` (`baisse_activite` | `reorganisation` | `maladie`) + `fonction_cible_id` (+ `piece_path` texte si maladie, **pas** d'upload), `classe_cible_id` optionnel. `motif` 10–2000 toujours requis.
- Resource : `classe_origine` / `classe_cible` = `{ id, categorie, grade, coefficient }`, `fonction_cible` `{ id, nom }`, `diplome` `{ id, nom, sigle }`, `age_ans`, `anciennete_ans`, `annees_dans_classe`, `echelon_origine`, `echelon_cible`, `eligibilite { ok, messages[] }` (show seulement).
- 422 à afficher tels quels : `errors.diplome_id | age | anciennete | classe | echelon | grade | piece_path | classe_cible_id | agent_id | statut`.

### 2.6 Évaluation / notation / avancement — ❌ tout est à faire (65 routes `/avancements`)

**Contrat réel (à utiliser pour les schémas Zod) :**

- Enveloppe `{ success?, message?, data }` — `success` absent sur commissions, avis, bonifications, connaissances → **optionnel**. Listes plates, non paginées.
- Erreurs métier = **422 `errors.<clé>`** (`statut`, `ordre`, `niveau`, `signe`, `reclamation`, `avis_hierarchiques`, `inscrit_tableau`, `commission_*`, `nombre_echelons`, `evaluation`, `duree_mois`, `session`) — `message` générique. `useApiError` prend déjà le 1ᵉʳ `errors`.
- Dates : `YYYY-MM-DD` et datetimes `YYYY-MM-DD HH:MM:SS` (pas ISO) → vérifier `formatDateTime`.
- **Noter = un critère par appel** : `POST evaluations/{id}/noter { question_id, note_obtenue, commentaire? }` (≤ `bareme_max`).
- Les actions ne rechargent pas les relations → **refetch `show`** après chaque action.
- Booléen de décision différent selon l'endpoint : `conforme` (valider-rh), `acceptee` (réclamation), `approuver` (bonification, exceptionnel), `approuve` (avis).
- Stats session vide : `par_statut` / `mentions` = `[]` au lieu de `{}`.
- Fiches d'une session : `GET evaluations?session_id=&agent_id=&superieur_id=&statut=&inscrit_tableau=`.

**Enums :**

| Enum | Valeurs |
|---|---|
| Statut fiche | `en_attente, en_cours, notee, signee_evaluateur, signee_evalue, en_reclamation, en_validation_rh, finalisee, rejetee, annulee` (+ `statut_label`) |
| Statut session | `ouverte, cloturee, annulee` |
| Mention (valeur = libellé) | `Excellent` ≥16 · `Très bien` ≥14 · `Bien` ≥12 · `Moyen` ≥10 · `Insuffisant` |
| Critère | `competence_pro` (/10) · `assiduite` (/3) · `relation_sociale` (/7) |
| Niveau avis | `chef_bureau, chef_service, directeur, directeur_general` |
| Décision commission | `favorable, defavorable, reporte` |
| Statut commission | `en_cours, cloturee` |
| Statut réclamation | `en_attente, acceptee, rejetee` |
| Statut bonification / exceptionnel | `en_attente, approuvee, rejetee` |
| Connaissance `type` | `formation, certification, perfectionnement, autre` |

**`prochaine_etape` (dépend du statut seul) :** `noter` · `continuer_notation` · `avis_et_signer` · `signer_evalue` · `envoyer_rh` · `traiter_reclamation` · `valider_rh` · `corriger_notation` · `inscrire_tableau` · `commission_preparatoire` · `avancer_echelon` · `null`.
Nuances : en `signee_evalue` l'agent peut aussi `reclamer` ; `commission_preparatoire` couvre « attente préparatoire » **et** « attente décision » (distinguer via `commission_note`).

**Qui agit — aucun champ `peut_*` : le front déduit** (le backend ne contrôle que la permission de route, sauf les PDF) :

| Action | Condition d'affichage |
|---|---|
| noter, contexte, avis-et-signer, corriger | `auth.user.agent_id === fiche.superieur_id` |
| signer-evalue, reclamer, envoyer-rh | `auth.user.agent_id === fiche.agent_id` |
| valider-rh, annuler, réclamations, réattribuer, tableau, commissions, avancer-échelon, bonifications, exceptionnels | rôle `rh` ou `admin` (DG en plus pour ouvrir / décider en commission et proposer un exceptionnel) |
| avis hiérarchique niveau N | `GET niveaux-requis` contient N **et** niveau N−1 signé **et** rôle correspondant (`chef-bureau`, `chef-service`, `directeur`, `directeur-general`) |
| fiche-pdf | statut ∈ `signee_evalue, en_reclamation, en_validation_rh, finalisee, rejetee` **et** (agent, N+1, `rh`, `admin`, `directeur-general`) |
| synthese-pdf | commission préparatoire `cloturee` **et** `rh` / `admin` / `directeur-general` |

⚠️ `valider-evaluations` est détenu par **tous les chefs** : ne jamais gater un onglet RH sur cette seule permission → `anyRole: ["rh","admin"]`.

**Écrans cibles (module « Évaluations », gate `consulter-evaluations`) :**

| Onglet | Gate | APIs |
|---|---|---|
| Mes évaluations (agent) | tous | `evaluations/agent/mes-evaluations`, show, `signer-evalue`, `reclamer`, `envoyer-rh`, connaissances, `fiche-pdf` |
| À noter (N+1) | `valider-evaluations` + `agent_id` | `evaluations/superieur/mes-evaluations`, `questions-evaluation`, `noter`, `contexte`, `avis-et-signer` |
| Avis hiérarchiques | rôles chefs / DG | `niveaux-requis`, `avis-hierarchiques` (poster, PUT, signer) |
| Sessions (RH) | `creer-evaluations` | CRUD sessions, `generer-fiches`, `sans-superieur`, `stats`, `evaluations?session_id=`, `superieur` (réattribuer), `cloturer`, `annuler` |
| Validation RH & réclamations | rôle `rh`/`admin` | `evaluations?statut=en_validation_rh`, `valider-rh`, `reclamations/en-attente`, `traiter` |
| Tableau & commissions | rôle `rh`/`admin`/`directeur-general` | `sessions/{id}/tableau`, `inscrire-/retirer-tableau`, commission préparatoire (ouvrir, noter, alertes, clôturer, `synthese-pdf`), commission d'avancement (ouvrir, décider, clôturer), `avancer-echelon` |
| Bonifications & exceptionnels | rôle `rh`/`admin` (+ DG propose) | `bonifications-stage`, `avancements-exceptionnels` (+ `traiter`, `appliquer`) |
| Grille de critères | `creer-evaluations` | CRUD `questions-evaluation` (préférer `actif: false` à la suppression, qui efface les notes) |

---

## 3. Bugs front existants

- [x] **Circuit congés N+1** (`components/conges/Circuit.vue` `peutSigner`) : boutons N+1 visibles pour tout `valider-conges` → 403 pour un RH. Comparer `useCarriereSynthese(demande.agent_id).affectation_active.superieur_hierarchique_id` à `auth.user.agent_id`. Idem absences.
- [x] **Attestation** (`pages/conges/demandes/[id].vue`) : invisible pour un type N+1 seul ; le backend accepte aussi `validee_n1` quand ni RH ni DG ne sont requis.
- [x] **Statut agent** (`components/agents/Form.vue`) : propose `stagiaire` → 422.

---

## 4. Points backend à remonter (toujours présents au 15/09)

| # | Problème | Impact front | Où |
|---|---|---|---|
| B1 | `apiResource(...)->middleware([assoc])` applique **toutes** les permissions à toutes les routes | un chef ne peut pas lire la grille qu'il doit noter (403). Même motif sur `users` et `roles` | `routes/api.php:424` (questions-evaluation) → `middlewareFor` |
| B2 | Aucun contrôle d'acteur dans `/avancements` (hors PDF) | tout chef peut « valider RH » / décider ; tout agent peut signer la fiche d'un autre. Le front masque, mais ce n'est pas une sécurité | `EvaluationStatutService`, commissions, bonifications |
| B3 | `EvaluationNotificationService` jamais appelé | cloche vide pour le domaine `evaluation` | services évaluation |
| B4 | `avancer-echelon` filtre `echelons.classe_id` (colonne inexistante) → **500** | bouton « Appliquer l'avancement » inutilisable | `CommissionAvancementService.php:160` |
| B5 | `reclamations.unique(evaluation_id)` → 2ᵉ réclamation = 500 SQL ; `envoyer-rh` possible pendant une réclamation | | migration réclamations, `EvaluationStatutService` |
| B6 | `directions.rattache_dg` non exposé | impossible d'afficher / régler la variante DG de la chaîne d'avis | `DirectionResource` / requests |
| B7 | Note FE : `PUT /personnel/agents/{id}` (inexistant), `meta.domaine` (c'est `domaine`), notifications évaluation annoncées, enveloppe sans `success` | | `doc/note-fe-etat-implementations.md` |

---

## 5. Plan front par lots

Chaque lot : schémas + tests, repo, composable, pages, `npm run test && npm run lint && npm run typecheck` (CLAUDE.md §6).

### Lot 1 — Congés, absences, statuts (petit, sans dépendance backend) — ✅ 2026-09-15
- [x] 3 bugs du §3 — boutons N+1 / RH / DG pilotés par la file `a-valider` (règle exacte du backend)
- [x] `STATUTS_AGENT` (10) + libellés + couleurs centralisées (`constants/personnel.ts`, `AgentsStatutBadge`) + liste modifiable
- [x] `annulee` + retirer + justificatif téléchargeable + `jours_anciennete` (colonne « Dont ancienneté »)
- [x] files `a-valider` congés / absences (portée « À valider », par défaut pour les valideurs ; actions absences seulement dans la file)
- [x] paliers d'ancienneté (3ᵉ bloc du paramétrage)
- [x] bloc `agent` léger dans les schémas congés / absences
- [x] liens cloche `conge` / `absence`
- [x] `TYPES_CHANGEMENT_SALAIRE_AGENT` (+3)
- [ ] reporté : cartes `/conges/statistiques` ; gate Rémunération pour le DG (F3, avec le lot 4)

### Lot 2 — Évaluation, socle (parcours agent / N+1 / RH)
- [ ] `constants/evaluations.ts` (enums, libellés, couleurs, étapes → boutons) + `utils/evaluationActions.ts` (qui agit, testé)
- [ ] schémas `question-evaluation`, `session-evaluation`, `evaluation`, `note-evaluation`, `reclamation`, `avis-hierarchique`, `connaissance` + tests
- [ ] repos `api/evaluations.ts`, `api/sessions-evaluation.ts`, `api/questions-evaluation.ts`, `api/reclamations.ts`
- [ ] module `evaluations` dans `modules.ts` (+ tests des gates, `anyRole` pour les onglets RH)
- [ ] pages : sessions (liste, création, détail + fiches + stats + sans supérieur), fiche (grille de notation, avis, signatures, réclamation, PDF), mes évaluations, à noter, validation RH + réclamations, grille de critères
- [ ] carte « Mes évaluations » dans Mon espace

### Lot 3 — Évaluation, suite (après B1–B5 côté backend de préférence)
- [ ] avis hiérarchiques (chaîne `niveaux-requis`)
- [ ] tableau d'avancement + commissions préparatoire / avancement + `synthese-pdf` + avancer-échelon
- [ ] bonifications stage (art. 71) + avancements exceptionnels (art. 72)
- [ ] connaissances complémentaires
- [ ] lien cloche `evaluation`

### Lot 4 — Reclassements art. 73–75
- [ ] schéma `reclassement` + tests, repo `api/reclassements.ts`
- [ ] file `/carriere/reclassements` (liste, détail + éligibilité, approuver / rejeter selon article, appliquer)
- [ ] création depuis la fiche agent (formulaire conditionnel au type) + section « Reclassements » dans `personnel/agents/[id]`
- [ ] gates : RH + DG (voir §6)

---

## 6. Décisions à trancher

| # | Sujet | Proposition |
|---|---|---|
| F1 | Chemin front du module évaluation | `/evaluations/…` (libellé « Évaluations »), le préfixe API `/avancements` reste dans les repos |
| F2 | Où vit la file des reclassements | `/carriere/reclassements` (aligné API) ; élargir le gate Carrière à `consulter-salaires` avec `navGates` pour que le DG ne voie que cet onglet |
| F3 | Module Rémunération ouvert au DG (nouvelle permission) | gater Grille / Salaires agents sur `anyRole: ["rh","admin"]` |
| F4 | Grille de critères | onglet du module Évaluations (pas dans Administration > Référentiels) : c'est un paramétrage métier RH |
| F5 | Ordre des lots 2 / 3 vs corrections backend | lancer le lot 2 maintenant, conditionner le lot 3 à B1–B5 |
