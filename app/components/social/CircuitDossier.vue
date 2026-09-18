<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { AccorderInput } from "~/schemas/dossier-social";
import {
  actionsDossierSocial,
  STATUT_DOSSIER_SOCIAL_LABEL,
  STATUT_DOSSIER_SOCIAL_COLOR,
  type ActionDossierSocial,
  type StatutDossierSocial,
  type EtapeDossierSocial,
} from "~/constants/dossiers-sociaux";

/**
 * Barre de circuit des dossiers sociaux : statut courant et transitions
 * ouvertes, avec la saisie que chaque transition exige.
 *
 * Le composant est **générique** parce que prestations, prises en charge et
 * arrêts partagent rigoureusement le même circuit. Plutôt que d'accepter un
 * repository complet — ce qui l'attacherait à une entité — il ne demande que
 * les cinq transitions dont il a besoin : n'importe quel repository issu de
 * `dossierSocialApi` les satisfait.
 *
 * Il ne décide de rien : `actionsDossierSocial` croise `prochaine_etape`
 * (autorité du serveur) et les permissions du connecté.
 */

/** Ce que le circuit attend d'un repository — rien de plus. */
export interface TransitionsDossier {
  soumettre: (id: number) => Promise<ApiResponse<unknown>>;
  instruire: (id: number, notes: string) => Promise<ApiResponse<unknown>>;
  accorder: (id: number, payload?: AccorderInput) => Promise<ApiResponse<unknown>>;
  refuser: (id: number, commentaire: string) => Promise<ApiResponse<unknown>>;
  classer: (id: number, commentaire?: string | null) => Promise<ApiResponse<unknown>>;
}

const props = defineProps<{
  dossier: {
    id: number;
    statut?: StatutDossierSocial | null;
    statut_label?: string | null;
    prochaine_etape?: EtapeDossierSocial | null;
  };
  api: TransitionsDossier;
  /** Affiché sous les boutons quand aucune action n'est ouverte. */
  noteFin?: string;
}>();

const emit = defineEmits<{ changed: [] }>();

const acteur = useActeurDossierSocial();
const toast = useToast();
const handleError = useApiError();

const actions = computed(() => actionsDossierSocial(props.dossier, acteur.value));

const busy = ref(false);
const ouverte = ref<ActionDossierSocial["cle"] | null>(null);

// État du formulaire (sans `null` : les champs de saisie veulent du texte).
const notes = ref("");
const commentaire = ref("");
const dateDecision = ref<string | undefined>(undefined);
const paieAnnee = ref<number | undefined>(undefined);
const paieMois = ref<number | undefined>(undefined);

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
].map((label, i) => ({ label, value: i + 1 }));

function ouvrir(action: ActionDossierSocial) {
  notes.value = "";
  commentaire.value = "";
  dateDecision.value = undefined;
  // Mois de paie par défaut : le mois courant, comme le serveur.
  const maintenant = new Date();
  paieAnnee.value = maintenant.getFullYear();
  paieMois.value = maintenant.getMonth() + 1;

  // « Soumettre » ne demande rien : on ne fait pas cliquer deux fois pour rien.
  if (action.cle === "soumettre") {
    void executer("soumettre");
    return;
  }
  ouverte.value = action.cle;
}

async function executer(cle: ActionDossierSocial["cle"]) {
  busy.value = true;
  try {
    const id = props.dossier.id;
    switch (cle) {
      case "soumettre":
        await props.api.soumettre(id);
        toast.add({ title: "Dossier soumis à l'instruction", color: "success" });
        break;
      case "instruire":
        await props.api.instruire(id, notes.value.trim());
        toast.add({ title: "Instruction enregistrée", color: "success" });
        break;
      case "accorder":
        await props.api.accorder(id, {
          date_decision: dateDecision.value ?? null,
          commentaire: commentaire.value.trim() || null,
          paie_annee: paieAnnee.value ?? null,
          paie_mois: paieMois.value ?? null,
        });
        toast.add({ title: "Dossier accordé et posé en paie", color: "success" });
        break;
      case "refuser":
        await props.api.refuser(id, commentaire.value.trim());
        toast.add({ title: "Dossier refusé", color: "success" });
        break;
      case "classer":
        await props.api.classer(id, commentaire.value.trim() || null);
        toast.add({ title: "Dossier classé sans suite", color: "success" });
        break;
    }
    ouverte.value = null;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    busy.value = false;
  }
}

/** Le bouton de validation de la modale est-il actif ? */
const saisieValide = computed(() => {
  if (ouverte.value === "instruire") return notes.value.trim().length >= 3;
  if (ouverte.value === "refuser") return commentaire.value.trim().length >= 3;
  return true;
});

const titreModale = computed(() =>
  ({
    instruire: "Instruire le dossier",
    accorder: "Accorder la prestation",
    refuser: "Refuser la demande",
    classer: "Classer sans suite",
    soumettre: "",
  })[ouverte.value ?? "soumettre"],
);
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <BaseCardTitle icon="i-lucide-git-merge" title="Circuit" />
        <UBadge
          v-if="dossier.statut"
          :color="STATUT_DOSSIER_SOCIAL_COLOR[dossier.statut]"
          variant="subtle"
        >
          {{ dossier.statut_label ?? STATUT_DOSSIER_SOCIAL_LABEL[dossier.statut] }}
        </UBadge>
      </div>

      <div v-if="actions.length" class="flex flex-wrap gap-2">
        <UButton
          v-for="action in actions"
          :key="action.cle"
          :icon="action.icone"
          :color="action.couleur"
          :variant="action.cle === 'classer' ? 'ghost' : 'solid'"
          :loading="busy"
          :title="action.aide"
          @click="ouvrir(action)"
        >
          {{ action.libelle }}
        </UButton>
      </div>
    </div>

    <p v-if="!actions.length" class="mt-3 text-sm text-muted">
      {{ noteFin ?? "Aucune action ne vous est ouverte sur ce dossier." }}
    </p>

    <UModal :open="ouverte !== null" :title="titreModale" @update:open="ouverte = null">
      <template #body>
        <div class="space-y-4">
          <UFormField
            v-if="ouverte === 'instruire'"
            label="Notes d'instruction"
            name="notes_instruction"
            required
            help="Ce que l'examen du dossier a établi. Trois caractères au minimum."
          >
            <UTextarea v-model="notes" :rows="4" class="w-full" autofocus />
          </UFormField>

          <template v-if="ouverte === 'accorder'">
            <UFormField
              label="Date de la décision"
              name="date_decision"
              help="Laissée vide, la date du jour s'applique."
            >
              <UInput v-model="dateDecision" type="date" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Année de paie" name="paie_annee">
                <UInput v-model.number="paieAnnee" type="number" class="w-full" />
              </UFormField>
              <UFormField label="Mois de paie" name="paie_mois">
                <USelectMenu v-model="paieMois" :items="MOIS" value-key="value" class="w-full" />
              </UFormField>
            </div>
            <p class="text-xs text-muted">
              Le montant accordé est posé en paie sur ce mois, sous forme d'affectation
              ponctuelle. Il n'entre pas dans le salaire de base.
            </p>
          </template>

          <UFormField
            v-if="ouverte === 'refuser'"
            label="Motif du refus"
            name="commentaire"
            required
            help="Il figurera sur le PDF de décision remis au demandeur."
          >
            <UTextarea v-model="commentaire" :rows="4" class="w-full" autofocus />
          </UFormField>

          <UFormField
            v-if="ouverte === 'classer'"
            label="Commentaire"
            name="commentaire"
            help="Facultatif — pourquoi le dossier s'arrête là."
          >
            <UTextarea v-model="commentaire" :rows="3" class="w-full" autofocus />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="ouverte = null">Annuler</UButton>
            <UButton
              :loading="busy"
              :disabled="!saisieValide"
              :color="ouverte === 'refuser' ? 'error' : 'primary'"
              @click="ouverte && executer(ouverte)"
            >
              Confirmer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
