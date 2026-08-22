import { describe, it, expect } from "vitest";
import { auditLogSchema } from "./audit-log";

/** Calqué sur agent.test.ts. Reflète AuditLogResource. */
describe("auditLogSchema", () => {
  const valid = {
    id: 1,
    action: "user.created",
    user_id: 7,
    loggable_type: "App\\Models\\User",
    loggable_id: 12,
    details: { before: null, after: { name: "Awa" } },
    ip_address: "192.168.1.10",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("valide une entrée correcte", () => {
    const parsed = auditLogSchema.parse(valid);
    expect(parsed.action).toBe("user.created");
    expect(parsed.user_id).toBe(7);
  });

  it("accepte user chargé à la place de user_id", () => {
    const parsed = auditLogSchema.parse({
      ...valid,
      user_id: undefined,
      user: { id: 7, name: "Awa", email: "awa@example.test" },
    });
    expect(parsed.user?.email).toBe("awa@example.test");
  });

  it("accepte des champs nullables à null", () => {
    const parsed = auditLogSchema.parse({
      id: 1,
      action: "login",
      user_id: null,
      loggable_type: null,
      loggable_id: null,
      details: null,
      ip_address: null,
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(parsed.loggable_type).toBeNull();
  });

  it("rejette une action manquante", () => {
    const { action: _omit, ...rest } = valid;
    expect(() => auditLogSchema.parse(rest)).toThrow();
  });
});
