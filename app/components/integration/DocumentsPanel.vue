<script setup lang="ts">
import type { DocumentDossier } from "~/schemas/document-dossier";

/**
 * Onglet « Pièces » d'un dossier d'intégration. S'appuie sur l'état documentaire
 * calculé par le backend (`GET …/documents` → `{ deposes, manquants, resume }`) :
 *  - une liste **unifiée** des pièces (manquante / à valider / validée) avec les
 *    actions valider / supprimer en ligne ;
 *  - un dépôt **multi-pièces** guidé par les pièces manquantes ;
 *  - un compteur d'obligatoires validées (condition de « dossier complet »).
 * L'API dépose une pièce par appel → l'upload multiple boucle côté client.
 */
const props = defineProps<{ dossierId: number; typeIntegrationId?: number | null }>();

const docsApi = useDocumentsDossierApi();
const typesApi = useTypesDocumentsApi();
const toast = useToast();
const handleError = useApiError();

const { data, pending, error, refresh } = useAsyncData(
  () => `docs-${props.dossierId}`,
  () => docsApi.parDossier(props.dossierId),
);
const etat = computed(() => data.value?.data ?? null);
const deposes = computed(() => etat.value?.deposes ?? []);
const manquants = computed(() => etat.value?.manquants ?? []);
const resume = computed(() => etat.value?.resume ?? null);

/** Le type d'intégration impose-t-il des pièces (sinon tout type est accepté) ? */
const restreint = computed(
  () => !!resume.value && resume.value.obligatoires_attendus + resume.value.optionnels_attendus > 0,
);

// Tous les types (repli quand le type d'intégration n'attend aucune pièce).
const { options: allTypeOptions } = useResourceOptions("opt-types-documents", () => typesApi.list());
const depotTypeIds = computed(
  () =>
    new Set(
      deposes.value
        .map((d) => d.type_document?.id ?? d.type_document_id)
        .filter((v): v is number => v != null),
    ),
);

// — Liste unifiée des pièces ————————————————————————————————————
type EtatPiece = "manquante" | "a_valider" | "validee";
interface LignePiece {
  key: string;
  nom: string;
  fichier: string | null;
  obligatoire: boolean;
  etat: EtatPiece;
  doc: DocumentDossier | null;
  typeId: number;
}
const etatMeta: Record<EtatPiece, { label: string; color: "neutral" | "warning" | "success"; icon: string }> = {
  manquante: { label: "Manquante", color: "neutral", icon: "i-lucide-circle-dashed" },
  a_valider: { label: "À valider", color: "warning", icon: "i-lucide-clock" },
  validee: { label: "Validée", color: "success", icon: "i-lucide-circle-check" },
};
const ordreEtat: Record<EtatPiece, number> = { manquante: 0, a_valider: 1, validee: 2 };

const lignes = computed<LignePiece[]>(() => {
  const mq: LignePiece[] = manquants.value.map((m) => ({
    key: `m-${m.type_document.id}`,
    nom: m.type_document.nom,
    fichier: null,
    obligatoire: m.est_obligatoire,
    etat: "manquante",
    doc: null,
    typeId: m.type_document.id,
  }));
  const dp: LignePiece[] = deposes.value.map((d) => ({
    key: `d-${d.id}`,
    nom: d.type_document?.nom ?? d.nom_original ?? `Pièce #${d.id}`,
    fichier: d.nom_original ?? null,
    obligatoire: !!d.est_obligatoire,
    etat: d.est_valide ? "validee" : "a_valider",
    doc: d,
    typeId: d.type_document?.id ?? d.type_document_id ?? -1,
  }));
  return [...mq, ...dp].sort(
    (a, b) => Number(b.obligatoire) - Number(a.obligatoire) || ordreEtat[a.etat] - ordreEtat[b.etat],
  );
});

const obligValidees = computed(() => deposes.value.filter((d) => d.est_obligatoire && d.est_valide).length);
const obligAttendus = computed(() => resume.value?.obligatoires_attendus ?? 0);

// — Uploader multi-lignes ——————————————————————————————————————
interface UploadRow {
  key: number;
  typeId?: number;
  obligatoire: boolean;
  file: File | null;
}
const rows = ref<UploadRow[]>([]);
const rowSeq = ref(0);

/**
 * Options du select : les pièces manquantes quand le type impose une liste
 * (le backend refuse tout autre type), sinon tous les types non déjà déposés.
 */
const uploadTypeOptions = computed(() => {
  if (restreint.value) {
    return manquants.value.map((m) => ({ label: m.type_document.nom, value: m.type_document.id }));
  }
  return allTypeOptions.value.filter(
    (o) => typeof o.value === "number" && !depotTypeIds.value.has(o.value),
  );
});

function addRow(typeId?: number, obligatoire = false) {
  rows.value.push({ key: rowSeq.value++, typeId, obligatoire, file: null });
}
function removeRow(key: number) {
  rows.value = rows.value.filter((r) => r.key !== key);
}
function onRowFile(row: UploadRow, event: Event) {
  row.file = (event.target as HTMLInputElement).files?.[0] ?? null;
}
/** Depuis une pièce manquante : prépare une ligne d'upload pré-remplie. */
function preparerDepot(ligne: LignePiece) {
  if (!rows.value.some((r) => r.typeId === ligne.typeId && !r.file)) {
    addRow(ligne.typeId, ligne.obligatoire);
  }
}

const uploading = ref(false);
async function uploadAll() {
  const prets = rows.value.filter((r) => r.typeId && r.file);
  if (!prets.length) {
    toast.add({ title: "Ajoutez au moins une pièce (type + fichier).", color: "warning" });
    return;
  }
  uploading.value = true;
  let ok = 0;
  for (const r of prets) {
    try {
      const fd = new FormData();
      fd.append("type_document_id", String(r.typeId));
      fd.append("est_obligatoire", r.obligatoire ? "1" : "0");
      fd.append("fichier", r.file as File);
      await docsApi.store(props.dossierId, fd);
      ok++;
      removeRow(r.key);
    } catch (err) {
      handleError(err);
    }
  }
  uploading.value = false;
  if (ok) toast.add({ title: `${ok} pièce(s) ajoutée(s) au dossier`, color: "success" });
  await refresh();
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
</script>

<template>
  <BaseDataState :pending="pending" :error="error" :empty="false">
    <div class="space-y-4">
      <!-- 1. Pièces du dossier (attendues + déposées) -->
      <UCard v-if="lignes.length">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="font-medium">Pièces du dossier</span>
            <UBadge
              v-if="obligAttendus"
              :color="obligValidees === obligAttendus ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ obligValidees }}/{{ obligAttendus }} obligatoire(s) validée(s)
            </UBadge>
          </div>
        </template>

        <div class="space-y-2">
          <div
            v-for="l in lignes"
            :key="l.key"
            class="flex items-center gap-3 rounded-lg border border-default bg-default p-3"
          >
            <UIcon
              :name="etatMeta[l.etat].icon"
              class="size-5 shrink-0"
              :class="{
                'text-muted': l.etat === 'manquante',
                'text-warning': l.etat === 'a_valider',
                'text-success': l.etat === 'validee',
              }"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">{{ l.nom }}</p>
              <p v-if="l.fichier" class="truncate text-xs text-muted">{{ l.fichier }}</p>
            </div>
            <UBadge v-if="l.obligatoire" color="neutral" variant="subtle" size="sm">Obligatoire</UBadge>
            <UBadge :color="etatMeta[l.etat].color" variant="subtle" size="sm">
              {{ etatMeta[l.etat].label }}
            </UBadge>
            <UButton
              v-if="l.etat === 'manquante'"
              icon="i-lucide-upload"
              variant="soft"
              size="xs"
              @click="preparerDepot(l)"
            >
              Déposer
            </UButton>
            <UButton
              v-if="l.doc && l.etat === 'a_valider'"
              icon="i-lucide-check"
              color="success"
              variant="ghost"
              size="xs"
              aria-label="Valider"
              @click="valider(l.doc.id)"
            />
            <UButton
              v-if="l.doc"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              aria-label="Supprimer"
              @click="remove(l.doc.id)"
            />
          </div>
        </div>
      </UCard>

      <!-- 2. Dépôt multi-pièces -->
      <UCard>
        <template #header><span class="font-medium">Déposer des pièces</span></template>

        <div class="space-y-3">
          <p v-if="restreint" class="text-xs text-muted">
            Ce type d'intégration n'accepte que les pièces attendues ci-dessus ; les autres types ne
            sont pas proposés.
          </p>

          <p v-if="restreint && !uploadTypeOptions.length && !rows.length" class="text-sm text-muted">
            Toutes les pièces attendues ont été déposées. Validez-les ci-dessus (ou supprimez-en une
            pour la remplacer).
          </p>
          <p v-else-if="!rows.length" class="text-sm text-muted">
            Aucune pièce en préparation. Cliquez sur « Ajouter un fichier » (ou « Déposer » sur une
            pièce attendue).
          </p>

          <div
            v-for="row in rows"
            :key="row.key"
            class="grid items-center gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <USelectMenu
v-model="row.typeId"
              value-key="value"
              :items="uploadTypeOptions"
              placeholder="Type de pièce"
              class="w-full"
            />
            <label
              class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-default bg-default px-3 py-2 text-sm hover:border-primary/60"
            >
              <UIcon name="i-lucide-paperclip" class="size-4 text-muted" />
              <span class="max-w-[12rem] truncate" :class="row.file ? 'text-highlighted' : 'text-muted'">
                {{ row.file?.name ?? "Choisir un fichier" }}
              </span>
              <input
                type="file"
                class="sr-only"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="onRowFile(row, $event)"
              >
            </label>
            <USwitch v-model="row.obligatoire" label="Oblig." />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Retirer la ligne"
              @click="removeRow(row.key)"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              icon="i-lucide-plus"
              variant="soft"
              :disabled="!uploadTypeOptions.length"
              @click="addRow()"
            >
              Ajouter un fichier
            </UButton>
            <UButton
              icon="i-lucide-upload"
              :loading="uploading"
              :disabled="!rows.length"
              @click="uploadAll"
            >
              Téléverser
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </BaseDataState>
</template>
