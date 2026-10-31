import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { builtInRows } from "@/lib/site-data";
import { assembleContent, type ContentRows, type SiteContent } from "@/lib/site-content";

export const storageBase = () =>
  (process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || "").replace(/\/$/, "");

// Public reads go through the publishable key, so row-level security decides what
// visitors see (unpublished projects stay hidden even if a query is wrong).
function publicClient() {
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";
  return createClient<Database>(storageBase(), key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function readRows(): Promise<ContentRows> {
  const db = publicClient();
  const [projects, photos, faqs, text] = await Promise.all([
    db
      .from("site_projects")
      .select(
        "id, slug, title, publication, intro, cover_photo_id, cover_focus, sort_order, published",
      ),
    db
      .from("site_photos")
      .select(
        "id, project_id, src, caption, category, magazine_page, category_cover, focus, sort_order, gallery_order",
      ),
    db.from("site_faqs").select("id, question, answer, sort_order"),
    db.from("site_text").select("key, value"),
  ]);
  const error = projects.error ?? photos.error ?? faqs.error ?? text.error;
  if (error) throw new Error(error.message);
  return {
    projects: projects.data ?? [],
    photos: photos.data ?? [],
    faqs: faqs.data ?? [],
    text: text.data ?? [],
  };
}

// Every page render needs the content, so keep it in memory briefly. Admin edits
// clear it straight away, so Shaun sees his change on the next page load.
const cacheMs = 60_000;
let cached: { at: number; content: Promise<SiteContent> } | undefined;

export function invalidateSiteContent() {
  cached = undefined;
}

export function loadSiteContent(): Promise<SiteContent> {
  if (cached && Date.now() - cached.at < cacheMs) return cached.content;
  const content = readRows()
    .then((rows) => assembleContent(rows, storageBase()))
    .catch((error: unknown) => {
      // Never take the site down over content: show what it shipped with and retry soon.
      console.error("[content] Falling back to built-in content:", error);
      cached = undefined;
      return assembleContent(builtInRows, storageBase());
    });
  cached = { at: Date.now(), content };
  return content;
}
