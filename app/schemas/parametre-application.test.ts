import { describe, it, expect } from "vitest";
import {
  parametreApplicationSchema,
  parametreApplicationInputSchema,
} from "./parametre-application";

/** Calqué sur agent.test.ts. Reflète ParametreApplicationResource / ParametreApplication\CreateRequest. */
describe("parametreApplicationSchema", () => {
  const valid = {
    id: 1,
    cle: "logo_url",
    valeur: "https://example.test/logo.png",
    description: "URL du logo affiché dans l'en-tête",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("valide un paramètre correct", () => {
    const parsed = parametreApplicationSchema.parse(valid);
    expect(parsed.cle).toBe("logo_url");
  });

  it("accepte valeur et description nulles", () => {
    const parsed = parametreApplicationSchema.parse({
      ...valid,
      valeur: null,
      description: null,
    });
    expect(parsed.valeur).toBeNull();
    expect(parsed.description).toBeNull();
  });

  it("rejette une clé manquante", () => {
    const { cle: _omit, ...rest } = valid;
    expect(() => parametreApplicationSchema.parse(rest)).toThrow();
  });

  it("inputSchema exige cle et exclut id", () => {
    const shape = parametreApplicationInputSchema.shape;
    expect("cle" in shape).toBe(true);
    expect("id" in shape).toBe(false);
  });

  it("inputSchema valide un payload minimal", () => {
    const parsed = parametreApplicationInputSchema.parse({ cle: "logo_url" });
    expect(parsed.cle).toBe("logo_url");
  });
});
