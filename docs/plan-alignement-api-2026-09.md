# Alignement front ↔ API — septembre 2026

> Document **vivant** : cocher au fil des livraisons front.
> Référence backend : `project-api-rh-artf` branche `develop` @ `465a184` (2026-09-16).
> Référence front : branche `feature/alignement-api-2026-09` (lot 1 livré le 15/09, lot 2 le 17/09).
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

| 15–16/09 | **+135 routes, 0 supprimée** (route:list comparé `dc8641a` → `465a184`) : Discipline `/discipline` (38), Paie `/paie` (27), Formations `/formations` (30), Affaires sociales `/affaires-sociales` (23), Positions conventionnelles `/carriere/positions` (8), périodes d'essai contrats/nominations + `stages/{id}/convertir-agent` + alerte délai 30 j (9) | +135 |

Champs ajoutés sur des ressources **déjà consommées** par le front (impact schémas Zod, à traiter avec les lots correspondants) : `hors_grille` (agent, salaire, carrière), `bonification_echelons` (diplôme), `deja_salarie` / `pieces_rapprochement` / `motif_code` / `motif_archivage_code` / `prioritaire_reembauche_jusquau` (dossier, agent), bloc `essai { statut, duree_mois, date_debut, date_fin, prochaine_etape }` + `soumis_a_essai` (contrat, nomination), `est_embauche_ccn`.

⚠️ **Positions CCN art. 76–80** : `detachement`, `disponibilite`, `position_exceptionnelle`, `sous_le_drapeau` ne passent plus par `PUT /integration/agents/{id}` (rejetés par le FormRequest) mais par `POST /carriere/positions` — le select « Statut » du formulaire agent est donc à réduire (lot 7).

Front : **aucune** de ces livraisons n'est branchée à l'écran, sauf le socle congés (demandes, soldes, circuit, PDF, fériés, règles) livré le 04/09 et le socle évaluation livré le 17/09 (lot 2).

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

## 4. Points backend à remonter (revérifiés dans le code au 17/09)

| # | Problème | Impact front | Où |
|---|---|---|---|
| ~~B1~~ | ~~`apiResource(...)->middleware([assoc])`~~ — **corrigé** le 15/09 : `questions-evaluation`, `users` et `roles` déclarent désormais une permission par méthode | — | `routes/api.php:641` |
| B2 | Aucun contrôle d'acteur dans `/avancements` (hors PDF) | tout chef peut « valider RH » / décider ; tout agent peut signer la fiche d'un autre. Le front masque, mais ce n'est pas une sécurité | `EvaluationStatutService`, commissions, bonifications |
| ~~B3~~ | **corrigé** le 17/09 (branche backend `fix/evaluation-b3-b4-b5`) : le service est branché sur l'attribution de fiche, la signature du notateur, la transmission RH, la validation, le rejet, l'ouverture des commissions, l'avancement, la bonification et l'exceptionnel | la cloche reçoit le domaine `evaluation` ; le lien front était déjà prêt | services évaluation |
| ~~B4~~ | **corrigé** le 17/09 : `avancerEchelon` délègue à `SalaireAgentService::avancerEchelons`, qui connaît la grille, clôture la ligne courante et synchronise `agents.echelon_id` — comme le faisaient déjà la bonification (art. 71) et l'exceptionnel (art. 72) | « Appliquer l'avancement » fonctionne et crée la nouvelle ligne salariale | `CommissionAvancementService::avancerEchelon` |
| ~~B5~~ | **corrigé** le 17/09 : unicité levée (migration), `reclamation()` devient `latestOfMany`, et `envoyer-rh` renvoie 422 `errors.reclamation` tant qu'une réclamation n'est pas traitée | une fiche peut être contestée plusieurs fois ; l'agent ne court-circuite plus l'arbitrage RH | migration + `EvaluationStatutService` |
| B6 | **toujours présent** — `directions.rattache_dg` non exposé | on ne peut ni afficher ni régler la variante DG de la chaîne d'avis. Contourné : le front lit la chaîne réelle via `GET …/niveaux-requis` au lieu de la recalculer | `DirectionResource` / requests |
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

### Lot 2 — Évaluation, socle (parcours agent / N+1 / RH) — ✅ 2026-09-17
- [x] enums dans `constants/enums.ts` + `constants/evaluations.ts` (libellés, couleurs, barèmes, étapes) + `utils/evaluationActions.ts` (qui agit, 20 tests)
- [x] schémas `question-evaluation`, `session-evaluation` (+ `stats`), `evaluation`, `note-evaluation`, `reclamation`, `avis-hierarchique` + tests
- [x] repos `api/evaluations.ts`, `api/sessions-evaluation.ts`, `api/questions-evaluation.ts`, `api/reclamations.ts`
- [x] composables `useEvaluations` (portées mine / à noter / RH), `useEvaluation`, `useSessionsEvaluation`, `useActeurEvaluation`
- [x] module `evaluations` dans `modules.ts` + gates testés (`anyRole` pour la validation RH, `creer-evaluations` pour sessions et grille)
- [x] pages : mes évaluations, à noter, fiche (grille critère par critère, contexte, avis, signatures, réclamation, PDF), sessions (liste + détail : stats, fiches, agents sans N+1, clôture), validation RH + réclamations, grille de critères
- [x] carte « Mes évaluations » dans Mon espace
- [ ] reporté au lot 3 : connaissances complémentaires, avis hiérarchiques **actionnables** (ils ne sont affichés qu'en lecture)

> Non rejoué contre l'API : la base SQLite locale est antérieure aux migrations
> d'évaluation (`php artisan migrate --seed` requis) et le rôle `rh` n'y a que
> `consulter-evaluations` — d'où des `Accès refusé` sur `questions-evaluation`
> et `reclamations` tant que `RoleSeeder` n'est pas rejoué.

### Lot 3 — Évaluation, suite — ✅ 2026-09-17
- [x] avis hiérarchiques actionnables : chaîne réelle via `niveaux-requis`, séquentialité (niveau N ouvert seulement si N−1 a signé), correspondance de rôle, signature définitive, alerte « envoi RH bloqué »
- [x] tableau d'avancement (inscrire / retirer, y compris depuis la fiche) + commission préparatoire (ouvrir, harmoniser avec alerte d'écart > 5, clôturer, note de synthèse PDF) + commission d'avancement (ouvrir, décider, clôturer) + application de l'échelon — écran `/evaluations/tableau`
- [x] bonifications stage (art. 71) + avancements exceptionnels (art. 72) — écran `/evaluations/bonifications`
- [x] connaissances complémentaires (sur la fiche)
- [x] lien cloche `evaluation` (prêt ; le backend n'émet rien — B3)

> B4 a été corrigé depuis, côté backend (branche `fix/evaluation-b3-b4-b5`) :
> « Appliquer l'avancement » crée bien la nouvelle ligne salariale.

### Lots 5 à 9 — modules backend des 15–16/09 — ✅ 2026-09-17

- **Lot 5 — Discipline** (`/discipline`) : module dédié (dossiers, avertissements,
  types de sanction), circuit rapport → instruction RH → prononcé **DG** avec
  séparation stricte des rôles, pièces art. 91 (l'instruction est refusée sans
  pièce), PDF rapport et décision, historique et récidive sur la fiche agent,
  self-service `/mon-espace/discipline` pour l'agent concerné, lien de cloche.
- **Lot 6 — Affaires sociales** (`/affaires-sociales`) : organismes, affiliations
  avec alerte « sans CNSS » actionnable, ayants droit (liens juridiques par type,
  régimes d'âge) et pièces, dossier social sur la fiche agent.
- **Lot 7 — Positions & essais** : écran Positions art. 76–80 (RH soumet, DG
  approuve, renouvellement, clôture avec signal de réintégration), périodes
  d'essai contrats art. 49 et nominations art. 50, file du délai de 30 jours
  art. 52, select « Statut » de l'agent réduit à `actif / inactif / suspendu /
  retraite`, badge hors grille art. 55, nouveaux champs (`bonification_echelons`,
  `deja_salarie`, `motif_code`, `pieces_rapprochement`…).
- **Lot 8 — Formation** (`/formations`) : catalogue avec plafonds de durée, plan
  annuel (brouillon → validé → exécuté → clôturé), inscriptions (présence,
  clôture avec rapport art. 100, annulation), certifications ; écran
  « Conventions de stage » qui porte la conversion stagiaire → agent.
- **Lot 9 — Paie** (`/paie`, rattachée au module Rémunération) : référentiel des
  éléments (système vs maison, `a_parametrer`), affectation par agent sur la
  fiche, lot mensuel piloté par `data.actions` avec anomalies bloquantes,
  lignes, bulletin enrichi et export CSV/PDF de la masse.

### Lot 4 — Reclassements art. 73–75 — ✅ 2026-09-17
- [x] schéma `reclassement` + tests, repo `api/reclassements.ts`
- [x] file `/carriere/reclassements` (liste, détail + éligibilité, approuver / rejeter **selon l'article** — RH pour le 73, DG pour les 74–75 —, appliquer idempotent)
- [x] création depuis la fiche agent, formulaire conditionnel au type + section « Reclassements »
- [x] gates : module Carrière ouvert à `consulter-salaires` avec `navGates` (F2) ; Rémunération refermée sur `anyRole: ["rh","admin"]` (F3)

---

## 5 bis. Espace personnel (self-service) — ✅ 2026-09-17

Jusqu'ici, tout écran partait du point de vue RH : on choisit un agent, puis on
agit sur lui. Les routes indexées par agent existaient pourtant sans permission
particulière. L'espace personnel les exploite.

| Écran | Route | Ce qu'il apporte |
|---|---|---|
| Mon dossier | `/mon-espace/dossier` | coordonnées, situation familiale, contacts d'urgence, documents — **modifiables par l'agent lui-même** (le préfixe `/personnel` n'exige aucune permission) |
| Ma carrière | `/mon-espace/carriere` | affectation et nomination du jour, contrats et leur essai, historiques ; positions et reclassements seulement si `consulter-salaires` |
| Mes congés | `/mon-espace/conges` | soldes par type en tête, demandes, dépôt **en son nom** |
| Mes absences | `/mon-espace/absences` | ses absences, déclaration **en son nom** |
| Mes évaluations | `/evaluations/mes-evaluations` | inchangé (lot 2) |
| Mon dossier disciplinaire | `/mon-espace/discipline` | inchangé (lot 5) |

La grille de `mon-espace` vient d'une source unique (`constants/mon-espace.ts`,
testée) : une carte s'affiche si le compte a un agent rattaché **et** la
permission de lecture du domaine.

### Déclarer pour soi

Les modales congé et absence ont désormais deux usages : **pour un tiers** (la
RH ou un chef choisit l'agent) et **pour soi** (`pour-moi`), où le champ Agent
cède la place à l'identité du connecté. Le mode « pour soi » s'impose de
lui-même à qui n'a pas `consulter-agents` — l'ancien formulaire lui présentait
un select vide, alimenté par un appel qui lui répondait 403 : un agent ne
pouvait tout simplement pas déclarer son absence.

Les listes RH gardent les deux entrées : « Nouvelle demande » et « Pour moi ».

### Cloisonnement des soldes

`GET /conges/soldes` renvoie **tous** les agents à quiconque détient
`consulter-conges` — que le rôle `agent` possède. La page a donc désormais une
portée : « Mes soldes » par défaut (route indexée par agent), vue d'ensemble
réservée aux valideurs et à la RH.

> ⚠️ Même remarque, non traitée car elle relève de l'API : `GET /conges/demandes`
> et `GET /absences` ne sont pas cloisonnées non plus. Le front force la portée
> « mine » et masque « Toutes », mais c'est une règle d'interface, pas une
> sécurité.

### Reste hors de l'espace personnel

Faute de route accessible à l'agent — décision backend à prendre :
`consulter-salaires` garde ses bulletins de paie et son salaire,
`consulter-formations` ses inscriptions et certifications, et les affaires
sociales n'ont pas de self-service en P1 (choix explicite du backend).

## 5 ter. Vue d'ensemble RH — ✅ 2026-09-17

Le backend a livré le **module Reporting D.6** (`/api/reporting`, permission
`consulter-reporting` — RH, admin et **DG**) le jour même. Le tableau de bord ne
compte donc plus rien dans le navigateur : il consomme les agrégations serveur.

| Bande de la page | Source |
|---|---|
| Effectif présent, actifs, stagiaires, arrivées et départs de l'année | `dashboard` |
| À régulariser (6 contrôles, triés par gravité) | `alertes` |
| Campagne d'évaluation : avancement, note moyenne, mentions | `stats/evaluations` |
| Congés et absences : en congé aujourd'hui, jours accordés, circuit, types | `stats/conges` |
| Masse salariale du dernier lot clôturé | `dashboard.masse_salariale` |
| Qui compose l'effectif : statut, genre, direction, grade, fonction, type d'intégration | `dashboard.repartitions` |
| Exports CSV / PDF | `exports/{type}` |

### Ordre des bandes — ce qui passe devant

L'ordre suit ce qui change le comportement du lecteur, pas la richesse de la
donnée :

1. **Le pouls** — l'effectif présent, un seul grand chiffre, et ce qui l'entoure.
2. **Ce qui vous attend** — les files personnalisées : dossiers arrêtés faute
   d'une décision de la personne connectée. C'est le seul contenu qui appelle une
   action immédiate.
3. **Ce qui n'est pas conforme** — les six alertes du module Reporting.
4. **La masse salariale** — pour une direction générale, le deuxième chiffre du
   tableau.
5. **La campagne d'évaluation**, quand il y en a une.
6. **Congés et absences.**
7. **Qui compose l'effectif** — de la connaissance, pas de l'action : d'où sa
   place en bas.

Les **files personnalisées** n'existent pas dans le module Reporting (demande 3
au backend) : le front les interroge donc une par une, et seulement celles dont
l'utilisateur a la permission — un compte sans droit ne déclenche aucun appel.
Neuf files déclarées, en `allSettled` : une file qui échoue vaut zéro et
disparaît plutôt que d'afficher un chiffre faux.

### Parti pris de lecture

La page doit se comprendre **sans connaître le modèle de données**. Chaque bloc
porte une phrase qui dit ce qu'il compte (« Effectif présent = agents actifs,
stagiaires et suspendus ; les archivés, retraités et détachés n'y figurent
pas »), chaque graphique écrit ses valeurs, et une alerte à zéro n'est pas
affichée — un contrôle sans anomalie n'est pas une information.

### Graphiques

Faits maison, sans bibliothèque (CLAUDE.md §2 : le moins de dépendances
possible) : barres horizontales, barre empilée, jauge.

- **Une seule teinte pour une mesure unique** (bleu ARTF) : une grandeur se lit
  avec une couleur, la teinte n'a rien à distinguer.
- **Deux teintes catégorielles** réservées au genre, validées pour la vision
  daltonienne (ΔE 19,7 protan · 28,9 en vision normale) ; gris neutre pour
  « non renseigné », qui n'est pas une catégorie mais un trou.
- **Couleurs d'état** réservées aux alertes, jamais série, toujours accompagnées
  d'une icône et d'un libellé.

Formes, choisies sur ce que la donnée est :

| Donnée | Forme | Pourquoi |
|---|---|---|
| Listes longues (direction, grade, type de congé) | barres horizontales | libellés lisibles, pas de texte tourné |
| Part-du-tout courte (genre, composition de l'effectif, gains/retenues) | anneau ou barre empilée | se lit d'un coup d'œil, ≤ 3 parts |
| Distribution continue par tranche (âge) | **histogramme en colonnes** | l'œil lit la silhouette, ce qu'une liste de barres ne donne pas |
| Évolution dans le temps (net mensuel) | **courbe avec aire** | la seule série exacte disponible |
| Ratio sur un tout (taux d'accord des congés, avancement d'une campagne) | jauge | un ratio parle mieux que deux totaux côte à côte | La grille du bas est **asymétrique** — une liste longue à gauche, une
part-du-tout à droite, puis trois colonnes courtes — plutôt que six cartes
identiques.

⚠️ Un axe **ordonné** ne se trie pas par volume — ni les tranches d'âge, ni les
mentions d'évaluation (`ordonne` sur `VizBarresH`, ordre naturel dans
`VizColonnes`). Trier « 55 ans et plus » en tête parce qu'ils sont nombreux, ou
« Bien » avant « Excellent », détruirait l'information que porte la suite.

### Une courbe, et une seule — celle dont la donnée est sans ambiguïté

Le module Reporting n'expose aucune série temporelle, mais `GET /paie/lots`
renvoie **tous** les lots avec leur année, leur mois et leurs totaux : c'est une
série mensuelle exacte, en un appel. D'où la **courbe du net mensuel**
(`useSerieMasseSalariale`), sur les lots validés ou clôturés seulement — un lot
en brouillon donnerait un montant qui bougera encore. Échelle partant de zéro :
tronquer la base d'un montant exagère visuellement les variations.

La courbe des jours de congé, elle, **n'est pas faite** bien que les dates
existent : répartir un congé à cheval sur deux mois est une décision métier, pas
un calcul. C'est au backend de la trancher (demande 1).

L'évolution de l'effectif reste hors de portée : elle suppose des snapshots
mensuels, explicitement hors périmètre V1 (`plan-module-reporting.md` §7).
Les demandes qui restent sont dans
[`besoin-api-tableau-de-bord.md`](./besoin-api-tableau-de-bord.md) : séries
mensuelles, blocs discipline et intégration, compteurs de files personnalisées,
écrêtage par bloc. Une courbe fausse vaudrait moins que pas de courbe.

### À noter

`GET /reporting/effectifs` est **paginé** : deuxième exception à la règle « pas
de pagination » de l'API, après l'inbox des notifications. Le type
`Paginated<T>` existait déjà.

## 5 quater. Pull backend du 17/09 — vague F, prestations, santé — ✅ 2026-09-18

Trois apports, d'impact très inégal.

### Vague F — cloisonnement par bureau DRHL (le plus urgent)

Le backend ajoute `users.bureau_id`, un scope `maStructure` sur les agents,
congés, absences et sanctions, et surtout **cinq rôles** :
`rh-personnel`, `rh-solde`, `rh-formation`, `rh-affaires-sociales`, `rh-etude`.

C'était une **régression en attente** : trois portes du front testaient
`anyRole: ["rh", "admin"]`. Un agent du bureau Solde, porteur de
`gerer-salaires`, se serait vu refuser le module Rémunération.

Ce qui a été fait :

- `constants/roles.ts` — `ROLES_RH`, `estRh()`, et la règle écrite noir sur
  blanc : **on gate par permission**, le rôle ne sert que là où aucune
  permission ne discrimine. Élargir `anyRole` à tous les rôles RH aurait ouvert
  la paie au bureau Formation ;
- porte Rémunération : `anyRole: ["rh","admin"]` → `anyPermission: ["gerer-salaires"]`.
  Exact : `rh` et `rh-solde` l'ont, le DG non (il n'a que `consulter-salaires`).
  **La décision F3 est donc révisée** — le résultat pour le DG est inchangé ;
- porte Affaires sociales : `+ decider-prestations`, miroir des routes ;
- `hasRole("rh")` remplacé par `estRh()` dans les files d'attente, l'acteur
  d'évaluation, les soldes de congé, les demandes et les reclassements ;
- `userSchema` porte `bureau_id` / `bureau`, `useUsersApi` les deux routes de
  rattachement, et `/profil` affiche le périmètre — « Accès global » quand il
  n'y a pas de cloisonnement, pour que personne ne cherche pourquoi sa liste
  est plus courte que celle du voisin ;
- le fixture de `modules.test.ts` avait **dérivé** du seeder (il manquait
  `gerer-salaires` à `rh`) : recopié, et les cinq rôles de bureau ajoutés avec
  leurs tests de porte.

Le front ne refiltre rien : le cloisonnement est un périmètre serveur.

### D.3.4 Prestations et D.3.5 Santé (63 routes)

Prestations CCN ponctuelles (art. 119–121), arrêts de santé (132–135), prises
en charge médicales (122–127), visites médicales, structures sanitaires.

Les trois dossiers **instruits** partagent rigoureusement le même circuit
(`brouillon → soumise → instruite → accordée | refusée | classée`), les mêmes
pièces, le même PDF de décision et les mêmes permissions. Ils ont donc un
socle commun plutôt que trois copies :

| Fichier | Rôle |
|---|---|
| `schemas/dossier-social.ts` | champs de circuit, pièce, corps des transitions |
| `api/dossiers-sociaux.ts` | fabrique générique des 18 routes communes |
| `constants/dossiers-sociaux.ts` | statuts, libellés CCN, `actionsDossierSocial()` |
| `components/social/CircuitDossier.vue` | statut + transitions + saisies |
| `components/social/PiecesDossier.vue` | pièces typées, éditables en brouillon seulement |

Trois partis pris d'écran :

1. **les montants ne sont jamais fusionnés.** Demandé / barème CCN / accordé
   sont trois colonnes distinctes : le DG peut accorder autre chose que le
   calcul, et c'est précisément ce qu'on doit pouvoir constater. Sur une prise
   en charge s'y ajoute le **reste à charge**, seule question que l'agent se
   pose vraiment ;
2. **la simulation montre le chemin, pas seulement le résultat** — traitement de
   base, ancienneté, jours déduits, mois du barème. Un montant qui surprend doit
   pouvoir s'expliquer sans ouvrir la convention ;
3. **les visites médicales ouvrent sur leur alerte**, pas sur leur archive : la
   liste des agents sans visite annuelle est la seule chose qui appelle une
   action, le reste est de l'historique.

### Deltas mineurs du même pull

| Route | Décision |
|---|---|
| `GET /discipline/sanctions/a-valider` | **alias** de `a-prononcer` (même méthode) — rien à faire, le front utilise déjà l'original |
| `POST /avancements/evaluations/{id}/signer-evaluateur` | **remplacée** par le circuit d'avis phase 2, d'après le commentaire de `routes/api.php` — non branchée |
| `GET /discipline/moi/avertissements/{id}` | ajoutée au repository |
| `POST /carriere/affectations/notes-service/lot` | ZIP des notes **individuelles**, à ne pas confondre avec l'acte collectif du lot ; bouton sur la fiche de lot |
| Domaine des comptes de test | `arft.cg` → **`artf.cg`** (coquille corrigée côté API) — `CLAUDE.md` mis à jour |

### ⚠️ Toujours pas vérifié contre une API qui tourne

La base SQLite locale accuse **14 migrations en retard**, dont celles des
prestations, de la santé et de `users.bureau_id`. Les rôles de bureau n'existent
donc pas encore en local. Le pull apporte enfin les seeders qui rendraient un
essai bout en bout possible :

```bash
cd ../project-api-rh-artf && php artisan migrate && php artisan db:seed
```

Cette commande touche la base de développement : elle n'a pas été lancée sans
accord. Tant qu'elle ne l'est pas, **rien de tout ceci n'a été exercé contre une
API réelle** — seulement contre le contrat lu dans le code.

## 5 quinquies. Déconnexions inexpliquées + pull du 18/09 — ✅ 2026-09-18

### Le symptôme

Accéder à une page interdite **déconnectait**, avec un
`{"message":"Accès refusé."}` en console et rien à l'écran.

Deux causes distinctes, cumulées.

**1. Le client HTTP confondait 401 et 403.**

```ts
if (response.status === 401 || response.status === 403) { clearSession(); … }
```

Or ce ne sont pas les mêmes évènements :

| | Ce que ça veut dire | Ce qu'il faut faire |
|---|---|---|
| **401** | le token ne vaut plus rien | couper la session, renvoyer au login |
| **403** | la session est **valide**, il manque une permission | ne rien couper, expliquer |

La note backend §2k le dit mot pour mot (« 403 → toast + retirer l'action ;
401 → login »). La règle vit désormais dans `utils/httpErreur.ts`, pure et
testée : une règle qui a déjà été fausse ne doit pas rester implicite.

**2. La garde de route ne regardait que le module.**

`canAccessModule` ignorait les `navGates`. Une URL tapée vers
`/evaluations/validation-rh` passait la garde pour un chef de service (le module
Évaluations lui est ouvert), la page s'affichait, son premier appel repartait en
403 — et la cause n° 1 le déconnectait. Nouveau helper `canAccessPath()` : il
retient la règle la plus **spécifique** qui préfixe le chemin, si bien qu'une
fiche `/evaluations/validation-rh/12` hérite de la règle de son onglet.

**3. Une cause de fond, que le backend contournait.**

La note demandait à l'utilisateur de « se déconnecter puis se reconnecter après
un changement de rôles ». Le store persiste en effet `user` — donc ses
permissions — dans le navigateur : après la vague F, le front affichait encore
les menus d'avant, et chaque clic finissait en 403. Ce n'est pas à l'utilisateur
de le savoir : `plugins/session.client.ts` relit `/user` au démarrage. Il échoue
silencieusement (réseau coupé ≠ session morte).

### Ce qui a changé côté ressenti

| Avant | Après |
|---|---|
| Page interdite → déconnexion sèche | Redirection vers l'accueil + « Votre compte n'a pas les droits pour cette page » |
| 403 sur une action → déconnexion sèche | Toast « Action non autorisée », qui précise que **la session reste ouverte** |
| 401 → éjection muette sur `/login` | `?raison=session` → encart « Votre session a expiré » |
| 500 muet → « Une erreur est survenue » | « Le serveur n'a pas répondu » : technique, pas métier |

### Alignement sur la note FE §2k (pull du 18/09)

- `/evaluations/validation-rh` passe de `anyRole: ["rh","admin"]` à
  `anyPermission: ["creer-evaluations"]` — même population, mais la note
  **interdit** de tester le nom du rôle pour un écran (un compte cumule souvent
  `directeur` + `rh`, ou `agent` + `rh-formation`) ;
- `/evaluations/tableau` et `/evaluations/bonifications` cumulent
  `creer-evaluations` **ou** le rôle `directeur-general` : aucune permission ne
  dit « RH ou DG » ;
- badge **« Vue : {bureau} »** dans la navbar pour les comptes cloisonnés. Sans
  lui, voir douze agents là où un collègue en voit deux cents se lit comme un
  bug, pas comme une règle ;
- le rôle `rh` gagne `consulter-roles`, les rôles hiérarchiques gagnent
  `creer-conges` / `creer-absences` (les chefs posent aussi leurs congés) —
  fixture de test recalée ;
- `User::niveauCloisonnement()` dérive le périmètre de la fonction
  (directeur → direction, chef de service → service, sinon bureau). Purement
  serveur : le front n'a rien à refiltrer, seulement à l'annoncer.

Déjà conformes, vérifiés sans modification : le store **unionne** les
permissions de tous les rôles (`flatMap`, pas `roles[0]`), et `hasRole` teste
l'ensemble des rôles.

## 5 sexies. Bouton « Nouveau » invisible sur une liste vide — ✅ 2026-09-18

Signalé sur les nominations : **aucune nomination → aucun bouton pour en créer
une.** Impasse complète.

La cause est dans `BaseDataState` : son état `empty` se rend **à la place** du
contenu. Sur une liste, cela emporte la table *et sa barre d'outils*, où vit le
bouton de création :

```vue
<BaseDataState :empty="!nominations.length">   <!-- ✗ masque tout -->
  <BaseTable>
    <template #actions>
      <UButton>Nouvelle nomination</UButton>   <!-- jamais rendu -->
```

Deux écrans touchés — nominations et affectations. Les référentiels y
échappaient : leur bouton « Nouveau » vit dans `BasePanel`, hors du
`BaseDataState`.

**La règle, désormais écrite dans les deux composants :** `empty` sert à « la
ressource n'existe pas » (fiche introuvable), jamais à « la liste est vide ».
Une liste vide se rend **dans** la table, dont `BaseTable` porte maintenant
l'état par défaut (`empty-label`, en français — `UTable` affichait sinon son
libellé anglais).

Comme le bug se reproduit d'un simple copier-coller et ne casse aucun test
fonctionnel, il est verrouillé par un **test structurel**
(`DataState.test.ts`) : il balaie les fichiers `.vue` et échoue si une barre
d'outils de table se trouve sous un `empty` qui l'effacerait. Vérifié : il
détecte bien les deux pages dans leur version d'avant correctif.

## 5 septies. Écran des comptes utilisateurs — ✅ 2026-09-18

La vague F était implémentée des deux côtés mais **inutilisable** : les routes
`POST/DELETE /users/{id}/bureau` n'avaient aucun point d'entrée dans l'interface,
et le module Administration n'avait pas d'écran de comptes.

`/administration/utilisateurs` — liste, création, édition, suppression, et
surtout le rattachement à un bureau. Trois partis pris :

1. **le rattachement est présenté comme une restriction.** « Rattacher au bureau
   X » se lit spontanément comme « donner accès à X » ; c'est l'inverse. L'écran
   affiche la conséquence exacte *avant* de valider, et le niveau réel dépend de
   la fonction (directeur → direction, chef de service → service, sinon bureau) ;
2. **tous les rôles sont affichés**, jamais le premier seul — c'est le piège que
   la note FE §2k signale (`directeur` + `rh`, `agent` + `rh-formation`). Ils
   sont colorés par famille (système / RH / hiérarchie / agent) plutôt qu'un ton
   par rôle ;
3. l'API ne pose qu'**un** rôle par écriture : l'écran le dit, au lieu de laisser
   croire qu'il gère le cumul.

Le sous-onglet est gaté sur `consulter-utilisateurs` : un chef de service entre
dans Administration par `consulter-structure` mais n'y voit pas les comptes.

**Reste à faire** : l'écran des rôles et permissions (`/roles`,
`/roles/{id}/permissions`, `GET /permissions`) — le contrat est en place
(`useRolesApi`, `usePermissionsApi`), l'écran non.

## 5 octies. Audit des notes FE du backend — ✅ 2026-09-18

Relecture complète de `doc/note-fe-etat-implementations.md` (2 155 lignes) et de
`note-fe-roles-comptes.md`, croisée avec un **audit de surface** : les
223 méthodes de la couche `api/` confrontées à leurs appelants réels.

### Corrigé

| Écart | Prescription | Correctif |
|---|---|---|
| Vue d'ensemble RH ouverte à tous les chefs | §2k.8 : « directeur → **pas** Reporting » | La porte était `consulter-reporting` **ou** `consulter-agents`. Or la page n'appelle que `/reporting/*` : tout chef y récoltait des 403. Ramenée à `consulter-reporting` seul |
| Checklist post-intégration absente | §3 : « `GET …/taches-post-integration`, compter uniquement `obligatoire === true` » | Onglet « À finaliser » sur le dossier, visible une fois `INTEGRE`. Avancement sur les seules tâches obligatoires ; les étapes 14–15 (affectation, nomination) restent affichées mais hors décompte |
| Réattribution du notateur absente | §7b : section dédiée `PUT …/superieur` | Bouton sur la fiche. Débloque l'alerte « agents sans N+1 » du tableau de bord, qui n'avait aucune action pour se résoudre. Règle `peutReattribuerSuperieur` testée : RH seulement, session ouverte, fiche non terminée |
| Résiliation de contrat absente | §4 (cycle des contrats) | Les actions étaient toutes conditionnées à un essai ouvert : passé la période probatoire, plus aucun moyen de mettre fin à un contrat. Bouton « Résilier », distinct de la rupture d'essai (art. 49) qui est un autre acte |
| Jeu de rôles de test dérivé | §2k.5 | `directeur` et `chef-bureau` manquaient ; `chef-service` avait un jeu incomplet. Les trois sont identiques dans le seeder — décrits une fois. `admin` ne collectait que les portes de module, jamais celles de sous-onglet : il se retrouvait sans `consulter-reporting` |
| Recette d'acceptation non testée | §2k.8 | Les sept profils de la recette sont désormais des tests : c'est là qu'on attrape une porte trop large avant l'utilisateur |

### Vérifié conforme, sans modification

Notifications (la cloche lit `meta.non_lues` de l'inbox — un appel au lieu de
deux), discipline (les cinq files et les deux PDF), affaires sociales,
formations (**y compris** la conversion stagiaire → agent, déjà en place),
paie (bulletin enrichi par ligne de lot), congés, positions conventionnelles,
et les deux pièges de §2k : le store **unionne** les permissions de tous les
rôles, `hasRole` les teste toutes.

### Écarts assumés, à trancher

1. **Carrière fermée à la hiérarchie.** La matrice §2k.3 place « Carrière
   (affectations, nominations) » sous `consulter-nominations`, que portent les
   directeurs et chefs. Je ne l'ai **pas** ouverte : les routes carrière n'ont
   aucun middleware de permission (la note le reconnaît — « routes encore peu
   middleware ») et les affectations **ne sont pas** cloisonnées par la vague F,
   qui ne couvre que `Agent`, `Absence`, `DemandeConge` et `Sanction`. Ouvrir
   l'onglet exposerait donc toutes les affectations de l'ARTF à chaque chef,
   sans garde serveur. À arbitrer avec le backend.

2. **Écran des rôles et permissions.** `GET/POST /roles`,
   `POST /roles/{id}/permissions`, `POST /roles/{id}/dupliquer`,
   `GET /permissions` : le contrat est en place, l'écran non. §2k le liste
   (« Rôles / permissions | `consulter-roles` »).

3. **Routes redondantes laissées de côté**, volontairement :
   `GET /notifications/non-lues` (l'inbox porte déjà le compteur),
   `GET /avancements/sessions/{id}/tableau` (l'écran a besoin des fiches
   *non* inscrites pour offrir la bascule), `GET /reporting/effectifs` et
   `/repartitions` (le dashboard les embarque), et les variantes de bulletin de
   paie qui mènent au même PDF.

## 5 nonies. Matrice des menus §2k.3 — vérifiée ligne à ligne — ✅ 2026-09-18

Les vingt-trois lignes de la matrice du backend, confrontées une à une à
`constants/modules.ts`. Résultat : **trois entrées de menu prescrites n'avaient
aucun écran**, les autres étaient conformes.

### Écrans créés

| Ligne de la matrice | Porte | Écran |
|---|---|---|
| Rôles / permissions | `consulter-roles` | `/administration/roles` — permissions **groupées par domaine** (le domaine se déduit du nom : `valider-conges` → congés, donc aucune table à maintenir), comparaison de deux rôles côte à côte, duplication. Lecture seule sans `modifier-roles` : aucune case cliquable, pas de case grisée décorative |
| Audit | rôle `admin` | `/administration/audit` — lecture seule par nature, détail JSON replié hors de la table |
| Paramètres app | rôle `admin` | `/administration/parametres` — couples clé/valeur, avec l'avertissement qui compte : renommer une clé revient à en créer une autre, et rien ne préviendra |

Ces deux dernières sont les **seules portes gardées par un rôle** et non par une
permission — les routes `/audit-logs` et `/parametres-application` portent
`role:admin`. La note assume l'exception ; on la reproduit, corollaire compris :
la RH, qui administre tout le reste, n'y a pas accès.

### Deux garde-fous

1. **La matrice est devenue un test.** Ses lignes sont transcrites avec, pour
   chacune, les rôles qui doivent voir l'écran **et ceux qui ne doivent pas**.
   C'est le second sens qui compte : une porte trop large ne se voit pas à
   l'usage, elle se traduit en 403 chez l'utilisateur concerné — exactement ce
   qui s'était produit sur la vue d'ensemble RH.
2. **Aucune entrée de menu ne mène nulle part.** Un test résout les 65
   destinations de la navigation contre les fichiers de `app/pages`. Un menu
   qui pointe vers un 404 est pire qu'un menu absent : l'utilisateur croit
   l'application cassée, et rien d'autre ne le signalerait avant la recette.

### Vérifié conforme sans modification

Écriture des référentiels gatée sur `creer-referentiels` / `modifier-referentiels`
(donc fermée aux rôles de bureau, comme prescrit) ; la file disciplinaire
retombe sur « mes rapports » pour un chef, qui n'a que `proposer-discipline` —
pas de 403 ; la cloche reste hors du système de portes.

### Contradiction à remonter au backend

La matrice §2k.3 place « Grille / salaires / paie » sous `consulter-salaires`,
que **le DG possède**. Mais le plan de test e2e P1.3 liste explicitement, pour
le DG : « ❌ Absent : Paie (saisie) … **Salaires (détail grille)** ». Les deux
documents se contredisent. La porte actuelle (`gerer-salaires`, que le DG n'a
pas) suit le plan de test, le plus récent et le plus précis. À trancher.

## 5 decies. Pull du 18/09 — `consulter-agents-global` — ✅ 2026-09-18

Un commit (`30ae572`) qui corrige un effet de bord de la vague F : un agent du
métier RH rattaché à un bureau se retrouvait cloisonné comme un chef, alors que
son travail est justement transverse. Le backend ajoute la permission
**`consulter-agents-global`** (`rh`, les cinq `rh-*`, le DG, l'admin) qui lève
entièrement le scope — sur les agents, mais aussi les congés, absences et
sanctions, puisque `voitPersonnelGlobal()` garde les deux scopes du trait.

### Le champ qui change tout : `vue_personnel`

`UserResource` expose désormais `vue_personnel` :
`globale | direction | service | bureau`, calculé par le serveur.

**C'est une correction pour nous, pas seulement un ajout.** Mon badge de
périmètre et la page profil déduisaient le niveau des **rôles** — une méthode
qui devient fausse : un compte peut être rattaché à un bureau **et** voir tout
l'effectif. Ils auraient annoncé une restriction inexistante.

| Écran | Avant | Après |
|---|---|---|
| Badge navbar | niveau déduit des rôles, affiché dès `bureau_id` | `vue_personnel` ; rien si `globale` |
| Profil | « Bureau de rattachement » | « Périmètre de consultation » : ce qu'il **voit**, le rattachement en second |
| Liste des comptes | colonne « bureau ou Global » | le périmètre effectif, le rattachement en sous-ligne |
| Modale de périmètre | « ce choix produira… » | idem, **plus** un avertissement quand le compte relève du métier RH : lui poser un bureau ne le restreindra pas |

`niveauCloisonnement(roles)` reste, explicitement dégradé au rang de **repli**
pour une API qui ne renverrait pas encore le champ — et documenté comme tel.

`voitPersonnelGlobal()` côté front est le miroir de la méthode serveur : il lit
la permission dans `roles[].permissions` quand elle est développée, sinon
retombe sur la liste de rôles que la note §2j énumère.

### Et côté menus : rien

La permission ne garde **aucun** écran — Personnel s'ouvre toujours sur
`consulter-agents`. C'est un périmètre, pas une porte. Un test le fixe
explicitement : un compte qui n'aurait que `consulter-agents-global` n'entre pas
dans `/personnel/agents`.

Le fixture de `admin` a dû changer de méthode au passage : il se construisait
depuis les portes de module, or cette permission n'apparaît dans aucune. Il
réunit désormais les portes de module, celles de sous-onglet **et** les
permissions de tous les autres rôles.

### État du dépôt backend

`develop` local est **en retard d'un commit** et en avance d'un (ton commit
`5532322`, non poussé). Je n'ai pas fait de `pull` : l'intégration a été lue
depuis `origin/develop` sans toucher à ta branche.

## 5 undecies. Liste Personnel non filtrée — fuite corrigée — ✅ 2026-09-18

Le pull `3a2e850` est purement documentaire, mais il signale en gras un
**breaking FE** — et nous étions dedans.

### Le problème

L'API expose **deux** listes d'agents qui se ressemblent :

| Route | Filtrée par structure ? | Permission de route |
|---|---|---|
| `GET /personnel/agents` | oui (vague F) | `consulter-agents` |
| `GET /integration/agents` | **non** | **aucune** |

`useAgentsApi().list()` visait la seconde. Conséquence : le menu Personnel, les
stagiaires et **tous les sélecteurs d'agent** de l'application renvoyaient
l'effectif entier. Un chef de service voyait les 61 agents de l'ARTF au lieu des
4 de son service.

Ce n'était pas un 403 mais une **fuite silencieuse** : la route n'a aucune garde
de permission côté serveur, elle répond simplement tout. Rien ne le signalait.

### Le correctif

`list()` pointe désormais sur `/personnel/agents`, et la variante non filtrée
survit sous un nom qui prévient — `listeDossiers()`, réservée au wizard de
recrutement, qui travaille par définition sur des dossiers pas encore rattachés
à une structure. `stagiaires()` s'appuie sur `/personnel/stagiaires` : le
filtrage en mémoire qui compensait l'absence d'endpoint dédié disparaît, avec
l'entorse à la règle « pas de filtrage mémoire » qu'il constituait.

Un **test structurel** interdit à toute page, composant ou composable de citer
`/integration/agents` (commentaires exclus) : la confusion se refait d'un
copier-coller, et elle ne casse rien de visible.

### Ce que voit chaque chef — vérifié dans le code, pas seulement dans la doc

`HasBureauScope::scopeMaStructure` élargit bien la sélection avant de filtrer :

| Niveau | Dérivé de | Population vue |
|---|---|---|
| `bureau` | `chef-bureau`, `agent` | son bureau **seul** |
| `service` | `chef-service` | **tous les bureaux** de son service + les agents rattachés au service |
| `direction` | `directeur`, DG | **tous les services et bureaux** de sa direction + les agents rattachés à la direction |

Un chef de service voit donc bien l'intégralité de son service, bureaux
compris. L'« exception pour certains bureaux clés » est la permission
`consulter-agents-global` : tout le métier RH (`rh` et les cinq `rh-*`) la
porte, ainsi que le DG et l'admin — ils voient tout l'effectif quel que soit
leur rattachement.

Deux limites du modèle, à connaître : un agent rattaché **directement au
service** échappe au chef de bureau (il n'est dans aucun bureau), et un agent
rattaché **directement à la direction** échappe au chef de service. C'est
cohérent, mais cela suppose que les affectations soient posées au bon niveau.

## 6. Décisions à trancher

| # | Sujet | Proposition |
|---|---|---|
| F1 | Chemin front du module évaluation | `/evaluations/…` (libellé « Évaluations »), le préfixe API `/avancements` reste dans les repos |
| F2 ✅ | Où vit la file des reclassements | **tranché** : `/carriere/reclassements`, gate Carrière élargi à `consulter-salaires` + `navGates` (le DG n'y voit que Reclassements et Positions) |
| F3 ✅ | Module Rémunération ouvert au DG (nouvelle permission) | **tranché, révisé le 18/09** : gate `anyPermission: ["gerer-salaires"]` (et non plus un test de rôle, qui excluait le bureau Solde de la vague F) ; le DG, qui n'a que `consulter-salaires`, passe toujours par Carrière > Reclassements et Positions |
| F4 | Grille de critères | onglet du module Évaluations (pas dans Administration > Référentiels) : c'est un paramétrage métier RH |
| F5 | Ordre des lots 2 / 3 vs corrections backend | lancer le lot 2 maintenant, conditionner le lot 3 à B1–B5 |
