<script setup lang="ts">
import { contactUrgenceInputSchema } from "~/schemas/contact-urgence";
import type { ContactUrgence } from "~/schemas/contact-urgence";

/** Bloc « Contacts d'urgence » : liste + création / édition / suppression. */
const props = defineProps<{
  agentId: number;
  contacts?: ContactUrgence[];
  canEdit?: boolean;
}>();
const emit = defineEmits<{ changed: [] }>();

const api = usePersonnelAgentsApi();
const toast = useToast();
const handleError = useApiError();

const open = ref(false);
const submitting = ref(false);
const editing = ref<ContactUrgence | null>(null);
const state = reactive<{ nom?: string; prenom?: string; telephone?: string; relation?: string }>({});

function ouvrirCreation() {
  editing.value = null;
  state.nom = undefined;
  state.prenom = undefined;
  state.telephone = undefined;
  state.relation = undefined;
  open.value = true;
}

function ouvrirEdition(contact: ContactUrgence) {
  editing.value = contact;
  state.nom = contact.nom;
  state.prenom = contact.prenom;
  state.telephone = contact.telephone;
  state.relation = contact.relation ?? undefined;
  open.value = true;
}

async function onSubmit() {
  submitting.value = true;
  try {
    const payload = contactUrgenceInputSchema.parse(state);
    if (editing.value) {
      await api.modifierContact(props.agentId, editing.value.id, payload);
      toast.add({ title: "Contact mis à jour", color: "success" });
    } else {
      await api.creerContact(props.agentId, payload);
      toast.add({ title: "Contact ajouté", color: "success" });
    }
    open.value = false;
    emit("changed");
  } catch (err) {
    handleError(err);
  } finally {
    submitting.value = false;
  }
}

async function supprimer(contact: ContactUrgence) {
  if (!confirm(`Supprimer le contact ${contact.prenom} ${contact.nom} ?`)) return;
  try {
    await api.supprimerContact(props.agentId, contact.id);
    toast.add({ title: "Contact supprimé", color: "success" });
    emit("changed");
  } catch (err) {
    handleError(err);
  }
}
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-5">
    <div class="flex items-center justify-between">
      <BaseCardTitle icon="i-lucide-phone" title="Contacts d'urgence" />
      <UButton v-if="canEdit" icon="i-lucide-plus" color="neutral" variant="ghost" size="xs" @click="ouvrirCreation">
        Ajouter
      </UButton>
    </div>

    <p v-if="!contacts?.length" class="mt-4 text-sm text-muted">Aucun contact d'urgence.</p>
    <ul v-else class="mt-4 divide-y divide-default">
      <li v-for="c in contacts" :key="c.id" class="flex items-center justify-between gap-3 py-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">{{ c.prenom }} {{ c.nom }}</p>
          <p class="text-xs text-muted">
            {{ c.telephone }}<span v-if="c.relation"> · {{ c.relation }}</span>
          </p>
        </div>
        <div v-if="canEdit" class="flex shrink-0 gap-1">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" aria-label="Modifier" @click="ouvrirEdition(c)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" aria-label="Supprimer" @click="supprimer(c)" />
        </div>
      </li>
    </ul>

    <UModal v-model:open="open" :title="editing ? 'Modifier le contact' : 'Ajouter un contact'">
      <template #title>
        <BaseCardTitle icon="i-lucide-phone" :title="editing ? 'Modifier le contact' : 'Ajouter un contact'" />
      </template>
      <template #body>
        <UForm :schema="contactUrgenceInputSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Prénom" name="prenom">
              <UInput v-model="state.prenom" class="w-full" />
            </UFormField>
            <UFormField label="Nom" name="nom">
              <UInput v-model="state.nom" class="w-full" />
            </UFormField>
            <UFormField label="Téléphone" name="telephone">
              <UInput v-model="state.telephone" class="w-full" />
            </UFormField>
            <UFormField label="Relation" name="relation">
              <UInput v-model="state.relation" placeholder="Épouse, parent…" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
            <UButton type="submit" :loading="submitting">{{ editing ? "Enregistrer" : "Ajouter" }}</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
