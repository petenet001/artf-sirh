// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import type { Evaluation } from "~/schemas/evaluation";
import GrilleNotation from "./GrilleNotation.vue";

/**
 * La notation enchaîne 24 critères, un appel par critère. Ce qui est vérifié
 * ici, c'est ce qui rendait la saisie pénible :
 * - un critère quitté sans changement ne doit **pas** appeler l'API ;
 * - une note enregistrée remonte la fiche recalculée à la page (`saved`), qui
 *   la recolle — donc aucun rechargement de la fiche.
 */

const QUESTIONS = [
  { id: 1, libelle: "Qualité du travail", type_critere: "competence_professionnelle", bareme_max: 5, ordre: 1, actif: true },
  { id: 2, libelle: "Ponctualité", type_critere: "assiduite", bareme_max: 3, ordre: 2, actif: true },
];

const noter = vi.fn();

mockNuxtImport("useQuestionsEvaluationApi", () => () => ({
  list: () => Promise.resolve({ data: QUESTIONS }),
}));

mockNuxtImport("useEvaluationsApi", () => () => ({ noter }));

const fiche = (notes: { question_id: number; note_obtenue: number; commentaire?: string | null }[] = []) =>
  ({ id: 7, statut: "en_cours", notes }) as unknown as Evaluation;

type Vm = {
  saisie: Record<number, number | undefined>;
  commentaires: Record<number, string>;
  enregistrer: (q: { id: number; bareme_max: number }) => Promise<void>;
  confirmees: Record<number, boolean>;
};

async function monter(evaluation = fiche()) {
  const wrapper = await mountSuspended(GrilleNotation, { props: { evaluation, editable: true } });
  return { wrapper, vm: wrapper.vm as unknown as Vm };
}

beforeEach(() => {
  noter.mockReset();
  noter.mockResolvedValue({ data: fiche([{ question_id: 1, note_obtenue: 4 }]) });
});

describe("GrilleNotation", () => {
  it("n'appelle pas l'API sur un critère non noté", async () => {
    const { vm } = await monter();
    await vm.enregistrer(QUESTIONS[0]!);
    expect(noter).not.toHaveBeenCalled();
  });

  it("n'appelle pas l'API quand la note n'a pas changé", async () => {
    const { vm } = await monter(fiche([{ question_id: 1, note_obtenue: 4, commentaire: null }]));
    await vm.enregistrer(QUESTIONS[0]!);
    expect(noter).not.toHaveBeenCalled();
  });

  it("enregistre une note et remonte la fiche recalculée, sans rechargement", async () => {
    const { wrapper, vm } = await monter();
    vm.saisie[1] = 4;
    await vm.enregistrer(QUESTIONS[0]!);

    expect(noter).toHaveBeenCalledTimes(1);
    expect(noter).toHaveBeenCalledWith(7, { question_id: 1, note_obtenue: 4, commentaire: null });

    const saved = wrapper.emitted("saved");
    expect(saved).toHaveLength(1);
    // La page reçoit la fiche : c'est ce qui remplace le refetch.
    expect((saved![0]![0] as Evaluation).notes).toEqual([{ question_id: 1, note_obtenue: 4 }]);
    expect(vm.confirmees[1]).toBe(true);
  });

  it("refuse une note au-dessus du barème sans appeler l'API", async () => {
    const { vm } = await monter();
    vm.saisie[2] = 9;
    await vm.enregistrer(QUESTIONS[1]!);
    expect(noter).not.toHaveBeenCalled();
    expect(vm.saisie[2]).toBeUndefined();
  });
});
