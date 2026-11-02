// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Editor } from "@tiptap/react";
import { cleanDoc, parseRich, plainToDoc, richDocSchema, richToPlain } from "@/lib/rich-text";
import { InlineRich, RichText } from "@/components/rich-text";
import StarterKit from "@tiptap/starter-kit";

describe("Rich page text", () => {
  it("turns the plain-text defaults into paragraphs and line breaks", () => {
    const doc = plainToDoc("First line\nsecond line\n\nNew paragraph");
    expect(doc.content).toHaveLength(2);
    expect(richToPlain(doc)).toBe("First line\nsecond line\n\nNew paragraph");
    expect(parseRich("Not JSON {")).toEqual(plainToDoc("Not JSON {"));
  });

  it("strips unsafe links and unknown marks, and rejects unsupported blocks", () => {
    const link = (href: string) => ({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href } }] }],
        },
      ],
    });
    const marksOf = (href: string) => richDocSchema.parse(link(href)).content[0];
    // An unsafe link is removed; its text stays.
    expect(marksOf("javascript:alert(1)")).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "x", marks: [] }],
    });
    expect(JSON.stringify(marksOf("//evil.example"))).not.toContain("evil");
    expect(JSON.stringify(marksOf("https://example.com"))).toContain("https://example.com");
    expect(JSON.stringify(marksOf("/contact"))).toContain("/contact");
    expect(
      richDocSchema.safeParse({ type: "doc", content: [{ type: "heading", content: [] }] }).success,
    ).toBe(false);
    const struck = richDocSchema.parse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "strike" }, { type: "bold" }] }],
        },
      ],
    });
    expect(struck.content[0]).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "x", marks: [{ type: "bold" }] }],
    });
  });

  it("reduces pasted HTML in the real editor to the formats the site stores", () => {
    // Same configuration as the admin editor.
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          code: false,
          codeBlock: false,
          horizontalRule: false,
          strike: false,
          underline: false,
        }),
      ],
      content:
        '<h1>Title</h1><p style="color:red">Hi <strong>bold</strong> <em>it</em> <a href="https://fysontiling.com.au">site</a> <a href="javascript:alert(1)">bad</a></p><script>alert(1)</script><ul><li><p>one</p></li></ul>',
    });
    const doc = cleanDoc(editor.getJSON());
    editor.destroy();
    expect(doc).not.toBeNull();
    const text = richToPlain(doc!);
    expect(text).toContain("Title");
    expect(text).toContain("• one");
    expect(text).not.toContain("alert");
    const json = JSON.stringify(doc);
    expect(json).not.toContain("javascript");
    expect(json).not.toContain("color");

    const { container } = render(<RichText doc={doc!} />);
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("it");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://fysontiling.com.au");
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector("ul li")?.textContent).toBe("one");
    expect(container.querySelector("script, h1, [style]")).toBeNull();
  });

  it("renders headings inline: line breaks kept, formatting allowed, no paragraphs", () => {
    const heading = parseRich("LET’S MAKE\nIT HAPPEN.");
    const { container } = render(
      <h1>
        <InlineRich doc={heading} />
      </h1>,
    );
    expect(container.querySelector("h1")?.innerHTML).toBe("LET’S MAKE<br>IT HAPPEN.");
    const formatted = richDocSchema.parse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "FYSON ", marks: [{ type: "bold" }] },
            { type: "text", text: "TILING." },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: "Second line" }] },
      ],
    });
    const second = render(
      <h2>
        <InlineRich doc={formatted} />
      </h2>,
    ).container.querySelector("h2");
    expect(second?.innerHTML).toBe(
      '<strong class="font-semibold text-foreground">FYSON </strong>TILING.<br>Second line',
    );
    expect(second?.querySelector("p")).toBeNull();
  });

  it("keeps lists out of the heading editor, even when pasted", () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
          heading: false,
        }),
      ],
      content: "<ul><li><p>one</p></li><li><p>two</p></li></ul>",
    });
    const doc = cleanDoc(editor.getJSON());
    editor.destroy();
    expect(doc?.content.every((block) => block.type === "paragraph")).toBe(true);
    expect(richToPlain(doc!)).toContain("one");
  });
});

describe("Page text defaults", () => {
  it("every default is valid text, and the review note keeps its Google link", async () => {
    const { textDefaults } = await import("@/lib/site-text");
    for (const [key, field] of Object.entries(textDefaults)) {
      const doc = parseRich(field.value);
      expect(richToPlain(doc).trim(), key).not.toBe("");
      if (field.kind !== "rich")
        expect(
          doc.content.every((b) => b.type === "paragraph"),
          key,
        ).toBe(true);
    }
    const note = parseRich(textDefaults["reviewsPage.formNote"].value);
    expect(JSON.stringify(note)).toContain("g.page");
    expect(richToPlain(note)).toContain("Leave it on Google too.");
  });
});
