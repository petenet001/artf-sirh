import { describe, it, expect } from "vitest";
import type { Evaluation } from "~/schemas/evaluation";
import type { AvisHierarchique } from "~/schemas/avis-hierarchique";
import type { ActeurEvaluation } from "./evaluationActions";
import {
  actionsEvaluation,
  actionsTableau,
  chaineAvis,
  envoiRhBloque,
  estEvalue,
  estNotateur,
  grilleOuverte,
  peutAvancerEchelon,
  peutTelechargerFiche,
} from "./evaluationActions";

/**
 * Règle testée ici : le backend ne contrôle que la permission de route, jamais
 * l'identité de l'acteur. C'est donc ce module qui garantit qu'un chef ne se
 * voit pas proposer de signer la fiche d'un agent qu'il ne note pas.
 */
const AGENT_ID = 5;
const N1_ID = 9;

function fiche(over: Partial<Evaluation> = {}): Evaluation {
  return {
    id: 1,
    agent_id: AGENT_ID,
    superieur_id: N1_ID,
    statut: "notee",
    prochaine_etape: "avis_et_signer",
    ...over,
  } as Evaluation;
}

const agent: ActeurEvaluation = { agentId: AGENT_ID, estRh: false, peutValider: false };
const notateur: ActeurEvaluation = { agentId: N1_ID, estRh: false, peutValider: true };
// Chef d'une autre équipe : a bien `valider-evaluations` (seeder), mais pas cette fiche.
const autreChef: ActeurEvaluation = { agentId: 42, estRh: false, peutValider: true };
const rh: ActeurEvaluation = { agentId: 7, estRh: true, peutValider: true, peutCreer: true };

const keys = (f: Evaluation, a: ActeurEvaluation) => actionsEvaluation(f, a).map((x) => x.key);

describe("identité de l'acteur", () => {
  it("distingue le notateur de l'évalué", () => {
    expect(estNotateur(fiche(), notateur)).toBe(true);
    expect(estNotateur(fiche(), agent)).toBe(false);
    expect(estEvalue(fiche(), agent)).toBe(true);
    expect(estEvalue(fiche(), notateur)).toBe(false);
  });

  it("un compte sans agent rattaché n'est ni l'un ni l'autre", () => {
    const sansAgent: ActeurEvaluation = { agentId: null, estRh: false, peutValider: true };
    expect(estNotateur(fiche(), sansAgent)).toBe(false);
    expect(estEvalue(fiche(), sansAgent)).toBe(false);
  });
});

describe("actionsEvaluation", () => {
  it("notation : seul le notateur de la fiche est servi", () => {
    const f = fiche({ statut: "en_attente", prochaine_etape: "noter" });
    expect(keys(f, notateur)).toEqual(["noter"]);
    expect(keys(f, autreChef)).toEqual([]);
    expect(keys(f, agent)).toEqual([]);
  });

  it("avis et signature : réservés au notateur", () => {
    expect(keys(fiche(), notateur)).toEqual(["avis_et_signer"]);
    expect(keys(fiche(), agent)).toEqual([]);
  });

  it("signature de l'agent : réservée à l'évalué", () => {
    const f = fiche({ statut: "signee_evaluateur", prochaine_etape: "signer_evalue" });
    expect(keys(f, agent)).toEqual(["signer_evalue"]);
    expect(keys(f, notateur)).toEqual([]);
  });

  it("fiche signée par l'agent : il transmet ou conteste (art. 65)", () => {
    const f = fiche({ statut: "signee_evalue", prochaine_etape: "envoyer_rh" });
    expect(keys(f, agent)).toEqual(["envoyer_rh", "reclamer"]);
    expect(keys(f, rh)).toEqual([]);
  });

  it("validation RH : valider ou rejeter, pour le rôle RH seulement", () => {
    const f = fiche({ statut: "en_validation_rh", prochaine_etape: "valider_rh" });
    expect(keys(f, rh)).toEqual(["valider_rh", "rejeter_rh", "annuler"]);
    // Un chef a `valider-evaluations` mais n'est pas la RH.
    expect(keys(f, autreChef)).toEqual([]);
  });

  it("rejet RH : le notateur est invité à corriger", () => {
    const f = fiche({ statut: "rejetee", prochaine_etape: "corriger_notation" });
    expect(keys(f, notateur)).toEqual(["noter"]);
  });

  it("réclamation en cours : seule la RH tranche", () => {
    const f = fiche({ statut: "en_reclamation", prochaine_etape: "traiter_reclamation" });
    expect(keys(f, rh)).toEqual(["traiter_reclamation"]);
    expect(keys(f, agent)).toEqual([]);
  });

  it("annulation : offerte à la RH tant que la fiche n'est pas signée ou terminée", () => {
    expect(keys(fiche({ statut: "en_cours", prochaine_etape: "continuer_notation" }), rh)).toContain("annuler");
    expect(keys(fiche({ statut: "signee_evalue", prochaine_etape: "envoyer_rh" }), rh)).not.toContain("annuler");
    expect(keys(fiche({ statut: "finalisee", prochaine_etape: null }), rh)).not.toContain("annuler");
  });

  it("étapes du tableau d'avancement : aucun bouton ici (écran commissions)", () => {
    for (const etape of ["inscrire_tableau", "commission_preparatoire", "avancer_echelon"] as const) {
      const f = fiche({ statut: "finalisee", prochaine_etape: etape });
      expect(keys(f, rh)).toEqual([]);
    }
  });

  it("une seule action principale est mise en avant", () => {
    const f = fiche({ statut: "signee_evalue", prochaine_etape: "envoyer_rh" });
    expect(actionsEvaluation(f, agent).filter((a) => a.principale)).toHaveLength(1);
  });
});

describe("peutTelechargerFiche", () => {
  it("refuse le PDF avant la signature de l'agent (422 côté API)", () => {
    expect(peutTelechargerFiche(fiche({ statut: "notee" }), agent)).toBe(false);
    expect(peutTelechargerFiche(fiche({ statut: "signee_evaluateur" }), agent)).toBe(false);
  });

  it("l'ouvre à l'agent, à son notateur, à la RH et au DG", () => {
    const f = fiche({ statut: "finalisee" });
    expect(peutTelechargerFiche(f, agent)).toBe(true);
    expect(peutTelechargerFiche(f, notateur)).toBe(true);
    expect(peutTelechargerFiche(f, rh)).toBe(true);
    expect(peutTelechargerFiche(f, { agentId: 99, estRh: false, peutValider: true, estDg: true })).toBe(true);
  });

  it("le refuse au chef d'une autre équipe (403 côté API)", () => {
    expect(peutTelechargerFiche(fiche({ statut: "finalisee" }), autreChef)).toBe(false);
  });
});

describe("grilleOuverte", () => {
  it("suit exactement ce que le backend accepte de noter", () => {
    for (const statut of ["en_attente", "en_cours", "notee", "rejetee"] as const) {
      expect(grilleOuverte({ statut })).toBe(true);
    }
    for (const statut of ["signee_evaluateur", "signee_evalue", "en_validation_rh", "finalisee", "annulee"] as const) {
      expect(grilleOuverte({ statut })).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Lot 3 — avis hiérarchiques, tableau d'avancement, commissions
// ---------------------------------------------------------------------------

const NIVEAUX_STANDARD = [
  { niveau: "chef_bureau" as const, label: "Chef de Bureau" },
  { niveau: "chef_service" as const, label: "Chef de Service" },
  { niveau: "directeur" as const, label: "Directeur" },
  { niveau: "directeur_general" as const, label: "Directeur Général" },
];

function avisPose(niveau: string, signe: boolean): AvisHierarchique {
  return { id: 1, evaluation_id: 1, niveau, signe } as AvisHierarchique;
}

const chefBureau: ActeurEvaluation = {
  agentId: 20,
  estRh: false,
  peutValider: true,
  roles: ["chef-bureau"],
};
const directeur: ActeurEvaluation = {
  agentId: 21,
  estRh: false,
  peutValider: true,
  roles: ["directeur"],
};

describe("chaineAvis", () => {
  it("ouvre le premier niveau et verrouille les suivants", () => {
    const chaine = chaineAvis(NIVEAUX_STANDARD, [], chefBureau);
    expect(chaine.map((e) => e.deverrouille)).toEqual([true, false, false, false]);
    expect(chaine[0]?.actionnable).toBe(true);
  });

  it("déverrouille le niveau suivant dès que le précédent a signé", () => {
    const chaine = chaineAvis(NIVEAUX_STANDARD, [avisPose("chef_bureau", true)], chefBureau);
    expect(chaine[0]?.signe).toBe(true);
    expect(chaine[1]?.deverrouille).toBe(true);
    // Un avis signé n'est plus modifiable (422 côté API).
    expect(chaine[0]?.actionnable).toBe(false);
  });

  it("n'ouvre un niveau qu'au rôle correspondant", () => {
    const avis = [avisPose("chef_bureau", true), avisPose("chef_service", true)];
    const chaine = chaineAvis(NIVEAUX_STANDARD, avis, directeur);
    expect(chaine[2]?.actionnable).toBe(true);
    // Le chef de bureau ne signe pas à la place du directeur.
    expect(chaineAvis(NIVEAUX_STANDARD, avis, chefBureau)[2]?.actionnable).toBe(false);
  });

  it("laisse l'admin agir sur n'importe quel niveau ouvert", () => {
    const admin: ActeurEvaluation = { agentId: 1, estRh: true, estAdmin: true, peutValider: true, roles: ["admin"] };
    expect(chaineAvis(NIVEAUX_STANDARD, [], admin)[0]?.actionnable).toBe(true);
  });

  it("suit la chaîne raccourcie quand la direction est rattachée au DG", () => {
    const sansDirecteur = NIVEAUX_STANDARD.filter((n) => n.niveau !== "directeur");
    const chaine = chaineAvis(sansDirecteur, [], chefBureau);
    expect(chaine.map((e) => e.niveau)).toEqual(["chef_bureau", "chef_service", "directeur_general"]);
    expect(chaine.map((e) => e.ordre)).toEqual([1, 2, 3]);
  });
});

describe("envoiRhBloque", () => {
  it("bloque tant qu'un niveau requis n'a pas signé", () => {
    expect(envoiRhBloque(NIVEAUX_STANDARD, [])).toBe(true);
    expect(envoiRhBloque(NIVEAUX_STANDARD, [avisPose("chef_bureau", true)])).toBe(true);
  });

  it("laisse passer quand tous les niveaux ont signé", () => {
    const tous = NIVEAUX_STANDARD.map((n) => avisPose(n.niveau, true));
    expect(envoiRhBloque(NIVEAUX_STANDARD, tous)).toBe(false);
  });

  it("ne bloque pas quand aucune chaîne n'est requise", () => {
    expect(envoiRhBloque([], [])).toBe(false);
  });
});

describe("actionsTableau", () => {
  const finalisee = (over: Partial<Evaluation> = {}) =>
    fiche({ statut: "finalisee", prochaine_etape: null, inscrit_tableau: true, ...over });

  it("propose l'inscription d'une fiche finalisée retirée du tableau", () => {
    const actions = actionsTableau(finalisee({ inscrit_tableau: false }), rh);
    expect(actions.map((a) => a.key)).toEqual(["inscrire_tableau"]);
  });

  it("propose le retrait tant qu'aucune décision n'est posée", () => {
    expect(actionsTableau(finalisee(), rh).map((a) => a.key)).toEqual(["retirer_tableau"]);
    // Décision posée : l'API refuse le retrait (422) → plus de bouton.
    expect(actionsTableau(finalisee({ commission_decision: "favorable" }), rh)).toEqual([]);
  });

  it("reste fermé à qui n'est pas la RH, et aux fiches non finalisées", () => {
    expect(actionsTableau(finalisee(), autreChef)).toEqual([]);
    expect(actionsTableau(finalisee(), agent)).toEqual([]);
    expect(actionsTableau(fiche({ statut: "en_validation_rh" }), rh)).toEqual([]);
  });
});

describe("peutAvancerEchelon", () => {
  it("n'ouvre l'application qu'après une décision favorable non appliquée", () => {
    expect(peutAvancerEchelon(fiche({ commission_decision: "favorable", echelon_avance: false }))).toBe(true);
    expect(peutAvancerEchelon(fiche({ commission_decision: "favorable", echelon_avance: true }))).toBe(false);
    expect(peutAvancerEchelon(fiche({ commission_decision: "defavorable" }))).toBe(false);
    expect(peutAvancerEchelon(fiche())).toBe(false);
  });
});

describe("peutReattribuerSuperieur", () => {
  const rh = { peutCreer: true };
  const chef = { peutCreer: false };
  const ouverte = { statut: "ouverte" };

  it("est ouvert à la RH sur une fiche vivante d'une session ouverte", () => {
    const vivants = ["en_attente", "en_cours", "notee", "signee_evalue", "en_validation_rh"] as const;
    for (const statut of vivants) {
      expect(peutReattribuerSuperieur({ statut, session: ouverte }, rh)).toBe(true);
    }
  });

  it("est refusé à un chef : on ne se retire pas soi-même d'une fiche", () => {
    expect(peutReattribuerSuperieur({ statut: "en_cours", session: ouverte }, chef)).toBe(false);
  });

  it("est refusé sur une fiche terminée : cela réécrirait qui a signé", () => {
    const termines = ["finalisee", "rejetee", "annulee"] as const;
    for (const statut of termines) {
      expect(peutReattribuerSuperieur({ statut, session: ouverte }, rh)).toBe(false);
    }
  });

  it("est refusé si la session est clôturée ou annulée", () => {
    expect(peutReattribuerSuperieur({ statut: "en_cours", session: { statut: "cloturee" } }, rh)).toBe(false);
    expect(peutReattribuerSuperieur({ statut: "en_cours", session: { statut: "annulee" } }, rh)).toBe(false);
  });

  it("ne présume rien quand la session n'est pas dans le payload", () => {
    // La liste ne charge pas la session : mieux vaut masquer le bouton que
    // proposer une action qui finirait en 422.
    expect(peutReattribuerSuperieur({ statut: "en_cours" }, rh)).toBe(false);
    expect(peutReattribuerSuperieur({ statut: "en_cours", session: null }, rh)).toBe(false);
  });
});
