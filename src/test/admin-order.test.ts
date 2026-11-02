import { describe, expect, it } from "vitest";
import { placeInSlots, withOrder } from "@/lib/admin-order";

describe("Drag-and-drop ordering", () => {
  it("moves a filtered category's photos only among their own positions", () => {
    // a/c/e are bathrooms, b/d are splashbacks; drag e to the top of bathrooms.
    expect(placeInSlots(["a", "b", "c", "d", "e"], ["e", "a", "c"])).toEqual([
      "e",
      "b",
      "a",
      "d",
      "c",
    ]);
    expect(placeInSlots(["a", "b", "c"], ["c", "b", "a"])).toEqual(["c", "b", "a"]);
  });

  it("applies a new order to the cached lists straight away", () => {
    const content = {
      projects: [
        { id: "p1", sort_order: 0 },
        { id: "p2", sort_order: 1 },
      ],
      photos: [
        { id: "x", sort_order: 0, gallery_order: 5 },
        { id: "y", sort_order: 1, gallery_order: 5 },
      ],
      faqs: [],
      categories: [],
      text: [],
    } as unknown as Parameters<typeof withOrder>[0];
    expect(withOrder(content, "projects", ["p2", "p1"]).projects.map((p) => p.id)).toEqual([
      "p2",
      "p1",
    ]);
    const gallery = withOrder(content, "gallery", ["y", "x"]).photos;
    expect(gallery.map((p) => [p.id, p.gallery_order, p.sort_order])).toEqual([
      ["x", 1, 0],
      ["y", 0, 1],
    ]);
  });
});
