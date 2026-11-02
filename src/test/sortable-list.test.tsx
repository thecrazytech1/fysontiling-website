// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SortableList } from "@/components/sortable-list";

const items = [
  { id: "a", name: "Bathrooms" },
  { id: "b", name: "Splashbacks" },
  { id: "c", name: "Floors" },
];

describe("SortableList", () => {
  it("gives every item a drag handle and reorders with the keyboard", async () => {
    // jsdom has no layout, so give each item a box stacked top to bottom.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const index = items.findIndex((item) => this.textContent?.includes(item.name));
      const top = Math.max(index, 0) * 60;
      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: 300,
        bottom: top + 50,
        width: 300,
        height: 50,
        toJSON: () => ({}),
      } as DOMRect;
    });
    const onReorder = vi.fn();
    render(
      <SortableList items={items} label={(item) => item.name} onReorder={onReorder}>
        {(item, handle) => (
          <div>
            {handle}
            {item.name}
          </div>
        )}
      </SortableList>,
    );
    const handle = screen.getByRole("button", { name: "Drag to reorder: Bathrooms" });
    expect(screen.getAllByRole("button", { name: /Drag to reorder/ })).toHaveLength(3);
    handle.focus();
    // dnd-kit measures and moves asynchronously; let it settle between key presses.
    const press = async (code: string) =>
      act(async () => {
        fireEvent.keyDown(handle, { code });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    await press("Space");
    await press("ArrowDown");
    await press("Space");
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);
  });
});
