import { describe, it, expect } from "vitest";
import { userSchema } from "./auth";

/** Forme de `GET /user` depuis 2026-10-01 (UserResource : structure, fonction, chaîne du bureau). */
describe("userSchema — contexte de structure", () => {
  const chef = {
    id: 7,
    name: "Chef Service",
    email: "chef-service@artf.cg",
    agent_id: 21,
    is_active: true,
    bureau_id: 3,
    vue_personnel: "service",
    bureau: {
      id: 3,
      nom: "Bureau Personnel",
      sigle: "B.P",
      service: {
        id: 2,
        nom: "Service des Ressources Humaines",
        sigle: "S.R.H",
        direction: { id: 1, nom: "Direction des Ressources Humaines et de la Logistique", sigle: "DRHL" },
      },
    },
    structure: { id: 2, nom: "Service des Ressources Humaines", sigle: "S.R.H", type: "service" },
    fonction: { id: 4, nom: "Chef de service", sigle: "C.S" },
    roles: [],
  };

  it("accepte la chaîne bureau → service → direction", () => {
    const u = userSchema.parse(chef);
    expect(u.bureau?.service?.direction?.sigle).toBe("DRHL");
  });

  it("expose la structure du périmètre et la fonction", () => {
    const u = userSchema.parse(chef);
    expect(u.structure?.type).toBe("service");
    expect(u.fonction?.nom).toBe("Chef de service");
  });

  it("tolère un compte en vue globale sans rattachement", () => {
    const u = userSchema.parse({
      ...chef,
      bureau_id: null,
      bureau: null,
      structure: null,
      fonction: null,
      vue_personnel: "globale",
    });
    expect(u.structure).toBeNull();
  });

  it("tolère une réponse antérieure sans ces champs", () => {
    const u = userSchema.parse({ id: 1, name: "Admin", email: "admin@artf.cg" });
    expect(u.structure).toBeUndefined();
  });

  it("rejette un type de structure inconnu", () => {
    expect(() => userSchema.parse({ ...chef, structure: { ...chef.structure, type: "pole" } })).toThrow();
  });
});
