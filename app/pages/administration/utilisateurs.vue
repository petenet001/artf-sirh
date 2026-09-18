<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { User, UserInput } from "~/schemas/user";
import { agentNom } from "~/constants/carriere";
import {
  COULEUR_FAMILLE_ROLE,
  descriptionPerimetre,
  familleRole,
  libelleRole,
  nomsRoles,
  vueEffective,
  voitPersonnelGlobal,
  LIBELLE_NIVEAU,
} from "~/constants/utilisateurs";

/**
 * Comptes utilisateurs : création, rôle, compte agent lié, et **rattachement à
 * un bureau DRHL** (vague F).
 *
 * C'est le seul écran d'où le cloisonnement se pilote. Sans lui, les routes
 * `POST/DELETE /users/{id}/bureau` livrées par le backend n'avaient aucun point
 * d'entrée : la vague F était implémentée des deux côtés, mais inutilisable.
 *
 * Deux partis pris :
 *
 * - **le rattachement est présenté comme une restriction**, pas comme un droit.
 *   « Rattacher au bureau X » se lit spontanément comme « donner accès à X » ;
 *   c'est l'inverse, et l'écran le dit en toutes lettres avant de valider ;
 * - **tous les rôles sont affichés**, jamais le premier seul. Un compte cumule
 *   couramment `directeur` + `rh`, ou `agent` + `rh-formation` : n'en montrer
 *   qu'un donnerait une image fausse de ses droits. L'API ne sait en revanche
 *   poser qu'**un** rôle par écriture — l'écran le signale plutôt que de
 *   laisser croire qu'il gère le cumul.
 */
const api = useUsersApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutCreer = computed(() => auth.can("creer-utilisateurs"));
const peutModifier = computed(() => auth.can("modifier-utilisateurs"));
const peutSupprimer = computed(() => auth.can("supprimer-utilisateurs"));

const { data, pending, error, refresh } = useAsyncData("administration-utilisateurs", () =>
  api.list(),
);
const utilisateurs = computed(() => data.value?.data ?? []);

const ALL = "__all__";
const filtreRole = ref<string>(ALL);
const rolesPresents = computed(() =>
  [...new Set(utilisateurs.value.flatMap((u) => nomsRoles(u)))].sort(),
);
const roleItems = computed(() => [
  { label: "Tous les rôles", value: ALL },
  ...rolesPresents.value.map((r) => ({ label: libelleRole(r), value: r })),
]);

const rows = computed(() =>
  filtreRole.value === ALL
    ? utilisateurs.value
    : utilisateurs.value.filter((u) => nomsRoles(u).includes(filtreRole.value)),
);

// ── Référentiels du formulaire ───────────────────────────────────────────────

/**
 * Rôles disponibles. `useResourceOptions` indexe sur l'`id` ; l'API des
 * utilisateurs attend le **nom** du rôle (`rh-solde`, pas `7`). On compose donc
 * les options à la main plutôt que d'envoyer la mauvaise clé.
 */
const { data: rolesData } = useAsyncData("utilisateurs-roles", () => useRolesApi().list());
const roleOptions = computed(() =>
  (rolesData.value?.data ?? [])
    .map((r) => ({ label: libelleRole(r.name), value: r.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr")),
);
const { options: agentOptions } = useResourceOptions(
  "utilisateurs-agents",
  () => useAgentsApi().list(),
  (a) => agentNom(a),
);
const { options: bureauOptions, labelById: bureauLabel } = useResourceOptions(
  "utilisateurs-bureaux",
  () => useBureauxApi().list(),
);

// ── Création / édition ───────────────────────────────────────────────────────

const open = ref(false);
const busy = ref(false);
const editing = ref<User | null>(null);

// État du formulaire (sans `null` : les contrôles de saisie veulent `undefined`).
const nom = ref("");
const email = ref("");
const motDePasse = ref("");
const role = ref<string | undefined>(undefined);
const agentId = ref<number | undefined>(undefined);
const actif = ref(true);

function ouvrir(user?: User) {
  editing.value = user ?? null;
  nom.value = user?.name ?? "";
  email.value = user?.email ?? "";
  motDePasse.value = "";
  // À l'édition, on pré-sélectionne le rôle « principal » : le premier par
  // ordre alphabétique, faute de notion de rôle principal côté API.
  role.value = user ? nomsRoles(user)[0] : undefined;
  agentId.value = user?.agent_id ?? undefined;
  actif.value = user?.is_active ?? true;
  open.value = true;
}

async function enregistrer() {
  if (!nom.value.trim() || !email.value.trim()) {
    toast.add({ title: "Nom et adresse e-mail sont requis.", color: "error" });
    return;
  }
  if (!editing.value && motDePasse.value.length < 8) {
    toast.add({ title: "Le mot de passe doit faire au moins 8 caractères.", color: "error" });
    return;
  }

  busy.value = true;
  try {
    if (editing.value) {
      const payload: Partial<UserInput> = {
        name: nom.value.trim(),
        email: email.value.trim(),
        role: role.value ?? null,
        agent_id: agentId.value ?? null,
        is_active: actif.value,
      };
      // Mot de passe vide = inchangé ; l'envoyer vide le réinitialiserait.
      if (motDePasse.value) payload.password = motDePasse.value;
      await api.update(editing.value.id, payload);
      toast.add({ title: "Compte mis à jour", color: "success" });
    } else {
      await api.create({
        name: nom.value.trim(),
        email: email.value.trim(),
        password: motDePasse.value,
        role: role.value ?? null,
        agent_id: agentId.value ?? null,
        is_active: actif.value,
      });
      toast.add({ title: "Compte créé", color: "success" });
    }
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function supprimer(user: User) {
  if (!confirm(`Supprimer le compte de ${user.name} ? Cette action est définitive.`)) return;
  try {
    await api.remove(user.id);
    toast.add({ title: "Compte supprimé", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

// ── Périmètre (vague F) ──────────────────────────────────────────────────────

const perimetreOpen = ref(false);
const cible = ref<User | null>(null);
const bureauChoisi = ref<number | undefined>(undefined);

function ouvrirPerimetre(user: User) {
  cible.value = user;
  bureauChoisi.value = user.bureau_id ?? undefined;
  perimetreOpen.value = true;
}

/** Ce que le choix en cours produira, écrit avant de cliquer. */
const effetPerimetre = computed(() => {
  if (!cible.value) return "";
  // On décrit l'effet du **choix en cours**, pas l'état actuel. Sans bureau, la
  // vue redevient globale ; avec un bureau, elle ne se restreint que si le
  // compte ne porte pas `consulter-agents-global` — le dire avant le clic,
  // pas après.
  const restreint = bureauChoisi.value != null && !voitPersonnelGlobal(cible.value);
  return descriptionPerimetre({
    ...cible.value,
    bureau_id: bureauChoisi.value ?? null,
    vue_personnel: restreint ? undefined : "globale",
  });
});

async function enregistrerPerimetre() {
  if (!cible.value) return;
  busy.value = true;
  try {
    if (bureauChoisi.value) {
      await api.rattacherBureau(cible.value.id, bureauChoisi.value);
      toast.add({ title: "Périmètre restreint", color: "success" });
    } else {
      await api.retirerBureau(cible.value.id);
      toast.add({ title: "Cloisonnement retiré — accès global", color: "success" });
    }
    perimetreOpen.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

const columns: TableColumn<User>[] = [
  { accessorKey: "name", header: "Utilisateur" },
  { id: "roles", header: "Rôles" },
  { id: "perimetre", header: "Périmètre" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "" },
];
</script>

<template>
  <BasePanel
    title="Comptes utilisateurs"
    subtitle="Accès à l'application, rôles et périmètre de consultation"
  >
    <template #actions>
      <UButton v-if="peutCreer" icon="i-lucide-user-plus" @click="ouvrir()">Nouveau compte</UButton>
    </template>

    <UAlert
      class="mb-4"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Rôle et périmètre sont deux choses différentes"
      description="Le rôle dit ce qu'un compte a le droit de faire. Le bureau de rattachement, lui, ne donne aucun droit : il restreint les listes que le compte peut consulter à sa seule structure."
    />

    <BaseDataState :pending="pending" :error="error">
      <BaseTable
        :data="rows"
        :columns="columns"
        searchable
        search-placeholder="Rechercher un nom, un e-mail…"
        :page-size="15"
        empty-label="Aucun compte utilisateur."
      >
        <template #filters>
          <USelect v-model="filtreRole" :items="roleItems" class="w-56" />
        </template>

        <template #name-cell="{ row }">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-highlighted">{{ row!.original.name }}</p>
            <p class="truncate text-xs text-muted">{{ row!.original.email }}</p>
          </div>
        </template>

        <!-- Tous les rôles, jamais le premier seul : un compte en cumule souvent. -->
        <template #roles-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="nomRole in nomsRoles(row!.original)"
              :key="nomRole"
              :color="COULEUR_FAMILLE_ROLE[familleRole(nomRole)]"
              variant="subtle"
              size="sm"
            >
              {{ libelleRole(nomRole) }}
            </UBadge>
            <span v-if="!nomsRoles(row!.original).length" class="text-xs text-muted">
              Aucun rôle
            </span>
          </div>
        </template>

        <!--
          Le rattachement et le périmètre effectif sont deux choses distinctes
          depuis `consulter-agents-global` : un compte du métier RH peut être
          rattaché à un bureau et voir tout l'effectif. On affiche donc ce qu'il
          voit, et le bureau seulement en second, comme contexte.
        -->
        <template #perimetre-cell="{ row }">
          <div class="min-w-0">
            <span
              class="inline-flex items-center gap-1.5 text-sm"
              :class="vueEffective(row!.original) === 'globale' ? 'text-muted' : 'text-highlighted'"
            >
              <UIcon
                :name="vueEffective(row!.original) === 'globale' ? 'i-lucide-globe' : 'i-lucide-scan-eye'"
                class="size-3.5"
              />
              {{ LIBELLE_NIVEAU[vueEffective(row!.original)] }}
            </span>
            <p v-if="row!.original.bureau_id" class="truncate text-xs text-dimmed">
              rattaché à
              {{ row!.original.bureau?.sigle ?? row!.original.bureau?.nom ?? bureauLabel[row!.original.bureau_id] ?? `bureau nº ${row!.original.bureau_id}` }}
            </p>
          </div>
        </template>

        <template #statut-cell="{ row }">
          <UBadge :color="row!.original.is_active === false ? 'neutral' : 'success'" variant="subtle">
            {{ row!.original.is_active === false ? "Désactivé" : "Actif" }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              v-if="peutModifier"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-scan-eye"
              title="Définir le périmètre de consultation"
              @click="ouvrirPerimetre(row!.original)"
            />
            <UButton
              v-if="peutModifier"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              title="Modifier le compte"
              @click="ouvrir(row!.original)"
            />
            <UButton
              v-if="peutSupprimer"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              title="Supprimer le compte"
              @click="supprimer(row!.original)"
            />
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <!-- Création / édition -->
    <UModal v-model:open="open" :title="editing ? 'Modifier le compte' : 'Nouveau compte'">
      <template #body>
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Nom affiché" name="name" required>
              <UInput v-model="nom" class="w-full" />
            </UFormField>
            <UFormField label="Adresse e-mail" name="email" required>
              <UInput v-model="email" type="email" class="w-full" />
            </UFormField>
          </div>

          <UFormField
            label="Mot de passe"
            name="password"
            :required="!editing"
            :help="editing ? 'Laisser vide pour ne pas le changer.' : 'Huit caractères au minimum.'"
          >
            <UInput v-model="motDePasse" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>

          <UFormField
            label="Rôle"
            name="role"
            help="L'API n'en pose qu'un par enregistrement. Les rôles supplémentaires d'un compte restent en place et se gèrent côté serveur."
          >
            <USelectMenu
              v-model="role"
              :items="roleOptions"
              value-key="value"
              placeholder="Aucun rôle"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Agent lié"
            name="agent_id"
            help="Donne au compte son espace personnel : ses congés, ses absences, sa fiche d'évaluation."
          >
            <USelectMenu
              v-model="agentId"
              :items="agentOptions"
              value-key="value"
              placeholder="Aucun agent lié"
              class="w-full"
            />
          </UFormField>

          <UCheckbox v-model="actif" label="Compte actif" />

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">
              {{ editing ? "Enregistrer" : "Créer le compte" }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Périmètre de consultation (vague F) -->
    <UModal v-model:open="perimetreOpen" title="Périmètre de consultation">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Compte de <strong class="font-medium text-highlighted">{{ cible?.name }}</strong>.
          </p>

          <UFormField
            label="Bureau de rattachement"
            name="bureau_id"
            help="Laisser vide pour un accès global (direction générale, administrateurs)."
          >
            <USelectMenu
              v-model="bureauChoisi"
              :items="bureauOptions"
              value-key="value"
              placeholder="Aucun — accès global"
              class="w-full"
            />
          </UFormField>

          <!--
            L'effet est écrit avant le clic, et formulé comme une restriction.
            « Rattacher au bureau X » se lit spontanément comme « donner accès
            à X » : c'est exactement l'inverse.
          -->
          <UAlert
            :color="bureauChoisi ? 'warning' : 'neutral'"
            variant="subtle"
            :icon="bureauChoisi ? 'i-lucide-scan-eye' : 'i-lucide-globe'"
            title="Ce que ce choix produira"
            :description="effetPerimetre"
          />

          <UAlert
            v-if="cible && bureauChoisi && voitPersonnelGlobal(cible)"
            color="neutral"
            variant="subtle"
            icon="i-lucide-info"
            title="Ce compte restera sur une vue globale"
            description="Il relève du métier RH transverse (permission « consulter-agents-global ») : le rattachement sert alors d'information d'organigramme, il ne restreint pas ses listes."
          />

          <p class="text-xs text-muted">
            Pour un compte cloisonné, l'étendue dépend de sa fonction : un directeur voit sa
            direction entière, un chef de service son service, les autres leur seul bureau.
          </p>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="perimetreOpen = false">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrerPerimetre">Appliquer</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </BasePanel>
</template>
