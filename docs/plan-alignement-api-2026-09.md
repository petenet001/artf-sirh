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

## 6. Décisions à trancher

| # | Sujet | Proposition |
|---|---|---|
| F1 | Chemin front du module évaluation | `/evaluations/…` (libellé « Évaluations »), le préfixe API `/avancements` reste dans les repos |
| F2 ✅ | Où vit la file des reclassements | **tranché** : `/carriere/reclassements`, gate Carrière élargi à `consulter-salaires` + `navGates` (le DG n'y voit que Reclassements et Positions) |
| F3 ✅ | Module Rémunération ouvert au DG (nouvelle permission) | **tranché** : Grille / Salaires / Paie gatés sur `anyRole: ["rh","admin"]` ; le DG passe par Carrière > Reclassements et Positions |
| F4 | Grille de critères | onglet du module Évaluations (pas dans Administration > Référentiels) : c'est un paramétrage métier RH |
| F5 | Ordre des lots 2 / 3 vs corrections backend | lancer le lot 2 maintenant, conditionner le lot 3 à B1–B5 |
