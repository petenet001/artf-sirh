<script setup lang="ts">
import type { Notification } from "~/schemas/notification";
import { notificationDomaineMeta, notificationLink } from "~/constants/notifications";

/**
 * Cloche de notifications de la navbar : badge du nombre de non lues + panneau
 * déroulant (10 dernières). Cliquer un item le marque lu et navigue vers l'écran
 * concerné quand il existe (cf. `notificationLink`). Le panneau se rafraîchit à
 * l'ouverture ; l'état est partagé via `useNotifications`.
 */
const { items, nonLues, pending, loaded, refresh, marquerLu, toutLire } = useNotifications();
const handleError = useApiError();

const open = ref(false);

onMounted(() => {
  if (!loaded.value) refresh();
});

// Rafraîchir à chaque ouverture pour ne pas rester sur un état périmé.
watch(open, (isOpen) => {
  if (isOpen) refresh();
});

const badge = computed(() => (nonLues.value > 99 ? "99+" : String(nonLues.value)));

async function ouvrir(notification: Notification) {
  open.value = false;
  const link = notificationLink(notification);
  try {
    await marquerLu(notification);
  } catch (err) {
    handleError(err);
  }
  if (link) navigateTo(link);
}

async function toutMarquer() {
  try {
    await toutLire();
  } catch (err) {
    handleError(err);
  }
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'end', side: 'bottom' }">
    <UChip :text="badge" :show="nonLues > 0" color="error" size="3xl" :ui="{ base: '-mt-0.5 -me-0.5' }">
      <UButton
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        :aria-label="nonLues > 0 ? `Notifications (${nonLues} non lues)` : 'Notifications'"
      />
    </UChip>

    <template #content>
      <div class="w-80 sm:w-96">
        <div class="flex items-center justify-between gap-2 border-b border-default px-4 py-3">
          <p class="text-sm font-semibold text-highlighted">Notifications</p>
          <UButton
            v-if="nonLues > 0"
            label="Tout marquer lu"
            variant="link"
            size="xs"
            color="neutral"
            @click="toutMarquer"
          />
        </div>

        <div class="max-h-[26rem] overflow-y-auto">
          <div v-if="pending && !items.length" class="px-4 py-10 text-center text-sm text-muted">
            Chargement…
          </div>

          <div v-else-if="!items.length" class="px-4 py-12 text-center">
            <UIcon name="i-lucide-bell-off" class="mx-auto mb-2 size-6 text-dimmed" />
            <p class="text-sm text-muted">Aucune notification</p>
          </div>

          <ul v-else class="divide-y divide-default">
            <li v-for="n in items" :key="n.id">
              <button
                type="button"
                class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated/50"
                :class="!n.lu && 'bg-primary/[0.04]'"
                @click="ouvrir(n)"
              >
                <span
                  class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <UIcon :name="notificationDomaineMeta(n.domaine).icon" class="size-4" />
                </span>
                <span class="min-w-0 flex-1">
                  <span
                    class="block text-sm"
                    :class="n.lu ? 'text-default' : 'font-medium text-highlighted'"
                  >
                    {{ n.message ?? notificationDomaineMeta(n.domaine).label }}
                  </span>
                  <span class="mt-0.5 block text-xs text-muted">
                    {{ formatDateRelative(n.created_at) }}
                  </span>
                </span>
                <span
                  v-if="!n.lu"
                  class="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </UPopover>
</template>
