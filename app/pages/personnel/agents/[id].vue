<script setup lang="ts">
import type { SideNavItem } from "~/types/sidenav";
import { structurableLabel } from "~/constants/carriere";

/**
 * Fiche agent, calée sur la maquette : carte d'en-tête (photo, identité,
 * action principale), puis colonne de navigation à gauche et sections de
 * détail à droite (libellé au-dessus de la valeur, séparateurs fins).
 */
const route = useRoute();
const id = computed(() => Number(route.params.id));
const { agent, pending, error } = useAgent(id);

// Synthèse carrière (endpoint dédié) : alimente la section « Situation
// administrative » — contrat / affectation / nomination / salaire actifs.
const { synthese, pending: synthesePending, error: syntheseError } = useCarriereSynthese(id);
const fmtMontant = (n?: number | null) =>
  n == null ? "—" : `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;

const agentsApi = useAgentsApi();
const toast = useToast();
const handleError = useApiError();

const statutColor: Record<string, "success" | "neutral" | "warning" | "error" | "primary"> = {
  actif: "success",
  stagiaire: "primary",
  inactif: "neutral",
  suspendu: "warning",
  retraite: "neutral",
};

/** Initiales (prénom + nom) servant de repli quand il n'y a pas de photo. */
const initiales = computed(() => {
  const a = agent.value;
  if (!a) return "";
  return `${a.prenom?.[0] ?? ""}${a.nom?.[0] ?? ""}`.toUpperCase();
});

/** Intitulé affiché sous le nom : fonction, sinon grade. */
const intitule = computed(() => agent.value?.fonction?.nom ?? agent.value?.grade?.nom ?? null);

/** Email de contact préféré (pro puis perso). */
const email = computed(() => agent.value?.email_professionnel ?? agent.value?.email_personnel ?? null);

/** Âge calculé à partir de la date de naissance (chaîne `Y-m-d`). */
const age = computed(() => {
  const dn = agent.value?.date_naissance;
  if (!dn) return null;
  const d = new Date(dn);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let ans = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) ans--;
  return `${ans} ans`;
});

const sections: SideNavItem[] = [
  { key: "infos", label: "Informations", icon: "i-lucide-user" },
  { key: "carriere", label: "Carrière", icon: "i-lucide-briefcase" },
  { key: "engagements", label: "Situation administrative", icon: "i-lucide-building-2" },
];
const section = ref("infos");

async function onDelete() {
  if (!agent.value) return;
  if (!confirm(`Supprimer définitivement l'agent ${agent.value.nom_complet ?? agent.value.id} ?`)) return;
  try {
    await agentsApi.remove(agent.value.id);
    toast.add({ title: "Agent supprimé", color: "success" });
    await navigateTo("/personnel/agents");
  } catch (err) {
    handleError(err);
  }
}
</script>

<template>
  <BasePanel>
    <BaseDataState :pending="pending" :error="error" :empty="!agent" empty-label="Agent introuvable">
      <div v-if="agent" class="space-y-6">
        <!-- Carte d'en-tête : identité + actions -->
        <BaseProfileHeader
          :title="agent.nom_complet ?? `${agent.prenom} ${agent.nom}`"
          :subtitle="intitule"
        >
          <template #leading>
            <UAvatar
              :src="agent.photo_path ?? undefined"
              :alt="agent.nom_complet"
              :text="initiales"
              class="size-20 rounded-xl text-xl"
              :ui="{ root: 'bg-primary/10 text-primary' }"
            />
          </template>

          <template #meta>
            <UBadge :color="statutColor[agent.statut] ?? 'neutral'" variant="subtle" class="capitalize">
              {{ agent.statut }}
            </UBadge>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-hash" class="size-4 opacity-70" />
              {{ agent.matricule ?? "Matricule non assigné" }}
            </span>
            <span v-if="email" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-mail" class="size-4 opacity-70" />
              {{ email }}
            </span>
            <span v-if="agent.telephone" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-phone" class="size-4 opacity-70" />
              {{ agent.telephone }}
            </span>
          </template>

          <template #actions>
            <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/personnel/agents">
              Retour
            </UButton>
            <UButton icon="i-lucide-pencil" :to="`/personnel/agents/${id}/modifier`">Modifier la fiche</UButton>
            <UButton color="error" variant="soft" icon="i-lucide-trash-2" @click="onDelete">Supprimer</UButton>
          </template>
        </BaseProfileHeader>

        <!-- Navigation de section (gauche) + détail (droite) -->
        <div class="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <BaseSideNav v-model="section" :items="sections" class="h-fit" />

          <div class="rounded-xl border border-default bg-default p-5 shadow-sm sm:p-6">
            <!-- Informations -->
            <dl v-if="section === 'infos'" class="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <BaseDefItem label="Âge" :value="age" />
              <BaseDefItem label="Date de naissance" :value="formatDateLong(agent.date_naissance)" />
              <BaseDefItem label="Genre" :value="agent.genre === 'F' ? 'Féminin' : 'Masculin'" />
              <BaseDefItem label="Lieu de naissance" :value="agent.lieu_naissance" />
              <BaseDefItem label="Nationalité" :value="agent.nationalite" />
              <BaseDefItem label="Prise de service" :value="formatDateLong(agent.date_prise_service)" />
              <BaseDefItem label="Email personnel" :value="agent.email_personnel" />
              <BaseDefItem label="Email professionnel" :value="agent.email_professionnel" />
              <BaseDefItem label="Badge" :value="agent.badge_numero" />
              <BaseDefItem label="Numéro CNSS" :value="agent.numero_cnss" />
              <BaseDefItem label="RIB bancaire" :value="agent.rib_bancaire" />
              <BaseDefItem label="Type d'intégration" :value="agent.type_integration?.nom" />
            </dl>

            <!-- Carrière -->
            <dl v-else-if="section === 'carriere'" class="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <BaseDefItem label="Grade" :value="agent.grade?.nom" />
              <BaseDefItem label="Catégorie" :value="agent.categorie?.nom" />
              <BaseDefItem label="Échelon" :value="agent.echelon?.nom" />
              <BaseDefItem label="Fonction" :value="agent.fonction?.nom" />
            </dl>

            <!-- Situation administrative (synthèse carrière) -->
            <div v-else>
              <BaseDataState :pending="synthesePending" :error="syntheseError" :empty="false">
                <div class="grid gap-6 sm:grid-cols-2">
                  <!-- Affectation active -->
                  <div>
                    <BaseCardTitle icon="i-lucide-building-2" title="Affectation active" />
                    <template v-if="synthese?.affectation_active">
                      <CarriereStatutBadge
                        class="mt-3"
                        :statut="synthese.affectation_active.statut"
                        :label="synthese.affectation_active.statut_label"
                      />
                      <dl class="mt-4 space-y-4">
                        <BaseDefItem label="Structure" :value="structurableLabel(synthese.affectation_active.structurable_type)" />
                        <BaseDefItem label="Date d'affectation" :value="formatDateLong(synthese.affectation_active.date_affectation)" />
                        <BaseDefItem label="Supérieur" :value="synthese.affectation_active.superieur_hierarchique?.nom_complet" flush />
                      </dl>
                    </template>
                    <p v-else class="mt-4 text-sm text-muted">Aucune affectation active.</p>
                  </div>

                  <!-- Nomination active -->
                  <div>
                    <BaseCardTitle icon="i-lucide-award" title="Nomination active" />
                    <template v-if="synthese?.nomination_active">
                      <CarriereStatutBadge
                        class="mt-3"
                        :statut="synthese.nomination_active.statut"
                        :label="synthese.nomination_active.statut_label"
                      />
                      <dl class="mt-4 space-y-4">
                        <BaseDefItem label="Poste" :value="synthese.nomination_active.poste" />
                        <BaseDefItem
                          label="Structure"
                          :value="synthese.nomination_active.structure?.nom ?? structurableLabel(synthese.nomination_active.structurable_type)"
                        />
                        <BaseDefItem label="Date de début" :value="formatDateLong(synthese.nomination_active.date_debut)" flush />
                      </dl>
                    </template>
                    <p v-else class="mt-4 text-sm text-muted">Aucune nomination active.</p>
                  </div>

                  <!-- Contrat actif -->
                  <div>
                    <BaseCardTitle icon="i-lucide-file-text" title="Contrat actif" />
                    <dl v-if="synthese?.contrat_actif" class="mt-4 space-y-4">
                      <BaseDefItem label="Statut" :value="synthese.contrat_actif.statut" />
                      <BaseDefItem label="Date de début" :value="formatDateLong(synthese.contrat_actif.date_debut)" />
                      <BaseDefItem label="Date de fin" :value="formatDateLong(synthese.contrat_actif.date_fin)" flush />
                    </dl>
                    <p v-else class="mt-4 text-sm text-muted">Aucun contrat actif.</p>
                  </div>

                  <!-- Salaire actuel -->
                  <div>
                    <BaseCardTitle icon="i-lucide-wallet" title="Salaire actuel" />
                    <dl v-if="synthese?.salaire_actuel" class="mt-4 space-y-4">
                      <BaseDefItem label="Montant de base" :value="fmtMontant(synthese.salaire_actuel.montant_base)" />
                      <BaseDefItem label="Montant net" :value="fmtMontant(synthese.salaire_actuel.montant_net)" />
                      <BaseDefItem label="Échelon" :value="String(synthese.salaire_actuel.echelon)" />
                      <BaseDefItem label="Depuis" :value="formatDateLong(synthese.salaire_actuel.date_debut)" flush />
                    </dl>
                    <p v-else class="mt-4 text-sm text-muted">Aucun salaire enregistré.</p>
                  </div>
                </div>
              </BaseDataState>
            </div>
          </div>
        </div>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
