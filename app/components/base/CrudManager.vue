<script setup lang="ts" generic="T extends { id: number }, I">
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import type { ZodType } from "zod";
import type { CrudRepo, CrudField } from "~/types/crud";
import type { ListParams } from "~/types/api";

/**
 * Primitive CRUD réutilisable pour les ressources simples (référentiels…).
 * Gère liste (collection plate filtrée serveur), création/édition via modale
 * et suppression — le tout piloté par un repository et une liste de champs.
 * Tue le boilerplate : une page référentiel devient une dizaine de lignes.
 */
const props = defineProps<{
  cacheKey: string;
  title: string;
  subtitle?: string;
  repo: CrudRepo<T, I>;
  columns: TableColumn<T>[];
  fields: CrudField[];
  schema: ZodType<I>;
  /** Libellé singulier de l'entité, pour les messages (« grade créé »). */
  entityLabel: string;
  /** Active une recherche par `nom` (égalité exacte côté API). */
  searchable?: boolean;
  /**
   * Autorise la création et l'édition. À `false` (droit manquant), on masque le
   * bouton « Nouveau » et le crayon d'édition (cf. note rôles — un 403 ⇒ masquer,
   * ne pas proposer). Défaut : `true` (aucun changement pour les pages existantes).
   */
  canWrite?: boolean;
  /**
   * Autorise la suppression (corbeille). Gardé à part car un rôle peut créer /
   * éditer sans pouvoir supprimer (ex. `rh` sur les référentiels). Défaut :
   * suit `canWrite`.
   */
  canDelete?: boolean;
}>();

const writable = computed(() => props.canWrite !== false);
const deletable = computed(() => props.canDelete ?? writable.value);
const hasRowActions = computed(() => writable.value || deletable.value);

const toast = useToast();
const handleError = useApiError();

// — Liste ——————————————————————————————————————————————————————
const filters = reactive<ListParams>({});
const { data, pending, error, refresh } = useAsyncData(
  props.cacheKey,
  () => props.repo.list({ ...filters }),
  { watch: [filters] },
);
const items = computed(() => data.value?.data ?? []);

// Colonne d'actions ajoutée à la volée à droite du tableau (si une action existe).
const columns = computed<TableColumn<T>[]>(() =>
  hasRowActions.value ? [...props.columns, { id: "actions", header: "" }] : [...props.columns],
);

// — Formulaire (création / édition) ————————————————————————————
const open = ref(false);
const submitting = ref(false);
const editing = ref<T | null>(null);
// Sac de formulaire générique : clés dynamiques (issues de `fields`), donc typé
// en Record. `UForm` infère l'état depuis le schéma : on lui présente donc le
// schéma en version concrète `Record` (cast unique, justifié par le caractère
// générique de cette primitive) et on revalide les types métier au submit.
const state = reactive<Record<string, unknown>>({});
const formSchema = props.schema as unknown as ZodType<Record<string, unknown>>;

function resetState(source?: T) {
  for (const key of Object.keys(state)) state[key] = undefined;
  for (const field of props.fields) {
    const raw = source ? (source as Record<string, unknown>)[field.name] : undefined;
    state[field.name] = field.type === "switch" ? raw ?? false : raw ?? undefined;
  }
}

function openCreate() {
  editing.value = null;
  resetState();
  open.value = true;
}

function openEdit(row: T) {
  editing.value = row;
  resetState(row);
  open.value = true;
}

async function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  submitting.value = true;
  // `event.data` est validé par le schéma métier : on le réétiquette en `I`.
  const payload = event.data as I;
  try {
    if (editing.value) {
      await props.repo.update(editing.value.id, payload);
      toast.add({ title: `${props.entityLabel} mis à jour`, color: "success" });
    } else {
      await props.repo.create(payload);
      toast.add({ title: `${props.entityLabel} créé`, color: "success" });
    }
    open.value = false;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}

async function onDelete(row: T) {
  if (!confirm(`Supprimer définitivement « ${props.entityLabel} » #${row.id} ?`)) return;
  try {
    await props.repo.remove(row.id);
    toast.add({ title: `${props.entityLabel} supprimé`, color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

// — Liaisons typées (pas de `as any` en template) ——————————————
const asString = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const asNumber = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);
const asBool = (v: unknown): boolean => v === true;
// Les selects (clés étrangères) gardent leur valeur brute (souvent un `number`).
const asSelectValue = (v: unknown): string | number | undefined =>
  typeof v === "number" || typeof v === "string" ? v : undefined;
const search = computed<string | undefined>({
  get: () => asString(filters.nom),
  set: (v) => {
    filters.nom = v || undefined;
  },
});
</script>

<template>
  <BasePanel :title="title" :subtitle="subtitle">
    <template v-if="writable" #actions>
      <UButton icon="i-lucide-plus" @click="openCreate">Nouveau</UButton>
    </template>

    <div v-if="searchable" class="mb-4 max-w-xs">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Rechercher (nom exact)…" class="w-full" />
    </div>

    <BaseDataState
      :pending="pending"
      :error="error"
      :empty="!items.length"
      :empty-label="`Aucun ${entityLabel.toLowerCase()}`"
    >
      <BaseTable :data="items" :columns="columns">
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              v-if="writable"
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="`Modifier ${entityLabel}`"
              @click="openEdit(row!.original)"
            />
            <UButton
              v-if="deletable"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :aria-label="`Supprimer ${entityLabel}`"
              @click="onDelete(row!.original)"
            />
          </div>
        </template>
      </BaseTable>
    </BaseDataState>

    <UModal
      v-model:open="open"
      :title="editing ? `Modifier ${entityLabel.toLowerCase()}` : `Nouveau ${entityLabel.toLowerCase()}`"
    >
      <template #title>
        <BaseCardTitle
          :icon="editing ? 'i-lucide-pencil' : 'i-lucide-plus'"
          :title="editing ? `Modifier ${entityLabel.toLowerCase()}` : `Nouveau ${entityLabel.toLowerCase()}`"
        />
      </template>
      <template #body>
        <UForm :schema="formSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField v-for="field in fields" :key="field.name" :label="field.label" :name="field.name" :help="field.help">
            <UTextarea
              v-if="field.type === 'textarea'"
              :model-value="asString(state[field.name])"
              :placeholder="field.placeholder"
              class="w-full"
              @update:model-value="state[field.name] = $event || undefined"
            />
            <UInputNumber
              v-else-if="field.type === 'number'"
              :model-value="asNumber(state[field.name])"
              :placeholder="field.placeholder"
              class="w-full"
              @update:model-value="state[field.name] = $event"
            />
            <UInput
              v-else-if="field.type === 'date'"
              type="date"
              :model-value="asString(state[field.name])"
              class="w-full"
              @update:model-value="state[field.name] = $event || undefined"
            />
            <USwitch
              v-else-if="field.type === 'switch'"
              :model-value="asBool(state[field.name])"
              @update:model-value="state[field.name] = $event"
            />
            <USelectMenu
v-else-if="field.type === 'select'"
              value-key="value"
              :model-value="asSelectValue(state[field.name])"
              :items="field.options"
              :placeholder="field.placeholder"
              class="w-full"
              @update:model-value="state[field.name] = $event"
            />
            <UInput
              v-else
              :model-value="asString(state[field.name])"
              :placeholder="field.placeholder"
              class="w-full"
              @update:model-value="state[field.name] = $event || undefined"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton type="submit" :loading="submitting">
              {{ editing ? "Enregistrer" : "Créer" }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </BasePanel>
</template>
