import { describe, expect, it } from "vitest";
import { fusionnerRessource } from "./fusion";

describe("fusionnerRessource", () => {
  const fiche: {
    id: number;
    statut: string;
    note_globale: number;
    reclamation: { id: number; motif: string } | null;
    notes: { question_id: number; note_obtenue: number }[];
  } = {
    id: 1,
    statut: "en_cours",
    note_globale: 12,
    reclamation: { id: 9, motif: "Note trop basse" },
    notes: [{ question_id: 1, note_obtenue: 3 }],
  };

  it("écrase les champs renvoyés par l'action", () => {
    const fusion = fusionnerRessource(fiche, { statut: "notee", note_globale: 15 });
    expect(fusion.statut).toBe("notee");
    expect(fusion.note_globale).toBe(15);
  });

  it("conserve une relation que la réponse ne porte pas", () => {
    const fusion = fusionnerRessource(fiche, { note_globale: 15 });
    expect(fusion.reclamation).toEqual(fiche.reclamation);
  });

  it("distingue le silence (undefined) de l'effacement (null)", () => {
    expect(fusionnerRessource(fiche, { reclamation: undefined }).reclamation).toEqual(fiche.reclamation);
    expect(fusionnerRessource(fiche, { reclamation: null }).reclamation).toBeNull();
  });

  it("ne modifie pas l'objet d'origine", () => {
    fusionnerRessource(fiche, { statut: "notee" });
    expect(fiche.statut).toBe("en_cours");
  });

  it("rend la ressource inchangée si l'action n'a rien renvoyé", () => {
    expect(fusionnerRessource(fiche, null)).toBe(fiche);
  });
});
