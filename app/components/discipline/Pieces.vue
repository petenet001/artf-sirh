<script setup lang="ts">
import type { Sanction } from "~/schemas/sanction";
import { peutJoindrePiece } from "~/constants/discipline";

/**
 * Pièces du dossier disciplinaire (CCN art. 91). Au moins une pièce est exigée
 * avant l'instruction : l'API renvoie 422 sinon, on le dit ici avant le clic.
 *
 * Dépôt multipart (`fichier`) : pdf, jpg, png, doc, docx — 10 Mo maximum.
 */
const props = defineProps<{ dossier: Sanction }>();
const emit = defineEmits<{ changed: [] }>();

const api = useSanctionsApi();
const acteur = useActeurDiscipline();
const toast = useToast();
const handleError = useApiError();

const id = computed(() => props.dossier.id);

const { data, pending, refresh } = useAsyncData(
  () => `sanction-pieces-${id.value}`,
  () => api.pieces(id.value),
  { watch: [id] },
);
const pieces = computed(() => data.value?.data ?? []);

const editable = computed(() => peutJoindrePiece(props.dossier, acteur.value));
const busy = ref(false);

async function deposer(fichier: File) {
  busy.value = true;
  try {
    await api.ajouterPiece(id.value, fichier);
    toast.add({ title: "Pièce ajoutée au dossier", color: "success" });
    await refresh();
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function telecharger(pieceId: number, nom: string) {
  busy.value = true;
  try {
    downloadBlob(await api.telechargerPiece(id.value, pieceId), nom);
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function supprimer(pieceId: number) {
  if (!confirm("Retirer cette pièce du dossier ?")) return;
  busy.value = true;
  try {
    await api.supprimerPiece(id.value, pieceId);
    await refresh();
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

/** Taille lisible — l'API renvoie des octets. */
function taille(octets?: number | null): string {
  if (octets == null) return "—";
  return octets > 1_048_576
    ? `${(octets / 1_048_576).toFixed(1)} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <BaseCardTitle icon="i-lucide-paperclip" title="Pièces du dossier (art. 91)" />
    </div>

    <BaseUploadZone
      v-if="editable"
      class="mt-4"
      label="Joindre une pièce"
      accept="PDF, JPEG, PNG, DOC, DOCX — 10 Mo max."
      accept-attr=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      :disabled="busy"
      auto-reset
      @select="deposer"
    />

    <UAlert
      v-if="!pending && !pieces.length && dossier.statut === 'en_attente'"
      class="mt-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Aucune pièce au dossier"
      description="L'instruction sera refusée tant qu'aucune pièce n'aura été jointe."
    />

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>
    <ul v-else-if="pieces.length" class="mt-4 space-y-3">
      <li
        v-for="piece in pieces"
        :key="piece.id"
        class="flex items-center justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm text-highlighted">{{ piece.nom_original }}</p>
          <p class="text-xs text-muted">
            {{ taille(piece.taille) }}
            <span v-if="piece.uploader?.name"> · déposée par {{ piece.uploader.name }}</span>
          </p>
        </div>
        <div class="flex shrink-0 gap-1">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-download"
            :loading="busy"
            @click="telecharger(piece.id, piece.nom_original)"
          />
          <UButton
            v-if="editable"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash-2"
            :loading="busy"
            @click="supprimer(piece.id)"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
