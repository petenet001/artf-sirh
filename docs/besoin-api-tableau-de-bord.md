# Besoin API — Vue d'ensemble RH

> Note **front → back**, pendant de `doc/note-fe-etat-implementations.md`.
> Révisée le 2026-09-17 après livraison du module Reporting D.6 (`bd6b23e`).

## Ce qui est livré, et branché

Le module **Reporting D.6** couvre l'essentiel du besoin. La vue d'ensemble RH du
front consomme désormais :

| Route | Ce qu'elle alimente à l'écran |
|---|---|
| `GET /reporting/dashboard` | chiffre d'effectif présent, agents actifs, stagiaires, arrivées et départs de l'année, masse salariale du dernier lot clôturé, six répartitions |
| `GET /reporting/stats/conges` | agents en congé aujourd'hui, jours demandés contre accordés, demandes par étape du circuit, jours par type, volume d'absences |
| `GET /reporting/stats/evaluations` | avancement de la campagne, note moyenne, mentions attribuées |
| `GET /reporting/alertes` | bloc « À régulariser », trié par gravité |
| `GET /reporting/exports/{type}` | boutons d'export CSV et PDF |

Deux points relevés à l'intégration, sans gravité :

- `GET /reporting/effectifs` est **paginé** (`meta`). C'est la deuxième exception
  à la règle « pas de pagination » de l'API, après l'inbox des notifications —
  signalée ici pour qu'elle reste consciente, pas pour être corrigée.
- Le dashboard renvoie `masse_salariale` à tout détenteur de
  `consulter-reporting`. Sans conséquence aujourd'hui (le DG a aussi
  `consulter-salaires`), mais un futur rôle « reporting sans salaires » verrait
  la masse. Voir la demande 4.

## Ce qui reste demandé

Quatre demandes, par ordre d'utilité.

### 1. Les séries mensuelles

Le plan du module a écarté l'historisation du périmètre V1 (§7 « Hors scope »).

**Ce que le front trace déjà sans vous**, en recomposant depuis des listes
existantes — donc ne le refaites pas, sauf pour le sortir d'un seul appel :

| Courbe | Source | Exactitude |
|---|---|---|
| Masse salariale mensuelle | `GET /paie/lots` (statut `valide`/`cloture`) | exacte — un lot porte son année, son mois, ses totaux |
| Congés accordés / absences déclarées par mois de **début** | `GET /conges/demandes`, `GET /absences` | exacte — une période commence à une date et une seule |

**Ce qui manque vraiment**, parce qu'aucune règle ne permet de le calculer côté
front :

```json
"series": {
  "effectif":  [ { "periode": "2026-01", "effectif": 225, "arrivees": 3, "departs": 1 } ],
  "conges":    [ { "periode": "2026-01", "demandes": 18, "jours_poses": 120 } ],
  "paie":      [ { "periode": "2026-01", "total_gains": 92000000, "total_retenues": 7500000,
                   "total_net": 84500000, "nb_lignes": 246 } ]
}
```

Un point par mois **même à zéro** : une série trouée fait une courbe trouée.
Profondeur pilotée par une query `mois` (défaut 12, max 36).

> ⚠️ **`jours_poses` par mois : à trancher côté métier.** Un congé du 28 février
> au 9 mars, c'est 10 jours en février, ou 1 en février et 9 en mars, ou un
> prorata de jours ouvrés ? Le front ne peut pas choisir à votre place — c'est
> pour cette raison qu'il compte aujourd'hui des **événements** (combien de
> congés démarrent chaque mois) et non des jours. Dès que la règle est fixée et
> appliquée côté serveur, la courbe en jours s'ajoute ; elle ne remplace pas
> celle des événements, qui ne mesure pas la même chose.

> ⚠️ **Point de modèle, à trancher avant de coder.** La série d'effectif ne peut
> pas être reconstruite depuis `agents.date_prise_service` et
> `agents.archived_at` : le désarchivage remet `archived_at` à `null`, donc la
> sortie disparaît rétroactivement et la courbe ment sur le passé. Deux options :
>
> 1. **table de snapshot mensuel** — `effectifs_mensuels` (`periode`,
>    `effectif`, `arrivees`, `departs`), alimentée par un job mensuel. Le plus
>    juste, et réutilisable pour tout reporting futur ;
> 2. **historiser les archivages** — `agent_archivages` (`agent_id`,
>    `archive_le`, `desarchive_le`, `motif_code`) et reconstruire à partir de là.
>
> Sans l'une des deux, autant ne pas renvoyer la série d'effectif : le front
> affichera les stocks sans la courbe plutôt qu'une courbe fausse.

### 2. Les blocs discipline et intégration

Absents du dashboard, et listés eux aussi en hors-scope V1.

```json
"discipline": {
  "en_cours": 3,
  "par_statut": { "en_attente": 1, "instruite": 2, "validee": 7, "rejetee": 1 }
},
"integration": {
  "en_cours": 6,
  "par_statut": { "SOUMIS": 2, "EN_ETUDE_RH": 3, "VALIDE_DG": 1 }
}
```

### 3. Les compteurs de files personnalisées

Les alertes couvrent la conformité (ce qui est en défaut). Manque l'autre moitié :
**ce qui attend une action de l'utilisateur connecté**. Toutes les routes
existent déjà — il s'agit de les compter en un seul appel plutôt qu'en dix.

```json
"files": {
  "conges_a_valider": 7,
  "absences_a_valider": 3,
  "sanctions_a_instruire": 1,
  "sanctions_a_prononcer": 0,
  "reclamations_en_attente": 2,
  "bonifications_en_attente": 1,
  "avancements_exceptionnels_en_attente": 0,
  "evaluations_a_noter": 12,
  "evaluations_a_valider_rh": 8
}
```

Les files `a-valider` sont déjà personnalisées selon l'appelant : garder ce
comportement, et n'inclure un compteur que si l'appelant a la permission
correspondante.

### 4. L'écrêtage par bloc

Aujourd'hui c'est tout ou rien sur `consulter-reporting`. À froid : qu'un bloc
dont l'appelant n'a pas la permission de lecture soit **absent** de la réponse —
pas à zéro, pas à `null` — pour que le front n'ait pas à rejouer la matrice de
permissions.

| Bloc | Permission |
|---|---|
| `effectif`, `repartitions` | `consulter-agents` |
| `conges` | `consulter-conges` |
| `masse_salariale`, `paie` | `consulter-salaires` |
| `evaluation` | `consulter-evaluations` |
| `discipline` | `consulter-discipline` |
| `integration` | `consulter-recrutement` |

### 5. Filtrer la liste Personnel par structure

**Besoin :** un compte du métier RH porte `consulter-agents-global` — le serveur
lui renvoie **tout l'effectif**, et `GET /personnel/agents` n'accepte aucun
filtre de structure. Il n'a donc aucun moyen de demander « seulement mon
service », alors que c'est sa vue de travail quotidienne.

Le front range aujourd'hui la liste **en mémoire**, en reconstruisant
l'organigramme depuis `/bureaux` et `/services`. Ça fonctionne, mais :

- ça suppose de charger deux référentiels à chaque ouverture de l'écran ;
- ça ne survivra pas à une liste paginée ;
- et un filtre de structure a sa place à côté de `statut` et
  `type_integration_id`, pas dans le navigateur.

**Demande :** whitelister trois filtres sur `GET /personnel/agents` (et
`/personnel/stagiaires`) :

```
GET /personnel/agents?direction_id=3
GET /personnel/agents?service_id=10
GET /personnel/agents?bureau_id=100
```

Sémantique attendue — celle de `HasBureauScope::scopeMaStructure`, appliquée à
une structure **explicite** au lieu de celle de l'utilisateur :

| Filtre | Population |
|---|---|
| `bureau_id` | agents affectés à ce bureau |
| `service_id` | agents du service **et de tous ses bureaux** |
| `direction_id` | agents de la direction, de ses services et de leurs bureaux |

Le précédent existe : `GET /reporting/effectifs` accepte déjà exactement ces
trois paramètres (`Reporting\FilterRequest`).

> ⚠️ **Ce filtre ne remplace pas le cloisonnement** : il s'y ajoute. Un
> utilisateur cloisonné qui demanderait une structure hors de son périmètre doit
> recevoir une liste vide, jamais des agents qu'il n'a pas le droit de voir.
> L'ordre est donc : scope d'abord, filtre ensuite.

**Confort, pas sécurité.** Côté front, le sélecteur s'intitule « Affichage » et
non « Accès » : personne ne doit croire que le décocher protège quoi que ce soit.

## Conventions (rappel)

1. **Maps vides = `{}`**, jamais `[]` — le piège existe déjà sur
   `sessions/{id}/stats`, où `par_statut` et `mentions` sortent en tableau quand
   la session est vide.
2. **Nombres en nombres** : les `decimal` Laravel sortent en chaînes si on n'y
   prend pas garde (`"84500000.00"`) ; on attend `84500000`.
3. **Périodes en `YYYY-MM`**, dates en `Y-m-d`, horodatages en `Y-m-d H:i:s`.
4. **Un seul appel.** Si le calcul est lourd, un cache serveur de 5 à 15 minutes
   convient ; exposer alors `genere_le`.
