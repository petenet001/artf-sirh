import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde-fou : **la liste non filtrée reste confinée au repository**.
 *
 * L'API expose deux listes d'agents qui se ressemblent et ne disent pas la
 * même chose :
 *
 * | Route | Filtrée par structure ? | Permission de route |
 * |---|---|---|
 * | `GET /personnel/agents` | oui (vague F) | `consulter-agents` |
 * | `GET /integration/agents` | **non** | **aucune** |
 *
 * La seconde n'ayant aucune garde côté serveur, la brancher sur un écran du
 * quotidien n'échoue pas : elle renvoie simplement l'effectif entier. Un chef
 * de service voyait ainsi les 61 agents de l'ARTF au lieu des 4 de son service,
 * sans qu'aucune erreur ne le signale.
 *
 * On vérifie donc que l'URL brute n'apparaît nulle part ailleurs que dans la
 * couche `api/`, où elle est nommée `listeDossiers()` et documentée.
 */

const APP = join(process.cwd(), "app");

function fichiers(dossier: string, extensions: string[]): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) return fichiers(chemin, extensions);
    return extensions.some((e) => chemin.endsWith(e)) ? [chemin] : [];
  });
}

/** Retire commentaires de bloc et de ligne : on ne traque que du code appelé. */
function sansCommentaires(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("liste des agents : la source non filtrée ne fuit pas hors du repository", () => {
  it("aucune page, composant ou composable n'appelle `/integration/agents`", () => {
    const fautifs = fichiers(APP, [".vue", ".ts"])
      .filter((f) => !f.includes(join("app", "api")) && !f.endsWith(".test.ts"))
      .filter((f) => /["'`]\/integration\/agents/.test(sansCommentaires(readFileSync(f, "utf8"))))
      .map((f) => f.replace(`${process.cwd()}/`, ""));

    expect(fautifs).toEqual([]);
  });

  it("le repository nomme explicitement la variante non filtrée", () => {
    const source = readFileSync(join(APP, "api", "agents.ts"), "utf8");
    // `list()` doit viser la route filtrée…
    expect(source).toMatch(/list:[\s\S]{0,120}\/personnel\/agents/);
    // …et la non filtrée ne doit exister que sous un nom qui prévient.
    expect(source).toMatch(/listeDossiers:[\s\S]{0,140}\/integration\/agents/);
  });
});
