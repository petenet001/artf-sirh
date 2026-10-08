// @vitest-environment nuxt
import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import type { TableColumn } from "@nuxt/ui";
import BaseTable from "./Table.vue";

/**
 * Sélecteur « Affichage [10 / 25 / 50 / 100] » du pied de table.
 *
 * Le bug avait été signalé sur la grille salariale : choisir une taille de page
 * ne changeait pas le nombre de lignes affichées.
 */

type Ligne = { id: number };

// Composant générique : `mountSuspended` n'infère pas `T` (→ `unknown`).
const columns: TableColumn<unknown>[] = [{ accessorKey: "id", header: "N°" }];
const lignes = (n: number): Ligne[] => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));

const nbLignes = (wrapper: { findAll: (s: string) => unknown[] }) => wrapper.findAll("tbody tr").length;

async function monter(pageSize: number, total = 120) {
  return mountSuspended(BaseTable, { props: { data: lignes(total), columns, pageSize } });
}

describe("BaseTable — taille de page", () => {
  it("affiche `pageSize` lignes au départ", async () => {
    const wrapper = await monter(15);
    expect(nbLignes(wrapper)).toBe(15);
  });

  it.each([10, 25, 50, 100])("passe à %i lignes quand on le choisit", async (taille) => {
    const wrapper = await monter(15);
    (wrapper.vm as unknown as { perPage: number }).perPage = taille;
    await nextTick();
    expect(nbLignes(wrapper)).toBe(taille);
    expect(wrapper.text()).toContain(`Affichage de 1 à ${taille} sur 120`);
  });

  it("revient à la première page au changement de taille", async () => {
    const wrapper = await monter(10);
    const vm = wrapper.vm as unknown as { perPage: number; goToPage: (p: number) => void };
    vm.goToPage(3);
    await nextTick();
    expect(wrapper.text()).toContain("Affichage de 21 à 30 sur 120");

    vm.perPage = 25;
    await nextTick();
    expect(wrapper.text()).toContain("Affichage de 1 à 25 sur 120");
  });

  it("propose la taille initiale même hors de la liste standard", async () => {
    const wrapper = await monter(15);
    expect((wrapper.vm as unknown as { pageSizes: number[] }).pageSizes).toEqual([10, 15, 25, 50, 100]);
  });
});
