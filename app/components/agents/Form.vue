<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ZodType } from "zod";
import type { StepperStep } from "~/types/stepper";
import {
  agentInputSchema,
  agentUpdateSchema,
  type Agent,
  type AgentInput,
  type AgentUpdateInput,
} from "~/schemas/agent";
import { STATUTS_AGENT } from "~/constants/enums";

/**
 * Fiche agent en **stepper** (3 sections : identité, coordonnées, carrière).
 *
 * - **Création** : uniquement dans le parcours d'intégration
 *   (`pages/integration/nouveau.vue`), qui a déjà fait choisir le
 *   `typeIntegrationId` — ce type conditionne la suite (pièces à fournir,
 *   circuit de validation). POST /integration/agents crée `{ agent, dossier }`
 *   (dossier en BROUILLON), puis le dossier est **soumis** dans la foulée : on
 *   ne « crée pas un agent », on dépose un dossier qui devra être validé.
 * - **Édition** : depuis la fiche agent (Personnel).
 *   PUT /integration/agents/{id} (accepte `statut`).
 */
const props = withDefaults(
  defineProps<{
    agent?: Agent | null;
    /** Type d'intégration choisi en amont — **requis** en création. */
    typeIntegrationId?: number;
  }>(),
  { agent: null, typeIntegrationId: undefined },
);

const isEdit = computed(() => !!props.agent);
const agentsApi = useAgentsApi();
const dossiersApi = useDossiersApi();
const toast = useToast();
const handleError = useApiError();
const router = useRouter();

// Options des référentiels (selects de clés étrangères).
const { options: gradeOptions } = useResourceOptions("opt-grades", () => useGradesApi().list());
const { options: categorieOptions } = useResourceOptions("opt-categories", () => useCategoriesApi().list());
const { options: echelonOptions } = useResourceOptions("opt-echelons", () => useEchelonsApi().list());
const { options: fonctionOptions } = useResourceOptions("opt-fonctions", () => useFonctionsApi().list());
const { options: diplomeOptions } = useResourceOptions("opt-diplomes", () => useDiplomesApi().list());

const genreItems: { label: string; value: string }[] = [
  { label: "Masculin", value: "M" },
  { label: "Féminin", value: "F" },
];
const statutItems: { label: string; value: string }[] = STATUTS_AGENT.map((s) => ({ label: s, value: s }));

const state = reactive<Record<string, unknown>>({});
function init() {
  const a = props.agent;
  Object.assign(state, {
    nom: a?.nom ?? undefined,
    prenom: a?.prenom ?? undefined,
    date_naissance: a?.date_naissance ?? undefined,
    lieu_naissance: a?.lieu_naissance ?? undefined,
    nationalite: a?.nationalite ?? undefined,
    genre: a?.genre ?? undefined,
    telephone: a?.telephone ?? undefined,
    email_personnel: a?.email_personnel ?? undefined,
    numero_cnss: a?.numero_cnss ?? undefined,
    rib_bancaire: a?.rib_bancaire ?? undefined,
    grade_id: a?.grade_id ?? undefined,
    categorie_id: a?.categorie_id ?? undefined,
    echelon_id: a?.echelon_id ?? undefined,
    fonction_id: a?.fonction_id ?? undefined,
    ...(isEdit.value
      ? { statut: a?.statut ?? "actif" }
      // Le type d'intégration n'est pas saisi ici : il vient de l'étape
      // précédente du parcours, on le recopie simplement dans le payload.
      : { type_integration_id: props.typeIntegrationId, diplome_id: undefined }),
  });
}
init();

// Le type peut être rechangé tant que la fiche n'est pas soumise.
watch(
  () => props.typeIntegrationId,
  (id: number | undefined) => {
    if (!isEdit.value) state.type_integration_id = id;
  },
);

const formSchema = computed(
  () => (isEdit.value ? agentUpdateSchema : agentInputSchema) as unknown as ZodType<Record<string, unknown>>,
);

// Étapes du stepper (les `fields` sont validés avant de passer à la suivante).
// `description` + `icon` alimentent l'illustration de droite ; y ajouter
// `illustration: "/illustrations/<nom>.svg"` remplace le visuel par un dessin.
const steps = computed<StepperStep[]>(() => [
  {
    key: "identite",
    title: "Identité",
    description: "Qui est la personne : état civil et naissance.",
    icon: "i-lucide-user",
    fields: ["nom", "prenom", "date_naissance", "genre", "lieu_naissance", "nationalite"],
  },
  {
    key: "coordonnees",
    title: "Coordonnées",
    description: "Comment la joindre, et ses références administratives.",
    icon: "i-lucide-contact",
    fields: ["telephone", "email_personnel", "numero_cnss", "rib_bancaire"],
  },
  {
    key: "carriere",
    title: "Carrière",
    description: "Sa place dans la grille : grade, catégorie, échelon, fonction.",
    icon: "i-lucide-briefcase",
    fields: isEdit.value
      ? ["grade_id", "categorie_id", "echelon_id", "fonction_id", "statut"]
      : ["grade_id", "categorie_id", "echelon_id", "fonction_id", "type_integration_id", "diplome_id"],
  },
]);

const submitting = ref(false);
const asString = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const asNumber = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);

async function onSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  submitting.value = true;
  try {
    if (props.agent) {
      await agentsApi.update(props.agent.id, event.data as AgentUpdateInput);
      toast.add({ title: "Agent mis à jour", color: "success" });
      await navigateTo(`/personnel/agents/${props.agent.id}`);
      return;
    }

    // Création = dépôt d'un dossier d'intégration. L'API crée la fiche et le
    // dossier (BROUILLON) ; on enchaîne la transition « soumettre » pour que le
    // dossier parte en validation, conformément au libellé du bouton.
    const { data } = await agentsApi.create(event.data as AgentInput);
    const reference = data.dossier.reference;
    try {
      await dossiersApi.soumettre(data.dossier.id);
      toast.add({
        title: "Dossier soumis",
        description: reference ? `${reference} — en attente de validation` : undefined,
        color: "success",
        icon: "i-lucide-send",
      });
    } catch (err) {
      // La fiche existe : on ne perd rien, le dossier reste soumettable depuis
      // son espace. On le dit explicitement plutôt que d'échouer en silence.
      handleError(err);
      toast.add({
        title: "Dossier créé mais non soumis",
        description: "Vous pouvez le soumettre depuis son espace de suivi.",
        color: "warning",
      });
    }
    await navigateTo(`/integration/dossiers/${data.dossier.id}`);
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}

function onCancel() {
  router.back();
}
</script>

<template>
  <BaseStepperForm
    :steps="steps"
    :schema="formSchema"
    :state="state"
    :submitting="submitting"
    :submit-label="isEdit ? 'Enregistrer' : 'Soumettre le dossier'"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <!-- Étape 1 : Identité -->
    <template #identite>
      <!-- Emplacement photo de la maquette. Inactif : ni `agentInputSchema` ni
           `agentUpdateSchema` n'acceptent de photo (aucun endpoint d'envoi côté
           API) — on n'affiche pas un contrôle qui ferait croire à un envoi. -->
      <BasePhotoField
        class="mb-6"
        disabled
        :src="agent?.photo_path"
        alt="Photo de l'agent"
        hint="Photo de l'agent — emplacement prévu. L'API ne gère pas encore l'envoi de photo : le champ sera activé dès que l'endpoint existera."
      />

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nom" name="nom" required>
          <UInput :model-value="asString(state.nom)" class="w-full" @update:model-value="state.nom = $event || undefined" />
        </UFormField>
        <UFormField label="Prénom" name="prenom" required>
          <UInput :model-value="asString(state.prenom)" class="w-full" @update:model-value="state.prenom = $event || undefined" />
        </UFormField>
        <UFormField label="Date de naissance" name="date_naissance" required>
          <UInput type="date" :model-value="asString(state.date_naissance)" class="w-full" @update:model-value="state.date_naissance = $event || undefined" />
        </UFormField>
        <UFormField label="Genre" name="genre" required>
          <USelect :model-value="asString(state.genre)" :items="genreItems" placeholder="Choisir" class="w-full" @update:model-value="state.genre = $event" />
        </UFormField>
        <UFormField label="Lieu de naissance" name="lieu_naissance">
          <UInput :model-value="asString(state.lieu_naissance)" class="w-full" @update:model-value="state.lieu_naissance = $event || undefined" />
        </UFormField>
        <UFormField label="Nationalité" name="nationalite">
          <UInput :model-value="asString(state.nationalite)" class="w-full" @update:model-value="state.nationalite = $event || undefined" />
        </UFormField>
      </div>
    </template>

    <!-- Étape 2 : Coordonnées & administratif -->
    <template #coordonnees>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Téléphone" name="telephone">
          <UInput :model-value="asString(state.telephone)" class="w-full" @update:model-value="state.telephone = $event || undefined" />
        </UFormField>
        <UFormField label="Email personnel" name="email_personnel">
          <UInput type="email" :model-value="asString(state.email_personnel)" class="w-full" @update:model-value="state.email_personnel = $event || undefined" />
        </UFormField>
        <UFormField label="Numéro CNSS" name="numero_cnss">
          <UInput :model-value="asString(state.numero_cnss)" class="w-full" @update:model-value="state.numero_cnss = $event || undefined" />
        </UFormField>
        <UFormField label="RIB bancaire" name="rib_bancaire">
          <UInput :model-value="asString(state.rib_bancaire)" class="w-full" @update:model-value="state.rib_bancaire = $event || undefined" />
        </UFormField>
      </div>
    </template>

    <!-- Étape 3 : Carrière -->
    <template #carriere>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Grade" name="grade_id">
          <USelect :model-value="asNumber(state.grade_id)" :items="gradeOptions" placeholder="Choisir" class="w-full" @update:model-value="state.grade_id = $event" />
        </UFormField>
        <UFormField label="Catégorie" name="categorie_id">
          <USelect :model-value="asNumber(state.categorie_id)" :items="categorieOptions" placeholder="Choisir" class="w-full" @update:model-value="state.categorie_id = $event" />
        </UFormField>
        <UFormField label="Échelon" name="echelon_id">
          <USelect :model-value="asNumber(state.echelon_id)" :items="echelonOptions" placeholder="Choisir" class="w-full" @update:model-value="state.echelon_id = $event" />
        </UFormField>
        <UFormField label="Fonction" name="fonction_id">
          <USelect :model-value="asNumber(state.fonction_id)" :items="fonctionOptions" placeholder="Choisir" class="w-full" @update:model-value="state.fonction_id = $event" />
        </UFormField>

        <UFormField v-if="!isEdit" label="Diplôme" name="diplome_id">
          <USelect :model-value="asNumber(state.diplome_id)" :items="diplomeOptions" placeholder="Choisir" class="w-full" @update:model-value="state.diplome_id = $event" />
        </UFormField>

        <UFormField v-if="isEdit" label="Statut" name="statut" required>
          <USelect :model-value="asString(state.statut)" :items="statutItems" class="w-full" @update:model-value="state.statut = $event" />
        </UFormField>
      </div>
    </template>
  </BaseStepperForm>
</template>
