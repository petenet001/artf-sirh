<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { LIBELLE_NIVEAU, vueEffective } from "~/constants/utilisateurs";
import { statutAgentLabel } from "~/constants/personnel";

const auth = useAuthStore();

// La session est déjà rafraîchie au démarrage (`plugins/session.client.ts`).
// On la relit quand même ici : c'est la page où l'on vient précisément vérifier
// ses droits, souvent juste après qu'un administrateur les a changés.
onMounted(async () => {
  try {
    await auth.fetchSession();
  } catch {
    // session expirée : le client HTTP redirige déjà vers /login.
  }
});

/**
 * Vague F — périmètre de l'utilisateur.
 *
 * On affiche **ce qu'il voit** (`vue_personnel`, calculé par le serveur) et non
 * son rattachement : depuis `consulter-agents-global`, un compte du métier RH
 * est rattaché à un bureau tout en voyant l'effectif entier. Le rattachement
 * reste indiqué à côté, comme contexte d'organigramme.
 *
 * C'est ici que quelqu'un vient comprendre pourquoi ses listes sont plus
 * courtes que celles d'un collègue : autant que la réponse soit exacte.
 */
const vuePersonnel = computed(() => (auth.user ? vueEffective(auth.user) : "globale"));

const bureauRattachement = computed(() => {
  const u = auth.user;
  if (!u) return "—";
  const b = u.bureau;
  const nom = b ? (b.sigle ? `${b.nom} (${b.sigle})` : b.nom) : u.bureau_id ? `bureau nº ${u.bureau_id}` : null;

  if (vuePersonnel.value === "globale") {
    return nom
      ? `Tout le personnel — rattaché à ${nom}`
      : "Tout le personnel (aucun cloisonnement)";
  }
  return nom ? `${LIBELLE_NIVEAU[vuePersonnel.value]} — ${nom}` : LIBELLE_NIVEAU[vuePersonnel.value];
});

// Fiche agent liée (chargée seulement si l'utilisateur en a une).
const { agent, pending: agentPending } = useAgent(() => auth.user?.agent_id ?? 0);

const initials = computed(() => {
  const parts = (auth.user?.name ?? "").trim().split(/\s+/).filter(Boolean);
  return (parts.map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
});

const roles = computed(() => auth.user?.roles ?? []);
const compteActif = computed(() => auth.user?.is_active !== false);

const tabs = computed<TabsItem[]>(() => [
  { label: "Compte", icon: "i-lucide-user", slot: "compte" },
  ...(auth.user?.agent_id ? [{ label: "Ma fiche agent", icon: "i-lucide-briefcase", slot: "fiche" }] : []),
  { label: "Rôles & permissions", icon: "i-lucide-shield-check", slot: "acces" },
]);
</script>

<template>
  <BasePanel>
    <BaseDataState :empty="!auth.user" empty-label="Aucune session active">
      <div v-if="auth.user" class="space-y-6">
        <!-- En-tête héro -->
        <BaseProfileHeader :title="auth.user.name" :subtitle="auth.user.email">
          <template #leading>
            <UAvatar
              :src="agent?.photo_path ?? undefined"
              :text="initials"
              class="size-20 text-xl ring-4 ring-primary/10"
              :ui="{ root: 'bg-primary/10 text-primary' }"
            />
          </template>

          <template #meta>
            <UBadge :color="compteActif ? 'success' : 'error'" variant="subtle">
              {{ compteActif ? "Compte actif" : "Compte désactivé" }}
            </UBadge>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-shield" class="size-4 opacity-70" />
              {{ roles.length ? roles.map((r) => r.name).join(", ") : "Aucun rôle" }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-key-round" class="size-4 opacity-70" />
              {{ auth.permissions.length }} permissions
            </span>
          </template>

          <template #actions>
            <UButton
              v-if="auth.user.agent_id"
              color="neutral"
              variant="soft"
              icon="i-lucide-id-card"
              :to="`/personnel/agents/${auth.user.agent_id}`"
            >
              Ma fiche
            </UButton>
            <UButton color="error" variant="soft" icon="i-lucide-log-out" @click="auth.logout()">
              Se déconnecter
            </UButton>
          </template>
        </BaseProfileHeader>

        <!-- Détails en onglets -->
        <UCard :ui="{ body: 'sm:p-6' }">
          <UTabs :items="tabs" variant="link" :ui="{ list: 'mb-6' }">
            <!-- Compte -->
            <template #compte>
              <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <BaseInfoItem icon="i-lucide-user" label="Nom" :value="auth.user.name" />
                <BaseInfoItem icon="i-lucide-mail" label="Email" :value="auth.user.email" />
                <BaseInfoItem icon="i-lucide-hash" label="Identifiant" :value="auth.user.id" />
                <BaseInfoItem icon="i-lucide-shield-check" label="Statut du compte" :value="compteActif ? 'Actif' : 'Désactivé'" />
                <BaseInfoItem
                  icon="i-lucide-building-2"
                  label="Périmètre de consultation"
                  :value="bureauRattachement"
                />
                <BaseInfoItem icon="i-lucide-calendar-plus" label="Membre depuis" :value="formatDateLong(auth.user.created_at)" />
                <BaseInfoItem icon="i-lucide-clock" label="Dernière mise à jour" :value="formatDateTime(auth.user.updated_at)" />
              </dl>
            </template>

            <!-- Ma fiche agent -->
            <template v-if="auth.user.agent_id" #fiche>
              <div class="mb-4 flex justify-end">
                <UButton
                  variant="link"
                  :padded="false"
                  trailing-icon="i-lucide-arrow-right"
                  :to="`/personnel/agents/${auth.user.agent_id}`"
                >
                  Ouvrir la fiche complète
                </UButton>
              </div>
              <BaseDataState :pending="agentPending" :empty="!agent" empty-label="Fiche agent introuvable">
                <dl v-if="agent" class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <BaseInfoItem icon="i-lucide-hash" label="Matricule" :value="agent.matricule" />
                  <BaseInfoItem icon="i-lucide-activity" label="Statut" :value="statutAgentLabel(agent.statut)" />
                  <BaseInfoItem icon="i-lucide-briefcase" label="Fonction" :value="agent.fonction?.nom" />
                  <BaseInfoItem icon="i-lucide-medal" label="Grade" :value="agent.grade?.nom" />
                  <BaseInfoItem icon="i-lucide-layers" label="Catégorie" :value="agent.categorie?.nom" />
                  <BaseInfoItem icon="i-lucide-phone" label="Téléphone" :value="agent.telephone" />
                </dl>
              </BaseDataState>
            </template>

            <!-- Rôles & permissions -->
            <template #acces>
              <div class="space-y-5">
                <div>
                  <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Rôles</p>
                  <div v-if="roles.length" class="flex flex-wrap gap-1.5">
                    <UBadge v-for="role in roles" :key="role.id" color="primary" variant="subtle" class="capitalize">
                      {{ role.name }}
                    </UBadge>
                  </div>
                  <p v-else class="text-sm text-muted">Aucun rôle attribué</p>
                </div>

                <div v-if="auth.permissions.length">
                  <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Permissions ({{ auth.permissions.length }})
                  </p>
                  <div class="flex flex-wrap gap-1">
                    <UBadge v-for="perm in auth.permissions" :key="perm" color="neutral" variant="outline" size="sm">
                      {{ perm }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>
        </UCard>
      </div>
    </BaseDataState>
  </BasePanel>
</template>
