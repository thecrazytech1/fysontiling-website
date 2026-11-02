import { z } from "zod";

// Formatted page text, stored as the editor's JSON document. Only the formats the site's
// design allows survive validation: paragraphs, line breaks, bold, italic, links and lists.
// Anything else (styles, scripts, headings, images) is dropped, so the site can render it
// without ever injecting HTML.

export type RichMark =
  { type: "bold" } | { type: "italic" } | { type: "link"; attrs: { href: string } };
export type RichInline =
  { type: "text"; text: string; marks?: RichMark[] | undefined } | { type: "hardBreak" };
export type RichParagraph = { type: "paragraph"; content?: RichInline[] | undefined };
export type RichList = { type: "bulletList" | "orderedList"; content: RichListItem[] };
export type RichListItem = { type: "listItem"; content: Array<RichParagraph | RichList> };
export type RichBlock = RichParagraph | RichList;
export type RichDoc = { type: "doc"; content: RichBlock[] };

// Web, email, phone and on-site links only (no javascript: or protocol-relative URLs).
export const isSafeHref = (href: string) =>
  /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(href.trim());

// Validators read unknown JSON and return the cleaned-up document.
type Schema<T> = z.ZodType<T, z.ZodTypeDef, unknown>;

const mark: Schema<RichMark> = z.union([
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({
    type: z.literal("link"),
    attrs: z.object({
      href: z
        .string()
        .max(500)
        .refine(isSafeHref, "Links must start with https://, mailto:, tel: or /"),
    }),
  }),
]);
// Marks the site doesn't support (e.g. from a paste) are dropped rather than rejected.
const marks = z
  .array(z.unknown())
  .max(5)
  .transform((list) =>
    list.flatMap((m) => {
      const parsed = mark.safeParse(m);
      return parsed.success ? [parsed.data] : [];
    }),
  );
const inline: Schema<RichInline> = z.union([
  z.object({ type: z.literal("text"), text: z.string().max(5000), marks: marks.optional() }),
  z.object({ type: z.literal("hardBreak") }),
]);
const paragraph: Schema<RichParagraph> = z.object({
  type: z.literal("paragraph"),
  content: z.array(inline).max(500).optional(),
});
const list: Schema<RichList> = z.lazy(() =>
  z.object({
    type: z.enum(["bulletList", "orderedList"]),
    content: z.array(listItem).min(1).max(100),
  }),
);
const listItem: Schema<RichListItem> = z.lazy(() =>
  z.object({
    type: z.literal("listItem"),
    content: z
      .array(z.union([paragraph, list]))
      .min(1)
      .max(20),
  }),
);
export const richDocSchema: Schema<RichDoc> = z.object({
  type: z.literal("doc"),
  content: z
    .array(z.union([paragraph, list]))
    .min(1)
    .max(100),
});

// Plain text (the built-in defaults): a blank line starts a paragraph, a line break stays.
export function plainToDoc(text: string): RichDoc {
  return {
    type: "doc",
    content: text.split(/\n{2,}/).map((block): RichParagraph => {
      const lines = block.split("\n");
      const content = lines.flatMap((line, i): RichInline[] => [
        ...(i > 0 ? [{ type: "hardBreak" } as const] : []),
        ...(line ? [{ type: "text", text: line } as const] : []),
      ]);
      return content.length ? { type: "paragraph", content } : { type: "paragraph" };
    }),
  };
}

// Stored values are either a saved document (JSON) or plain text.
export function parseRich(value: string): RichDoc {
  if (value.startsWith("{")) {
    try {
      const parsed = richDocSchema.safeParse(JSON.parse(value));
      if (parsed.success) return parsed.data;
    } catch {
      // Not JSON after all: treat it as plain text.
    }
  }
  return plainToDoc(value);
}

export function richToPlain(doc: RichDoc): string {
  const inlineText = (items: RichInline[] = []) =>
    items.map((item) => (item.type === "text" ? item.text : "\n")).join("");
  const block = (b: RichBlock): string =>
    b.type === "paragraph"
      ? inlineText(b.content)
      : b.content.map((item) => `• ${item.content.map(block).join("\n")}`).join("\n");
  return doc.content.map(block).join("\n\n");
}

// The editor's JSON carries extra attributes; keep only what the site stores.
export const cleanDoc = (json: unknown): RichDoc | null => {
  const parsed = richDocSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
};
