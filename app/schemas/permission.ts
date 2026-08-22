import { z } from "zod";

/** Permission (guard `api`). Forme renvoyée par PermissionResource. */
export const permissionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type Permission = z.infer<typeof permissionSchema>;
