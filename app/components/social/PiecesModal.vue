<script setup lang="ts">
import type { AyantDroit } from "~/schemas/ayant-droit";
import { TYPES_PIECE_AYANT_DROIT } from "~/constants/enums";
import { TYPE_PIECE_AYANT_DROIT_LABEL, type TypePieceAyantDroit } from "~/constants/social";

/**
 * Pièces justificatives d'un ayant droit : acte de naissance, certificat de
 * scolarité… Le **type de pièce** est obligatoire à l'envoi, c'est lui qui
 * justifie le régime d'âge retenu (scolarité, apprentissage, infirmité).
 */
const props = defineProps<{ open: boolean; ayantDroit: AyantDroit | null }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const api = useAyantsDroitApi();
const auth = useAuthStore();
const toast = useToast();
const handleError = useApiError();

const open = computed({ get: () => props.open, set: (v) => emit("update:open", v) });
const peutGerer = computed(() => auth.can("gerer-affaires-sociales"));
const id = computed(() => props.ayantDroit?.id ?? 0);

const { data, pending, refresh } = useAsyncData(
  () => `ayant-droit-pieces-${id.value}`,
  () => (id.value > 0 ? api.pieces(id.value) : Promise.resolve(null)),
  { watch: [id] },
);
const pieces = computed(() => data.value?.data ?? []);

const typePiece = ref<TypePieceAyantDroit>("acte_naissance");
const typeOptions = TYPES_PIECE_AYANT_DROIT.map((t) => ({
  label: TYPE_PIECE_AYANT_DROIT_LABEL[t],
  value: t,
}));
const busy = ref(false);

async function deposer(fichier: File) {
  busy.value = true;
  try {
    await api.ajouterPiece(id.value, fichier, typePiece.value);
    toast.add({ title: "Pièce ajoutée", color: "success" });
    await refresh();
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
  if (!confirm("Retirer cette pièce ?")) return;
  busy.value = true;
  try {
    await api.supprimerPiece(id.value, pieceId);
    await refresh();
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #title>
      <BaseCardTitle
        icon="i-lucide-paperclip"
        :title="`Pièces — ${ayantDroit?.nom_complet ?? ayantDroit?.nom ?? ''}`"
      />
    </template>
    <template #body>
      <div class="space-y-4">
        <div v-if="peutGerer" class="space-y-3">
          <UFormField label="Type de pièce" name="type_piece" required>
            <USelect v-model="typePiece" :items="typeOptions" value-key="value" class="w-full" />
          </UFormField>
          <BaseUploadZone
            accept="PDF, JPEG, PNG, DOC, DOCX — 10 Mo max."
            accept-attr=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            :disabled="busy"
            auto-reset
            @select="deposer"
          />
        </div>

        <div v-if="pending" class="text-sm text-muted">Chargement…</div>
        <p v-else-if="!pieces.length" class="text-sm text-muted">Aucune pièce au dossier.</p>
        <ul v-else class="space-y-3">
          <li
            v-for="piece in pieces"
            :key="piece.id"
            class="flex items-center justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0"
          >
            <div class="min-w-0">
              <p class="truncate text-sm text-highlighted">{{ piece.nom_original }}</p>
              <p class="text-xs text-muted">
                {{
                  piece.type_piece_label ??
                  (piece.type_piece ? TYPE_PIECE_AYANT_DROIT_LABEL[piece.type_piece as TypePieceAyantDroit] : "—")
                }}
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
                v-if="peutGerer"
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
  </UModal>
</template>
