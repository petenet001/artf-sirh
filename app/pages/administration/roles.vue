<script setup lang="ts">
import type { Role } from "~/schemas/role";
import {
  COULEUR_FAMILLE_ROLE,
  familleRole,
  grouperPermissions,
  libelleDomaine,
  libelleRole,
  verbePermission,
} from "~/constants/utilisateurs";

/**
 * Rôles et permissions (note FE §2k.3, ligne « Rôles / permissions »).
 *
 * Lecture pour `consulter-roles` (la RH), écriture pour `modifier-roles`
 * (l'administrateur). C'est l'écran qui répond à « pourquoi untel ne voit-il
 * pas cet écran ? » — la réponse est toujours une permission manquante.
 *
 * Trois partis pris :
 *
 * - **les permissions sont groupées par domaine**, pas listées à plat. Une
 *   centaine de lignes alphabétiques ne dit ni ce qu'un rôle couvre, ni ce qui
 *   lui manque. Le domaine se déduit du nom (`valider-conges` → congés) : la
 *   convention du backend sert de structure, aucune table à maintenir ;
 * - **on compare deux rôles côte à côte.** La question réelle n'est jamais
 *   « que contient `rh-solde` ? » mais « qu'a-t-il de moins que `rh` ? » ;
 * - **l'écriture est franchement séparée de la lecture.** Sans
 *   `modifier-roles`, aucune case n'est cliquable — pas de case grisée
 *   décorative qui laisserait croire à un bug.
 */
const rolesApi = useRolesApi();
const permissionsApi = usePermissionsApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const peutModifier = computed(() => auth.can("modifier-roles"));
const peutCreer = computed(() => auth.can("creer-roles"));

const { data: rolesData, pending, error, refresh } = useAsyncData("administration-roles", () =>
  rolesApi.list(),
);
const roles = computed(() =>
  [...(rolesData.value?.data ?? [])].sort((a, b) =>
    libelleRole(a.name).localeCompare(libelleRole(b.name), "fr"),
  ),
);

const { data: permsData } = useAsyncData("administration-permissions", () => permissionsApi.list());
const groupes = computed(() => grouperPermissions(permsData.value?.data ?? []));
const totalPermissions = computed(() => permsData.value?.data.length ?? 0);

// ── Sélection ────────────────────────────────────────────────────────────────

const roleId = ref<number | undefined>(undefined);
const comparaisonId = ref<number | undefined>(undefined);

/**
 * Le rôle affiché vient de `GET /roles/{id}` : la liste ne charge pas les
 * permissions, seul le `show` les développe.
 */
const { data: detailData, refresh: refreshDetail } = useAsyncData(
  () => `role-detail-${roleId.value ?? 0}`,
  () => (roleId.value ? rolesApi.getById(roleId.value) : Promise.resolve(null)),
  { watch: [roleId] },
);
const role = computed<Role | null>(() => detailData.value?.data ?? null);

const { data: comparaisonData } = useAsyncData(
  () => `role-comparaison-${comparaisonId.value ?? 0}`,
  () => (comparaisonId.value ? rolesApi.getById(comparaisonId.value) : Promise.resolve(null)),
  { watch: [comparaisonId] },
);
const comparaison = computed<Role | null>(() => comparaisonData.value?.data ?? null);

/** Premier rôle sélectionné d'office : un écran vide n'apprend rien. */
watchEffect(() => {
  if (!roleId.value && roles.value.length) roleId.value = roles.value[0]!.id;
});

const roleOptions = computed(() =>
  roles.value.map((r) => ({ label: libelleRole(r.name), value: r.id })),
);
const comparaisonOptions = computed(() => [
  { label: "Ne pas comparer", value: 0 },
  ...roleOptions.value.filter((o) => o.value !== roleId.value),
]);

// ── État d'édition ───────────────────────────────────────────────────────────

const selection = ref<Set<string>>(new Set());
const busy = ref(false);

watch(
  role,
  (r) => {
    selection.value = new Set((r?.permissions ?? []).map((p) => p.name));
  },
  { immediate: true },
);

const permissionsComparees = computed(
  () => new Set((comparaison.value?.permissions ?? []).map((p) => p.name)),
);

/** Modifications en attente : le bouton ne s'active que s'il y a quelque chose à envoyer. */
const initiales = computed(() => new Set((role.value?.permissions ?? []).map((p) => p.name)));
const modifie = computed(() => {
  if (selection.value.size !== initiales.value.size) return true;
  for (const p of selection.value) if (!initiales.value.has(p)) return true;
  return false;
});

function basculer(nom: string) {
  if (!peutModifier.value) return;
  const copie = new Set(selection.value);
  if (copie.has(nom)) copie.delete(nom);
  else copie.add(nom);
  selection.value = copie;
}

/** Coche ou décoche tout un domaine d'un geste. */
function basculerDomaine(permissions: { name: string }[]) {
  if (!peutModifier.value) return;
  const noms = permissions.map((p) => p.name);
  const toutes = noms.every((n) => selection.value.has(n));
  const copie = new Set(selection.value);
  for (const n of noms) {
    if (toutes) copie.delete(n);
    else copie.add(n);
  }
  selection.value = copie;
}

async function enregistrer() {
  if (!role.value) return;
  busy.value = true;
  try {
    await rolesApi.assignPermissions(role.value.id, { permissions: [...selection.value] });
    toast.add({ title: "Permissions mises à jour", color: "success" });
    await refreshDetail();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

function annuler() {
  selection.value = new Set(initiales.value);
}

// ── Duplication ──────────────────────────────────────────────────────────────

async function dupliquer() {
  if (!role.value) return;
  if (!confirm(`Créer une copie du rôle « ${libelleRole(role.value.name)} » ?`)) return;
  busy.value = true;
  try {
    const { data: copie } = await rolesApi.dupliquer(role.value.id);
    toast.add({ title: `Rôle « ${copie.name} » créé`, color: "success" });
    await refresh();
    roleId.value = copie.id;
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <BasePanel title="Rôles et permissions" subtitle="Ce que chaque rôle donne le droit de faire">
    <template #actions>
      <UButton
        v-if="peutCreer && role"
        color="neutral"
        variant="soft"
        icon="i-lucide-copy"
        :loading="busy"
        title="Créer un rôle reprenant les mêmes permissions"
        @click="dupliquer"
      >
        Dupliquer
      </UButton>
    </template>

    <UAlert
      v-if="!peutModifier"
      class="mb-4"
      color="neutral"
      variant="subtle"
      icon="i-lucide-eye"
      title="Consultation seule"
      description="Votre compte peut lire la configuration des rôles, pas la modifier."
    />

    <BaseDataState :pending="pending" :error="error">
      <div class="space-y-4">
        <!-- Sélection et comparaison -->
        <div class="rounded-xl border border-default bg-default p-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Rôle" name="role">
              <USelectMenu v-model="roleId" :items="roleOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField
              label="Comparer avec"
              name="comparaison"
              help="Met en évidence ce que l'autre rôle possède en plus."
            >
              <USelectMenu
                :model-value="comparaisonId ?? 0"
                :items="comparaisonOptions"
                value-key="value"
                class="w-full"
                @update:model-value="comparaisonId = $event || undefined"
              />
            </UFormField>
          </div>

          <div v-if="role" class="mt-4 flex flex-wrap items-center gap-3 border-t border-default pt-4">
            <UBadge :color="COULEUR_FAMILLE_ROLE[familleRole(role.name)]" variant="subtle">
              {{ libelleRole(role.name) }}
            </UBadge>
            <span class="text-sm text-muted">
              <strong class="font-semibold text-highlighted">{{ selection.size }}</strong>
              permission{{ selection.size > 1 ? "s" : "" }} sur {{ totalPermissions }}
            </span>
            <code class="rounded bg-elevated px-1.5 py-0.5 text-xs text-toned">{{ role.name }}</code>
          </div>
        </div>

        <!-- Permissions, par domaine -->
        <div v-if="role" class="space-y-3">
          <div
            v-for="groupe in groupes"
            :key="groupe.domaine"
            class="rounded-xl border border-default bg-default p-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-medium text-highlighted">{{ libelleDomaine(groupe.domaine) }}</h3>
              <UButton
                v-if="peutModifier"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="basculerDomaine(groupe.permissions)"
              >
                Tout cocher / décocher
              </UButton>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label
                v-for="permission in groupe.permissions"
                :key="permission.id"
                class="flex items-start gap-2 rounded-lg border border-default p-2.5"
                :class="[
                  peutModifier ? 'cursor-pointer hover:bg-elevated/60' : 'cursor-default',
                  // Ce que le rôle comparé a en plus : c'est l'écart qu'on cherche.
                  comparaison && permissionsComparees.has(permission.name) && !selection.has(permission.name)
                    ? 'border-warning/50 bg-warning/5'
                    : '',
                ]"
              >
                <UCheckbox
                  :model-value="selection.has(permission.name)"
                  :disabled="!peutModifier"
                  @update:model-value="basculer(permission.name)"
                />
                <span class="min-w-0">
                  <span class="block text-sm text-highlighted">
                    {{ verbePermission(permission.name) ?? permission.name }}
                  </span>
                  <span class="block truncate text-xs text-dimmed">{{ permission.name }}</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Barre d'enregistrement : n'apparaît que s'il y a quelque chose à enregistrer. -->
        <div
          v-if="peutModifier && modifie"
          class="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-default p-4 shadow-lg"
        >
          <p class="text-sm text-muted">
            Modifications non enregistrées sur
            <strong class="font-medium text-highlighted">{{ role ? libelleRole(role.name) : "" }}</strong>.
          </p>
          <div class="flex gap-2">
            <UButton color="neutral" variant="ghost" @click="annuler">Annuler</UButton>
            <UButton :loading="busy" @click="enregistrer">Enregistrer les permissions</UButton>
          </div>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
