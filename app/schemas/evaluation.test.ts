import { describe, it, expect } from "vitest";
import {
  evaluationSchema,
  contexteEvaluationSchema,
  avisEtSignerSchema,
  validationRhSchema,
} from "./evaluation";

describe("evaluationSchema", () => {
  const valid = {
    id: 1,
    session_id: 3,
    agent_id: 5,
    superieur_id: 9,
    note_globale: 15.5,
    mention: "Très bien",
    statut: "notee",
    statut_label: "Notée (non signée)",
    prochaine_etape: "avis_et_signer",
    inscrit_tableau: false,
  };

  it("valide une fiche de liste (sans relation chargée)", () => {
    const parsed = evaluationSchema.parse(valid);
    expect(parsed.statut).toBe("notee");
    expect(parsed.prochaine_etape).toBe("avis_et_signer");
    expect(parsed.note_globale).toBe(15.5);
  });

  it("accepte une note globale sérialisée en chaîne (decimal Laravel)", () => {
    const parsed = evaluationSchema.parse({ ...valid, note_globale: "15.50" });
    expect(parsed.note_globale).toBe(15.5);
  });

  it("accepte prochaine_etape null (fiche terminée ou annulée)", () => {
    const parsed = evaluationSchema.parse({ ...valid, statut: "annulee", prochaine_etape: null });
    expect(parsed.prochaine_etape).toBeNull();
  });

  it("accepte les relations du show (session, agent, notes, réclamation)", () => {
    const parsed = evaluationSchema.parse({
      ...valid,
      agent: { id: 5, matricule: "AG005", nom: "DUPONT", prenom: "Jean", nom_complet: "Jean DUPONT" },
      session: { id: 3, debut_session: "2026-09-01", statut: "ouverte", statut_label: "Ouverte" },
      notes: [
        {
          question_id: 1,
          note_obtenue: 0.9,
          question: { id: 1, libelle: "Connaissance technique", type_critere: "competence_pro", bareme_max: 1 },
        },
      ],
      reclamation: {
        id: 2,
        evaluation_id: 1,
        agent_id: 5,
        motif: "Je conteste la note du critère technique.",
        statut: "en_attente",
      },
    });
    expect(parsed.notes?.[0]?.question?.type_critere).toBe("competence_pro");
    expect(parsed.reclamation?.statut).toBe("en_attente");
    expect(parsed.session?.statut).toBe("ouverte");
  });

  it("accepte les champs de commission (lot tableau d'avancement)", () => {
    const parsed = evaluationSchema.parse({
      ...valid,
      statut: "finalisee",
      prochaine_etape: "avancer_echelon",
      inscrit_tableau: true,
      commission_decision: "favorable",
      nombre_echelons: 1,
      echelon_avance: false,
    });
    expect(parsed.commission_decision).toBe("favorable");
    expect(parsed.inscrit_tableau).toBe(true);
  });

  it("rejette un statut ou une étape hors enum", () => {
    expect(() => evaluationSchema.parse({ ...valid, statut: "brouillon" })).toThrow();
    expect(() => evaluationSchema.parse({ ...valid, prochaine_etape: "publier" })).toThrow();
  });
});

describe("payloads d'action", () => {
  it("contexte : tout est optionnel, absences bornées à 365", () => {
    expect(contexteEvaluationSchema.parse({})).toEqual({});
    expect(() => contexteEvaluationSchema.parse({ jours_absence_non_justifiee: 400 })).toThrow();
  });

  it("avis du notateur : 10 caractères minimum (CCN art. 63)", () => {
    expect(() => avisEtSignerSchema.parse({ avis_superieur: "trop court" .slice(0, 5) })).toThrow();
    expect(avisEtSignerSchema.parse({ avis_superieur: "Agent rigoureux et impliqué." }).avis_superieur).toContain("rigoureux");
  });

  it("validation RH : `conforme` est obligatoire", () => {
    expect(() => validationRhSchema.parse({ commentaire: "ok" })).toThrow();
    expect(validationRhSchema.parse({ conforme: false }).conforme).toBe(false);
  });
});
