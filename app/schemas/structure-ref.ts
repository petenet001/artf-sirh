import { z } from "zod";

/**
 * Référence minimale d'une structure organisationnelle.
 * Utilisé pour TOUTES les relations imbriquées entre structures
 * (localite ↔ administration ↔ direction ↔ service ↔ bureau) afin
 * d'éviter une récursion de types TS. Les clés étrangères `*_id`
 * restent des `z.number()` dans les schémas complets.
 */
export const structureRefSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type StructureRef = z.infer<typeof structureRefSchema>;
