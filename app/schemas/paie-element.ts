import { z } from "zod";
import {
  NATURES_PAIE_ELEMENT,
  SENS_PAIE_ELEMENT,
  PERIODICITES_PAIE_ELEMENT,
  MODES_CALCUL_PAIE_ELEMENT,
} from "~/constants/enums";

/**
 * Élément de paie (référentiel, CCN art. 54–59).
 *
 * `systeme: true` = code conventionnel : ni suppression, ni changement de
 * `code` / `nature` / `mode_calcul` (422). `a_parametrer` signale qu'il manque
 * le montant ou le taux que seul le comité de direction fixe — dans ce cas
 * `montant_defaut` / `taux_defaut` restent `null` : **ne rien inventer**.
 *
 * `sens` est dérivé de `nature` côté serveur, jamais saisi.
 */
export const paieElementSchema = z.object({
  id: z.number(),
  code: z.string(),
  libelle: z.string(),
  nature: z.enum(NATURES_PAIE_ELEMENT).nullable().optional(),
  nature_label: z.string().nullable().optional(),
  sens: z.enum(SENS_PAIE_ELEMENT).nullable().optional(),
  sens_label: z.string().nullable().optional(),
  periodicite: z.enum(PERIODICITES_PAIE_ELEMENT).nullable().optional(),
  periodicite_label: z.string().nullable().optional(),
  mode_calcul: z.enum(MODES_CALCUL_PAIE_ELEMENT).nullable().optional(),
  mode_calcul_label: z.string().nullable().optional(),
  montant_defaut: z.number().nullable().optional(),
  taux_defaut: z.number().nullable().optional(),
  article_ccn: z.string().nullable().optional(),
  /** Sigles de fonction éligibles (ex. `["DD"]` pour l'indemnité de représentation). */
  fonction_sigles: z.array(z.string()).nullable().optional(),
  /** Mois de déclenchement d'un élément saisonnier (1–12). */
  mois_declenchement: z.array(z.number()).nullable().optional(),
  actif: z.boolean().optional(),
  systeme: z.boolean().optional(),
  a_parametrer: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PaieElement = z.infer<typeof paieElementSchema>;

/**
 * Création / modification. ⚠️ `POST` n'accepte qu'un élément **maison** : un
 * code CCN est refusé (422). `sens` n'est pas saisissable.
 */
export const paieElementInputSchema = z.object({
  code: z
    .string()
    .min(1, "Code requis")
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "Minuscules, chiffres et tirets bas ; commence par une lettre"),
  libelle: z.string().min(1, "Libellé requis").max(255),
  nature: z.enum(NATURES_PAIE_ELEMENT),
  periodicite: z.enum(PERIODICITES_PAIE_ELEMENT),
  mode_calcul: z.enum(MODES_CALCUL_PAIE_ELEMENT),
  montant_defaut: z.coerce.number().min(0).nullish(),
  taux_defaut: z.coerce.number().min(0).max(100).nullish(),
  article_ccn: z.string().max(20).nullish(),
  fonction_sigles: z.array(z.string().max(10)).nullish(),
  mois_declenchement: z.array(z.coerce.number().min(1).max(12)).nullish(),
  actif: z.boolean().nullish(),
});

export type PaieElementInput = z.infer<typeof paieElementInputSchema>;
