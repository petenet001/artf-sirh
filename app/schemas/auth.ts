import { z } from "zod";
import { roleSchema } from "~/schemas/role";
import { permissionSchema } from "~/schemas/permission";

/** Identifiants de connexion. Sert aussi à valider le formulaire de login. */
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Utilisateur connecté (session courante), tel que renvoyé par UserResource.
 * `roles` est chargé avec ses permissions (`roles.permissions`) au login
 * et sur `/user` ; `permissions` directes ne sont remontées que si chargées.
 */
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  agent_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  roles: z.array(roleSchema).optional().default([]),
  permissions: z.array(permissionSchema).optional().default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

/** Réponse de connexion : utilisateur + token Sanctum. */
export const loginResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
