<script setup lang="ts">
import type { ApiResponse, ApiCollection } from "~/types/api";
import type { PieceDossierSocial } from "~/schemas/dossier-social";
import { dossierModifiable, type StatutDossierSocial } from "~/constants/dossiers-sociaux";

/**
 * Pièces justificatives d'un dossier social.
 *
 * Deux différences avec les pièces disciplinaires, et elles comptent :
 * - le **type** de pièce est obligatoire au dépôt (acte de décès, facture…),
 *   parce que l'instruction vérifie que les bonnes pièces sont là ;
 * - le dépôt et le retrait ne sont ouverts **qu'en brouillon**. Une fois le
 *   dossier soumis, les pièces sont la base de la décision : les modifier
 *   ensuite reviendrait à réécrire ce qui a été examiné.
 *
 * Comme le circuit, ce composant ne demande au repository que les quatre
 * méthodes qu'il utilise.
 */

export interface PiecesDossierApi {
  pieces: (id: number) => Promise<ApiCollection<PieceDossierSocial>>;
  ajouterPiece: (id: number, fichier: File, typePiece: string) => Promise<ApiResponse<PieceDossierSocial>>;
  telechargerPiece: (id: number, pieceId: number) => Promise<Blob>;
  supprimerPiece: (id: number, pieceId: number) => Promise<{ message: string }>;
}

const props = defineProps<{
  dossier: { id: number; statut?: StatutDossierSocial | null };
  api: PiecesDossierApi;
  /** Types de pièce proposés — ils diffèrent entre prestation et santé. */
  types: { label: string; value: string }[];
  /** Clé de cache : deux entités ne doivent pas partager la même. */
  cle: string;
}>();

const emit = defineEmits<{ changed: [] }>();

const acteur = useActeurDossierSocial();
const toast = useToast();
const handleError = useApiError();

const id = computed(() => props.dossier.id);

const { data, pending, refresh } = useAsyncData(
  () => `${props.cle}-pieces-${id.value}`,
  () => props.api.pieces(id.value),
  { watch: [id] },
);
const pieces = computed(() => data.value?.data ?? []);

const editable = computed(() => acteur.value.peutGerer && dossierModifiable(props.dossier.statut));

const busy = ref(false);
const typeChoisi = ref<string>(props.types[0]?.value ?? "autre");

async function deposer(fichier: File) {
  busy.value = true;
  try {
    await props.api.ajouterPiece(id.value, fichier, typeChoisi.value);
    toast.add({ title: "Pièce ajoutée au dossier", color: "success" });
    await refresh();
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

async function telecharger(piece: PieceDossierSocial) {
  busy.value = true;
  try {
    downloadBlob(
      await props.api.telechargerPiece(id.value, piece.id),
      piece.nom_original ?? `piece-${piece.id}`,
    );
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
    await props.api.supprimerPiece(id.value, pieceId);
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
  <div class="rounded-xl border border-default bg-default p-5">
    <BaseCardTitle icon="i-lucide-paperclip" title="Pièces justificatives" />

    <template v-if="editable">
      <UFormField class="mt-4" label="Nature de la pièce" name="type_piece">
        <USelectMenu v-model="typeChoisi" :items="types" value-key="value" class="w-full" />
      </UFormField>
      <BaseUploadZone
        class="mt-3"
        label="Joindre une pièce"
        accept="PDF, JPEG, PNG, DOC, DOCX — 10 Mo max."
        accept-attr=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        :disabled="busy"
        auto-reset
        @select="deposer"
      />
    </template>

    <p v-else-if="acteur.peutGerer" class="mt-3 text-xs text-muted">
      Le dossier est soumis : les pièces ne sont plus modifiables.
    </p>

    <div v-if="pending" class="mt-4 text-sm text-muted">Chargement…</div>
    <ul v-else-if="pieces.length" class="mt-4 space-y-3">
      <li
        v-for="piece in pieces"
        :key="piece.id"
        class="flex items-center justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm text-highlighted">{{ piece.nom_original ?? "Pièce" }}</p>
          <p class="text-xs text-muted">
            <span v-if="piece.type_piece_label">{{ piece.type_piece_label }} · </span>
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
            @click="telecharger(piece)"
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
    <p v-else class="mt-4 text-sm text-muted">Aucune pièce jointe pour l'instant.</p>
  </div>
</template>
