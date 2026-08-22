import { describe, it, expect } from "vitest";
import { compteIntegrationSchema, compteProvisionnerSchema } from "./compte-integration";

describe("compteIntegrationSchema", () => {
  const valid = {
    id: 1,
    agent_id: 7,
    login: "awa.diallo",
    email_professionnel: "awa.diallo@artf.ga",
  };

  it("valide un compte correct", () => {
    const parsed = compteIntegrationSchema.parse(valid);
    expect(parsed.id).toBe(1);
    expect(parsed.login).toBe("awa.diallo");
  });

  it("rejette un id manquant", () => {
    const { id: _id, ...sansId } = valid;
    expect(() => compteIntegrationSchema.parse(sansId)).toThrow();
  });

  it("compteProvisionnerSchema valide un input minimal", () => {
    const parsed = compteProvisionnerSchema.parse({ agent_id: 7 });
    expect(parsed.agent_id).toBe(7);
  });

  it("compteProvisionnerSchema rejette un agent_id manquant", () => {
    expect(() => compteProvisionnerSchema.parse({})).toThrow();
  });
});
