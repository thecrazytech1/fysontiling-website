// @vitest-environment jsdom
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Lightbox } from "@/components/lightbox";

const items = [
  { src: "/a.jpg", alt: "Green tiles", caption: "Green tiles" },
  { src: "/b.jpg", alt: "Grey floor", caption: "Grey floor" },
  { src: "/c.jpg", alt: "Brick pavers", caption: "Brick pavers" },
];

function Harness({ start = 0 }: { start?: number }) {
  const [index, setIndex] = useState<number | null>(start);
  return (
    <>
      <span data-testid="index">{index === null ? "closed" : index}</span>
      <Lightbox items={items} index={index} onIndexChange={setIndex} />
    </>
  );
}

describe("Lightbox", () => {
  it("shows the photo large with its caption and steps through the set", () => {
    render(<Harness />);
    expect(screen.getByRole("img", { name: "Green tiles" })).toHaveAttribute("src", "/a.jpg");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("img", { name: "Grey floor" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    // Wraps around at the ends.
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
    expect(screen.getByTestId("index")).toHaveTextContent("0");
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByTestId("index")).toHaveTextContent("2");
  });

  it("zooms to full size on click and closes with Escape", () => {
    render(<Harness start={1} />);
    const photo = screen.getByRole("img", { name: "Grey floor" });
    fireEvent.click(photo);
    expect(photo.className).toContain("max-w-none");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByTestId("index")).toHaveTextContent("closed");
  });
});
