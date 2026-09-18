import type { PriseEnCharge, PriseEnChargeInput } from "~/schemas/prise-en-charge";

/**
 * Repository Prises en charge de frais médicaux
 * (`/affaires-sociales/prises-en-charge`, D.3.5, art. 122–127).
 *
 * Filtres serveur : `agent_id`, `type`, `statut`.
 */
export function usePrisesEnChargeApi() {
  return dossierSocialApi<PriseEnCharge, PriseEnChargeInput>("prises-en-charge");
}
