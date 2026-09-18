import { z } from "zod";
import { roleSchema } from "~/schemas/role";
import { permissionSchema } from "~/schemas/permission";
import { VUES_PERSONNEL } from "~/constants/enums";

/**
 * Bureau DRHL de rattachement (vague F). Chargé seulement si la relation l'est ;
 * `bureau_id`, lui, est toujours présent — `null` = accès non cloisonné
 * (admin, DG, et tout compte hors DRHL).
 */
export const bureauRattachementSchema = z.object({
  id: z.number(),
  nom: z.string(),
  sigle: z.string().nullable().optional(),
});

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
 *
 * Vague F : `bureau_id` porte le rattachement DRHL, `vue_personnel` le périmètre
 * qui en résulte. Ni l'un ni l'autre ne change les **droits** — les permissions
 * restent seules maîtresses de ce qui est permis — ils réduisent le
 * **périmètre** des listes renvoyées par l'API (agents, congés, absences,
 * sanctions). Le front ne refiltre donc rien : il l'affiche, pour que
 * l'utilisateur sache pourquoi sa liste est plus courte que celle d'un collègue.
 */
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  agent_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  bureau_id: z.number().nullable().optional(),
  bureau: bureauRattachementSchema.nullable().optional(),
  /**
   * Périmètre **effectif** sur le personnel, calculé par le serveur.
   *
   * À préférer toujours à une déduction locale depuis `bureau_id` ou les rôles :
   * depuis `consulter-agents-global`, un compte peut être rattaché à un bureau
   * **et** voir tout l'effectif. Déduire du rattachement ferait mentir l'écran.
   *
   * Optionnel par prudence : une API antérieure ne le renvoie pas.
   */
  vue_personnel: z.enum(VUES_PERSONNEL).nullable().optional(),
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
