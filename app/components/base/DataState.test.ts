import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde-fou structurel : **aucune liste ne doit masquer sa barre d'outils**.
 *
 * `BaseDataState` rend son état vide *à la place* du contenu. Sur un écran de
 * liste, cela emporte la table **et** sa barre d'outils — donc le bouton
 * « Nouveau ». L'utilisateur se retrouve devant une impasse : rien à voir, et
 * rien pour créer le premier élément.
 *
 * Le bug avait été signalé sur les nominations (« pourquoi le bouton ajouter ne
 * s'affiche pas quand il n'y a aucune nomination ? »), et il touchait aussi les
 * affectations. Comme il se reproduit d'un simple copier-coller et ne casse
 * aucun test fonctionnel, on le teste à la source.
 *
 * La règle : sur une liste, on ne passe pas `empty` à `BaseDataState` ; on
 * laisse `BaseTable` rendre son propre état vide (`empty-label` ou `#empty`).
 */

const RACINE = join(process.cwd(), "app");

function fichiersVue(dossier: string): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) return fichiersVue(chemin);
    return chemin.endsWith(".vue") ? [chemin] : [];
  });
}

/** Blocs `<BaseDataState …> … </BaseDataState>` d'un fichier. */
function blocsDataState(source: string): { attributs: string; contenu: string }[] {
  const blocs: { attributs: string; contenu: string }[] = [];
  for (const m of source.matchAll(/<BaseDataState\b([^>]*)>([\s\S]*?)<\/BaseDataState>/g)) {
    blocs.push({ attributs: m[1] ?? "", contenu: m[2] ?? "" });
  }
  return blocs;
}

/**
 * Une barre d'outils **de table** est-elle présente ?
 *
 * On ne regarde qu'à l'intérieur d'un `<BaseTable>` : le slot `#actions` d'un
 * `BaseProfileHeader`, sur une fiche, n'est pas concerné — là, `empty` veut
 * légitimement dire « cette fiche n'existe pas ».
 */
function porteUneBarreDeTable(contenu: string): boolean {
  for (const table of contenu.matchAll(/<BaseTable\b[\s\S]*?<\/BaseTable>/g)) {
    if (/<template\s+#actions\s*>/.test(table[0])) return true;
  }
  return false;
}

describe("BaseDataState : une liste vide garde son bouton de création", () => {
  it("aucun écran ne place une barre d'outils sous un `empty` qui l'effacerait", () => {
    const fautifs: string[] = [];

    for (const chemin of fichiersVue(RACINE)) {
      const source = readFileSync(chemin, "utf8");
      for (const bloc of blocsDataState(source)) {
        const masque = /(^|\s):?empty[=\s]/.test(bloc.attributs);
        if (masque && porteUneBarreDeTable(bloc.contenu)) {
          fautifs.push(chemin.replace(`${process.cwd()}/`, ""));
        }
      }
    }

    expect(fautifs).toEqual([]);
  });
});
