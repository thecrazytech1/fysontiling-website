import { describe, expect, it } from "vitest";
import { builtInRows } from "@/lib/site-data";
import { assembleContent } from "@/lib/site-content";
import { imageDefaults } from "@/lib/site-images";

describe("Page photos", () => {
  it("use Shaun's chosen photo and crop, and the original when none is chosen", () => {
    const photo = builtInRows.photos.find((p) => p.src === "asset:mt-martha-5.jpg")!;
    const rows = {
      ...builtInRows,
      images: [
        { key: "home.hero", photo_id: photo.id, focus: "center top" },
        // A chosen photo that has since been deleted (or an unknown slot) is ignored.
        { key: "about.photo", photo_id: "gone", focus: null },
        { key: "not.a.slot", photo_id: photo.id, focus: null },
      ],
    };
    const { images } = assembleContent(rows, "");
    expect(images["home.hero"]?.url).toContain("mt-martha-5");
    expect(images["home.hero"]?.focus).toBe("center top");
    expect(images["about.photo"]).toBeUndefined();
    expect(Object.keys(images)).toEqual(["home.hero"]);
  });

  it("every slot has a built-in photo", () => {
    for (const [key, slot] of Object.entries(imageDefaults)) expect(slot.image, key).toBeTruthy();
  });
});
