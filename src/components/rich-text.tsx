import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  isSafeHref,
  parseRich,
  type RichBlock,
  type RichDoc,
  type RichInline,
} from "@/lib/rich-text";
import { useText } from "@/lib/site-content";
import type { RichKey } from "@/lib/site-text";

// Renders validated rich text as React elements (never raw HTML).
function Inline({ items = [] }: { items?: RichInline[] | undefined }) {
  return (
    <>
      {items.map((item, i) => {
        if (item.type === "hardBreak") return <br key={i} />;
        let node: ReactNode = item.text;
        for (const mark of item.marks ?? []) {
          if (mark.type === "bold")
            node = <strong className="font-semibold text-foreground">{node}</strong>;
          else if (mark.type === "italic") node = <em>{node}</em>;
          else if (isSafeHref(mark.attrs.href)) {
            const external = /^https?:\/\//i.test(mark.attrs.href);
            node = (
              <a
                href={mark.attrs.href}
                className="text-primary underline underline-offset-4"
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {node}
              </a>
            );
          }
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

function Block({ block }: { block: RichBlock }) {
  if (block.type === "paragraph") {
    return (
      <p>
        <Inline items={block.content} />
      </p>
    );
  }
  const List = block.type === "bulletList" ? "ul" : "ol";
  return (
    <List className={block.type === "bulletList" ? "list-disc pl-5" : "list-decimal pl-5"}>
      {block.content.map((item, i) => (
        <li key={i} className="mt-1 first:mt-0">
          {item.content.map((child, j) => (
            <Block key={j} block={child} />
          ))}
        </li>
      ))}
    </List>
  );
}

// Blocks are spaced like the site's existing paragraphs; the caller sets font and colour.
export function RichText({ doc, className }: { doc: RichDoc; className?: string | undefined }) {
  return (
    <div className={cn("[&>*+*]:mt-4", className)}>
      {doc.content.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

// Formatted page text Shaun edits in /admin. Renders a <div>, so use it in place of a <p>.
export function RichT({ k, className }: { k: RichKey; className?: string | undefined }) {
  return <RichText doc={parseRich(useText()(k))} className={className} />;
}
