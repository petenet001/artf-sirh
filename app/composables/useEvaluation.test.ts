// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";
import type { Evaluation } from "~/schemas/evaluation";

/**
 * Ce que ce composable doit garantir à l'écran de notation :
 * - l'écran de chargement n'apparaît qu'à la **première** ouverture ; un
 *   rafraîchissement laisse la fiche en place (sinon la page se vide à chaque
 *   note) ;
 * - `appliquer` recolle la réponse d'une action sans rien redemander au réseau,
 *   et sans faire disparaître les relations que cette réponse ne porte pas.
 */

const getById = vi.fn();

mockNuxtImport("useEvaluationsApi", () => () => ({ getById }));

const FICHE = {
  id: 7,
  statut: "en_cours",
  note_globale: 8,
  notes: [{ question_id: 1, note_obtenue: 3 }],
  reclamation: { id: 2, motif: "Note contestée" },
} as unknown as Evaluation;

type Etat = ReturnType<typeof useEvaluation>;

/**
 * Le composable est monté dans un composant hôte : `useAsyncData` a besoin du
 * contexte Nuxt. On récupère son état par une variable plutôt que par `expose`,
 * que `mountSuspended` ne remonte pas jusqu'au `vm` de son wrapper.
 */
async function monter(): Promise<Etat> {
  let etat: Etat | null = null;
  const Hote = defineComponent({
    setup() {
      etat = useEvaluation(ref(7));
      return () => h("div");
    },
  });
  await mountSuspended(Hote);
  return etat!;
}

beforeEach(() => {
  getById.mockReset();
  getById.mockResolvedValue({ data: FICHE });
});

describe("useEvaluation", () => {
  it("charge la fiche à l'ouverture", async () => {
    const vm = await monter();
    expect(vm.evaluation.value?.id).toBe(7);
    expect(vm.chargementInitial.value).toBe(false);
  });

  it("ne vide pas l'écran pendant un rafraîchissement", async () => {
    const vm = await monter();
    const attente = vm.rafraichirEnFond();
    await nextTick();
    // Le refetch est en cours : la fiche reste affichée, seul le témoin bouge.
    expect(vm.rafraichissement.value).toBe(true);
    expect(vm.chargementInitial.value).toBe(false);
    expect(vm.evaluation.value?.id).toBe(7);
    await attente;
    expect(vm.rafraichissement.value).toBe(false);
  });

  it("recolle la fiche d'une action sans appel réseau", async () => {
    const vm = await monter();
    // `useAsyncData` sert parfois la fiche depuis son cache : c'est le nombre
    // d'appels **ajoutés** par `appliquer` qui doit rester nul, pas le total.
    const avant = getById.mock.calls.length;

    vm.appliquer({ ...FICHE, note_globale: 12, notes: [{ question_id: 1, note_obtenue: 5 }] } as Evaluation);
    await nextTick();

    expect(vm.evaluation.value?.note_globale).toBe(12);
    expect(getById.mock.calls.length).toBe(avant);
  });

  it("garde les relations absentes de la réponse d'action", async () => {
    const vm = await monter();
    vm.appliquer({ id: 7, statut: "notee" } as Evaluation);
    await nextTick();

    expect(vm.evaluation.value?.statut).toBe("notee");
    expect(vm.evaluation.value?.reclamation).toEqual(FICHE.reclamation);
  });
});
