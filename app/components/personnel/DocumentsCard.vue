<script setup lang="ts">
import { documentAgentInputSchema } from "~/schemas/document-agent";
import type { DocumentAgent } from "~/schemas/document-agent";
import { formatTaille } from "~/constants/personnel";

/**
 * Bloc « Documents » (GED légère) : liste, dépôt (multipart), téléchargement
 * (blob) et suppression (soft). Le type de document vient du référentiel.
 */
const props = defineProps<{
  agentId: number;
  documents?: DocumentAgent[];
  canEdit?: boolean;
}>();
const emit = defineEmits<{ changed: [] }>();

const api = usePersonnelAgentsApi();
const typesApi = useTypesDocumentsApi();
const toast = useToast();
const handleError = useApiError();

const { options: typeOptions } = useResourceOptions("fiche-types-documents", () => typesApi.list());

const open = ref(false);
const submitting = ref(false);
const fichier = ref<File | null>(null);
const state = reactive<{ type_document_id?: number; titre?: string; sous_dossier?: string }>({});

function ouvrir() {
  state.type_document_id = undefined;
  state.titre = undefined;
  state.sous_dossier = undefined;
  fichier.value = null;
  open.value = true;
}

async function onSubmit() {
  if (!fichier.value) {
    toast.add({ title: "Sélectionnez un fichier.", color: "error" });
    return;
  }
  submitting.value = true;
  try {
    await api.creerDocument(props.agentId, documentAgentInputSchema.parse(state), fichier.value);
    toast.add({ title: "Document déposé", color: "success" });
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}

const busyId = ref<number | null>(null);
async function telecharger(doc: DocumentAgent) {
  busyId.value = doc.id;
  try {
    const blob = await api.telechargerDocument(props.agentId, doc.id);
    downloadBlob(blob, doc.nom_original ?? `document-${doc.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    busyId.value = null;
  }
}

async function supprimer(doc: DocumentAgent) {
  if (!confirm(`Supprimer le document « ${doc.titre ?? doc.nom_original ?? doc.id} » ?`)) return;
  busyId.value = doc.id;
  try {
    await api.supprimerDocument(props.agentId, doc.id);
    toast.add({ title: "Document supprimé", color: "success" });
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-5">
    <div class="flex items-center justify-between">
      <BaseCardTitle icon="i-lucide-folder" title="Documents" />
      <UButton v-if="canEdit" icon="i-lucide-upload" color="neutral" variant="ghost" size="xs" @click="ouvrir">
        Déposer
      </UButton>
    </div>

    <p v-if="!documents?.length" class="mt-4 text-sm text-muted">Aucun document.</p>
    <ul v-else class="mt-4 divide-y divide-default">
      <li v-for="doc in documents" :key="doc.id" class="flex items-center justify-between gap-3 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <UIcon name="i-lucide-file-text" class="size-5 shrink-0 text-dimmed" />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ doc.titre ?? doc.nom_original ?? `Document #${doc.id}` }}
            </p>
            <p class="text-xs text-muted">
              <span v-if="doc.type_document?.nom">{{ doc.type_document.nom }} · </span>
              <span>{{ doc.sous_dossier ?? "general" }}</span>
              <span> · {{ formatTaille(doc.taille) }}</span>
            </p>
          </div>
        </div>
        <div class="flex shrink-0 gap-1">
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="busyId === doc.id"
            aria-label="Télécharger"
            @click="telecharger(doc)"
          />
          <UButton
            v-if="canEdit"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            aria-label="Supprimer"
            @click="supprimer(doc)"
          />
        </div>
      </li>
    </ul>

    <UModal v-model:open="open" title="Déposer un document">
      <template #title>
        <BaseCardTitle icon="i-lucide-upload" title="Déposer un document" />
      </template>
      <template #body>
        <UForm :schema="documentAgentInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Type de document" name="type_document_id">
            <USelectMenu
              v-model="state.type_document_id"
              value-key="value"
              :items="typeOptions"
              placeholder="Sélectionner un type"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Titre" name="titre">
              <UInput v-model="state.titre" placeholder="Optionnel" class="w-full" />
            </UFormField>
            <UFormField label="Sous-dossier" name="sous_dossier">
              <UInput v-model="state.sous_dossier" placeholder="general" class="w-full" />
            </UFormField>
          </div>
          <BaseUploadZone
            v-model="fichier"
            label="Fichier"
            accept="PDF, JPEG, PNG (max 10 Mo)"
            accept-attr="application/pdf,image/*"
          />
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton type="submit" :loading="submitting">Déposer</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
