// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import UploadZone from "./UploadZone.vue";

const fichier = () => new File(["x"], "piece.pdf", { type: "application/pdf" });

describe("BaseUploadZone", () => {
  it("émet `select` et conserve le fichier choisi", async () => {
    const wrapper = await mountSuspended(UploadZone);

    await wrapper.findComponent({ name: "UFileUpload" }).setValue(fichier());

    expect(wrapper.emitted("select")?.[0]?.[0]).toBeInstanceOf(File);
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBeInstanceOf(File);
  });

  it("vide la zone après la sélection quand `auto-reset` est posé", async () => {
    const wrapper = await mountSuspended(UploadZone, { props: { autoReset: true } });

    await wrapper.findComponent({ name: "UFileUpload" }).setValue(fichier());

    expect(wrapper.emitted("select")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBeNull();
  });
});
