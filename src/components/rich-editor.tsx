import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cleanDoc, isSafeHref, type RichDoc } from "@/lib/rich-text";

// Only the formats the site renders: paragraphs, line breaks (Shift+Enter), bold,
// italic, links and lists. Headings, quotes, code and so on are switched off, and
// pasted content is reduced to these formats.
const extensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      isAllowedUri: (url) => isSafeHref(url),
    },
  }),
];

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "secondary" : "ghost"}
      className="size-8"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function editLink(editor: Editor) {
  const current = (editor.getAttributes("link")["href"] as string | undefined) ?? "";
  const entered = window.prompt(
    "Link address — a web page (https://…), email (mailto:…), phone (tel:…) or a page on this site (/contact). Leave empty to remove the link.",
    current,
  );
  if (entered === null) return;
  const href = entered.trim();
  if (!href) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  const withProtocol = /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href) ? `https://${href}` : href;
  if (!isSafeHref(withProtocol)) {
    window.alert("Links must start with https://, mailto:, tel: or / (a page on this site).");
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: withProtocol }).run();
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      link: e.isActive("link"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Link" active={state.link} onClick={() => editLink(editor)}>
        <Link2 />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        label="Bullet list"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        label="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <RemoveFormatting />
      </ToolbarButton>
      <ToolbarButton
        label="Undo"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

// Content styles mirror how the site shows rich text (see components/rich-text.tsx).
const contentClass = cn(
  "min-h-24 px-3 py-2 text-sm leading-7 focus:outline-none",
  "[&>*+*]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li+li]:mt-1",
  "[&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
);

export function RichEditor({
  initial,
  onChange,
  id,
}: {
  initial: RichDoc;
  onChange: (doc: RichDoc | null) => void;
  id?: string;
}) {
  const editor = useEditor({
    extensions,
    // RichDoc is a strict subset of the editor's JSON (optional fields differ only in typing).
    content: initial as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: contentClass, ...(id ? { id } : {}), "aria-multiline": "true" },
    },
    onUpdate: ({ editor: e }) => onChange(cleanDoc(e.getJSON())),
  });
  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      {editor ? <Toolbar editor={editor} /> : <div className="h-10 border-b border-border" />}
      <EditorContent editor={editor} />
    </div>
  );
}
