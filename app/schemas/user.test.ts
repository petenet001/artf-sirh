import { describe, it, expect } from "vitest";
import { userInputSchema } from "./user";

/** Calqué sur agent.test.ts. Reflète User\CreateRequest. */
describe("userInputSchema", () => {
  const valid = {
    name: "Awa Diallo",
    email: "awa@example.test",
    password: "motdepasse",
    role: "admin",
    agent_id: 12,
    is_active: true,
  };

  it("valide un payload de création complet", () => {
    const parsed = userInputSchema.parse(valid);
    expect(parsed.email).toBe("awa@example.test");
  });

  it("valide un payload minimal (name + email + password)", () => {
    const parsed = userInputSchema.parse({
      name: "Awa Diallo",
      email: "awa@example.test",
      password: "motdepasse",
    });
    expect(parsed.name).toBe("Awa Diallo");
  });

  it("expose les champs attendus et exclut id", () => {
    const shape = userInputSchema.shape;
    expect("name" in shape).toBe(true);
    expect("email" in shape).toBe(true);
    expect("password" in shape).toBe(true);
    expect("role" in shape).toBe(true);
    expect("agent_id" in shape).toBe(true);
    expect("is_active" in shape).toBe(true);
    expect("id" in shape).toBe(false);
  });

  it("rejette un email invalide", () => {
    expect(() => userInputSchema.parse({ ...valid, email: "pasunemail" })).toThrow();
  });

  it("rejette un mot de passe trop court", () => {
    expect(() => userInputSchema.parse({ ...valid, password: "court" })).toThrow();
  });
});
