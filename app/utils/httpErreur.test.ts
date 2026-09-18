import { describe, it, expect } from "vitest";
import { reactionSession, messageErreur } from "./httpErreur";

describe("reactionSession", () => {
  it("déconnecte sur 401 : le token ne vaut plus rien", () => {
    expect(reactionSession(401, "/api/agents")).toBe("deconnecter");
  });

  it("NE déconnecte PAS sur 403 : la session est valide, c'est la permission qui manque", () => {
    // Le symptôme signalé : accéder à une page interdite coupait la session.
    expect(reactionSession(403, "/api/reporting/dashboard")).toBe("conserver");
  });

  it("ne touche pas à la session sur les autres statuts", () => {
    for (const statut of [200, 404, 422, 500, 503]) {
      expect(reactionSession(statut, "/api/agents")).toBe("conserver");
    }
    expect(reactionSession(undefined, "/api/agents")).toBe("conserver");
  });

  it("laisse le formulaire de connexion afficher son propre refus", () => {
    // Rediriger vers /login depuis /login effacerait « identifiants incorrects ».
    expect(reactionSession(401, "http://api.test/api/login")).toBe("conserver");
  });
});

describe("messageErreur", () => {
  it("explique un 403 au lieu de répéter « Accès refusé »", () => {
    const m = messageErreur({ status: 403, data: { message: "Accès refusé." } });
    expect(m.title).toBe("Action non autorisée");
    // Il doit dire que la session tient : c'est ce que l'utilisateur craint.
    expect(m.description).toContain("restez connecté");
    expect(m.color).toBe("warning");
  });

  it("remonte le premier message de champ d'un 422", () => {
    const m = messageErreur({
      status: 422,
      data: { message: "Les données sont invalides.", errors: { date_debut: ["La date est requise."] } },
    });
    expect(m.title).toBe("La date est requise.");
    expect(m.color).toBe("error");
  });

  it("préfère le message du serveur quand il en donne un", () => {
    const m = messageErreur({ status: 422, data: { message: "Congé déjà posé sur cette période." } });
    expect(m.title).toBe("Congé déjà posé sur cette période.");
  });

  it("dit qu'un 500 muet est technique plutôt que d'inventer une cause métier", () => {
    expect(messageErreur({ status: 500 }).title).toBe("Le serveur n'a pas répondu");
    // Réseau coupé : pas de statut du tout.
    expect(messageErreur({}).title).toBe("Le serveur n'a pas répondu");
  });

  it("retombe sur un message générique pour une erreur sans forme connue", () => {
    expect(messageErreur({ status: 418, data: { message: "" } }).title).toBe("Une erreur est survenue");
  });
});

describe("reactionSession : l'exception /login ne déborde pas", () => {
  it("reconnaît le point d'entrée, avec ou sans query", () => {
    expect(reactionSession(401, "http://api.test/api/login")).toBe("conserver");
    expect(reactionSession(401, "http://api.test/api/login?x=1")).toBe("conserver");
  });

  it("ne s'applique pas à une route qui contiendrait seulement le mot", () => {
    // Sinon une vraie session morte resterait en place, sans rien dire.
    expect(reactionSession(401, "http://api.test/api/users/login-history")).toBe("deconnecter");
    expect(reactionSession(401, "http://api.test/api/logins")).toBe("deconnecter");
  });
});
