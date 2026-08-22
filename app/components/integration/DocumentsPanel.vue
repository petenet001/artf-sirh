<script setup lang="ts">
/** Onglet « Pièces » : dépôt (multipart), validation et suppression. */
const props = defineProps<{ dossierId: number }>();

const docsApi = useDocumentsDossierApi();
const typesApi = useTypesDocumentsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `docs-${props.dossierId}`,
  () => docsApi.parDossier(props.dossierId),
);
const documents = computed(() => data.value?.data ?? []);

const { options: typeOptions } = useResourceOptions("opt-types-documents", () => typesApi.list());

const typeId = ref<number | undefined>();
const obligatoire = ref(true);
const file = ref<File | null>(null);
const uploading = ref(false);

function onFile(selected: File) {
  file.value = selected;
}

async function upload() {
  if (!typeId.value || !file.value) {
    toast.add({ title: "Sélectionnez un type et un fichier", color: "warning" });
    return;
  }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append("type_document_id", String(typeId.value));
    fd.append("est_obligatoire", obligatoire.value ? "1" : "0");
    fd.append("fichier", file.value);
    await docsApi.store(props.dossierId, fd);
    toast.add({ title: "Pièce ajoutée au dossier", color: "success" });
    typeId.value = undefined;
    file.value = null;
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    uploading.value = false;
  }
}

async function valider(id: number) {
  try {
    await docsApi.valider(id);
    toast.add({ title: "Pièce validée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

async function remove(id: number) {
  if (!confirm("Supprimer cette pièce ?")) return;
  try {
    await docsApi.remove(id);
    toast.add({ title: "Pièce supprimée", color: "success" });
    await refresh();
  } catch (err) {
    handleError(err);
  }
}

const validatedCount = computed(() => documents.value.filter((d) => d.est_valide).length);
</script>

<template>
  <div class="space-y-4">
    <!-- Dépôt -->
    <UCard>
      <template #header><span class="font-medium">Déposer une pièce</span></template>
      <div class="space-y-4">
        <BaseUploadZone
          accept-attr=".pdf,.jpg,.jpeg,.png"
          accept="PDF, JPEG, PNG"
          :file-name="file?.name"
          @select="onFile"
        />
        <div class="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
          <USelect v-model="typeId" :items="typeOptions" placeholder="Type de pièce" class="w-full" />
          <USwitch v-model="obligatoire" label="Obligatoire" />
          <UButton icon="i-lucide-upload" :loading="uploading" @click="upload">Ajouter</UButton>
        </div>
      </div>
    </UCard>

    <!-- Liste -->
    <BaseDataState :pending="pending" :error="error" :empty="!documents.length" empty-label="Aucune pièce déposée">
      <div class="space-y-2">
        <p class="text-xs text-muted">{{ validatedCount }}/{{ documents.length }} pièce(s) validée(s)</p>
        <div
          v-for="doc in documents"
          :key="doc.id"
          class="flex items-center gap-3 rounded-lg border border-default bg-default p-3"
        >
          <UIcon name="i-lucide-file-text" class="size-5 shrink-0 text-muted" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ doc.type_document?.nom ?? doc.nom_original ?? `Pièce #${doc.id}` }}
            </p>
            <p class="truncate text-xs text-muted">{{ doc.nom_original }}</p>
          </div>
          <UBadge v-if="doc.est_obligatoire" color="neutral" variant="subtle" size="sm">Obligatoire</UBadge>
          <UBadge :color="doc.est_valide ? 'success' : 'warning'" variant="subtle" size="sm">
            {{ doc.est_valide ? "Validée" : "À valider" }}
          </UBadge>
          <UButton
            v-if="!doc.est_valide"
            icon="i-lucide-check"
            color="success"
            variant="ghost"
            size="xs"
            aria-label="Valider"
            @click="valider(doc.id)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            aria-label="Supprimer"
            @click="remove(doc.id)"
          />
        </div>
      </div>
    </BaseDataState>
  </div>
</template>
