import { describe, it, expect } from "vitest";
import { notificationSchema } from "./notification";

describe("notificationSchema", () => {
  const valid = {
    id: "9b1f-uuid",
    type: "RhEvenementNotification",
    domaine: "integration",
    action: "validee_rh",
    message: "Le dossier a été validé par la RH.",
    data: { domaine: "integration", action: "validee_rh", dossier_id: 1 },
    lu: false,
    read_at: null,
    created_at: "2026-09-01T10:00:00Z",
  };

  it("valide une notification correcte", () => {
    const parsed = notificationSchema.parse(valid);
    expect(parsed.id).toBe("9b1f-uuid");
    expect(parsed.lu).toBe(false);
    expect(parsed.data?.dossier_id).toBe(1);
  });

  it("accepte une notification minimale (id + lu)", () => {
    const parsed = notificationSchema.parse({ id: "x", lu: true });
    expect(parsed.lu).toBe(true);
    expect(parsed.data).toBeUndefined();
  });

  it("garde l'id en string (UUID, jamais coercé en nombre)", () => {
    const parsed = notificationSchema.parse({ id: "123", lu: false });
    expect(parsed.id).toBe("123");
    expect(typeof parsed.id).toBe("string");
  });

  it("rejette un lu absent", () => {
    expect(() => notificationSchema.parse({ id: "x" })).toThrow();
  });

  it("rejette un lu non booléen", () => {
    expect(() => notificationSchema.parse({ id: "x", lu: "non" })).toThrow();
  });
});
