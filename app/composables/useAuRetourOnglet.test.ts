// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";

/**
 * Le circuit d'un congé doit se relire quand on revient sur l'onglet : une
 * campagne close ailleurs doit faire apparaître le bouton du N+1 sans
 * rechargement complet.
 */

function definirVisibilite(etat: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => etat });
  document.dispatchEvent(new Event("visibilitychange"));
}

function monter(action: () => void) {
  return mountSuspended(
    defineComponent({
      setup() {
        useAuRetourOnglet(action);
        return () => h("div");
      },
    }),
  );
}

afterEach(() => definirVisibilite("visible"));

describe("useAuRetourOnglet", () => {
  it("relance l'action au retour sur l'onglet, pas au départ", async () => {
    const action = vi.fn();
    const wrapper = await monter(action);

    definirVisibilite("hidden");
    expect(action).not.toHaveBeenCalled();

    definirVisibilite("visible");
    expect(action).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it("ne relance plus rien une fois l'écran quitté", async () => {
    const action = vi.fn();
    const wrapper = await monter(action);
    wrapper.unmount();

    definirVisibilite("visible");
    expect(action).not.toHaveBeenCalled();
  });
});
