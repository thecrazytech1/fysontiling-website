import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin.functions";
import { galleryCategories, photoBucket } from "@/lib/site-content";
import { isTextKey } from "@/lib/site-text";

// Public: the content every page renders (cached on the server, see content.server.ts).
export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const { loadSiteContent } = await import("@/lib/content.server");
  return loadSiteContent();
});

// Everything below is for /admin only.

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function check<T>({ data, error }: { data: T; error: { message: string; code?: string } | null }) {
  if (error)
    throw new Error(
      error.code === "23505"
        ? "That web address is already used by another project."
        : error.message,
    );
  return data;
}

// Every edit refreshes what visitors see.
async function changed<T>(result: T) {
  const { invalidateSiteContent } = await import("@/lib/content.server");
  invalidateSiteContent();
  return result;
}

const id = z.string().uuid();
const category = z.enum(galleryCategories).nullable();
const focus = z.enum(["center", "top", "bottom", "center top", "center bottom"]);

export const getAdminContent = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const supabase = await db();
    const { storageBase } = await import("@/lib/content.server");
    const { photoUrl } = await import("@/lib/site-content");
    const [projects, photos, faqs, text] = await Promise.all([
      supabase
        .from("site_projects")
        .select(
          "id, slug, title, publication, intro, cover_photo_id, cover_focus, sort_order, published",
        )
        .order("sort_order"),
      supabase
        .from("site_photos")
        .select(
          "id, project_id, src, caption, category, magazine_page, category_cover, focus, sort_order, gallery_order",
        )
        .order("sort_order"),
      supabase.from("site_faqs").select("id, question, answer, sort_order").order("sort_order"),
      supabase.from("site_text").select("key, value"),
    ]);
    const base = storageBase();
    return {
      projects: check(projects) ?? [],
      photos: (check(photos) ?? []).map((photo) => ({ ...photo, url: photoUrl(photo.src, base) })),
      faqs: check(faqs) ?? [],
      text: check(text) ?? [],
    };
  });

// ---- Projects

export const saveProject = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: id.optional(),
        slug: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .regex(
            /^[a-z0-9]+(-[a-z0-9]+)*$/,
            "The web address can only use lower-case letters, numbers and dashes.",
          ),
        title: z.string().trim().min(2).max(120),
        publication: z.string().trim().max(120),
        intro: z.string().trim().max(2000),
        coverFocus: focus,
        published: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await db();
    const fields = {
      slug: data.slug,
      title: data.title,
      publication: data.publication,
      intro: data.intro,
      cover_focus: data.coverFocus,
      published: data.published,
    };
    if (data.id) {
      check(await supabase.from("site_projects").update(fields).eq("id", data.id));
      return changed({ id: data.id });
    }
    // New projects go first, so the latest work leads on the home page.
    const first = check(
      await supabase.from("site_projects").select("sort_order").order("sort_order").limit(1),
    );
    const sortOrder = (first?.[0]?.sort_order ?? 0) - 1;
    const created = check(
      await supabase
        .from("site_projects")
        .insert({ ...fields, sort_order: sortOrder })
        .select("id")
        .single(),
    );
    if (!created) throw new Error("The project could not be created.");
    return changed({ id: created.id });
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ data }) => {
    const supabase = await db();
    const photos =
      check(await supabase.from("site_photos").select("src").eq("project_id", data.id)) ?? [];
    check(await supabase.from("site_projects").delete().eq("id", data.id));
    await removeUploads(photos.map((photo) => photo.src));
    return changed({ success: true });
  });

export const setProjectCover = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ projectId: id, photoId: id }).parse(data))
  .handler(async ({ data }) => {
    check(
      await (
        await db()
      )
        .from("site_projects")
        .update({ cover_photo_id: data.photoId })
        .eq("id", data.projectId),
    );
    return changed({ success: true });
  });

// ---- Photos

const orderLists = ["projects", "project-photos", "gallery", "faqs"] as const;

// Saves a new order after Shaun moves something up or down: ids are in display order.
export const saveOrder = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z.object({ list: z.enum(orderLists), ids: z.array(id).max(500) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await db();
    const results = await Promise.all(
      data.ids.map((rowId, index) => {
        if (data.list === "projects")
          return supabase.from("site_projects").update({ sort_order: index }).eq("id", rowId);
        if (data.list === "faqs")
          return supabase.from("site_faqs").update({ sort_order: index }).eq("id", rowId);
        if (data.list === "gallery")
          return supabase.from("site_photos").update({ gallery_order: index }).eq("id", rowId);
        return supabase.from("site_photos").update({ sort_order: index }).eq("id", rowId);
      }),
    );
    results.forEach(check);
    return changed({ success: true });
  });

export const updatePhoto = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z
      .object({
        id,
        caption: z.string().trim().max(400),
        category,
        magazinePage: z.boolean(),
        categoryCover: z.boolean(),
        focus,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await db();
    const categoryCover = data.categoryCover && data.category !== null && !data.magazinePage;
    // One cover photo per gallery category.
    if (categoryCover)
      check(
        await supabase
          .from("site_photos")
          .update({ category_cover: false })
          .eq("category", data.category ?? "")
          .neq("id", data.id),
      );
    check(
      await supabase
        .from("site_photos")
        .update({
          caption: data.caption,
          category: data.magazinePage ? null : data.category,
          magazine_page: data.magazinePage,
          category_cover: categoryCover,
          focus: data.focus,
        })
        .eq("id", data.id),
    );
    return changed({ success: true });
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ data }) => {
    const supabase = await db();
    const photo = check(
      await supabase.from("site_photos").select("src").eq("id", data.id).maybeSingle(),
    );
    check(await supabase.from("site_photos").delete().eq("id", data.id));
    if (photo) await removeUploads([photo.src]);
    return changed({ success: true });
  });

async function removeUploads(srcs: string[]) {
  const paths = srcs
    .filter((src) => src.startsWith("storage:"))
    .map((src) => src.slice("storage:".length));
  if (paths.length === 0) return;
  const { error } = await (await db()).storage.from(photoBucket).remove(paths);
  // The row is already gone, so a leftover file is only wasted space; don't fail the delete.
  if (error) console.error("[content] Could not remove uploaded photos:", error.message);
}

const uploadTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const maxUploadBytes = 15 * 1024 * 1024;

// The admin page shrinks photos in the browser before sending them, so these are small.
export const uploadPhoto = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Expected a photo upload.");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("No photo was attached.");
    if (!uploadTypes[file.type]) throw new Error("Photos must be JPEG, PNG or WebP.");
    if (file.size > maxUploadBytes) throw new Error("That photo is too large (15 MB at most).");
    const fields = z
      .object({
        projectId: id.nullable(),
        category,
        caption: z.string().trim().max(400),
      })
      .parse({
        projectId: data.get("projectId") || null,
        category: data.get("category") || null,
        caption: data.get("caption") ?? "",
      });
    return { ...fields, file };
  })
  .handler(async ({ data }) => {
    if (data.projectId === null && data.category === null)
      throw new Error("Choose a gallery category for this photo.");
    const supabase = await db();
    const path = `${data.projectId ? `projects/${data.projectId}` : "gallery"}/${crypto.randomUUID()}.${uploadTypes[data.file.type]}`;
    const upload = await supabase.storage
      .from(photoBucket)
      .upload(path, await data.file.arrayBuffer(), {
        contentType: data.file.type,
        cacheControl: "31536000",
      });
    if (upload.error) throw new Error(`The photo could not be stored: ${upload.error.message}`);
    // New project photos go after the existing ones; new gallery photos lead the gallery.
    const lastInProject = data.projectId
      ? check(
          await supabase
            .from("site_photos")
            .select("sort_order")
            .eq("project_id", data.projectId)
            .order("sort_order", { ascending: false })
            .limit(1),
        )
      : null;
    const firstInGallery = check(
      await supabase.from("site_photos").select("gallery_order").order("gallery_order").limit(1),
    );
    const inserted = await supabase.from("site_photos").insert({
      project_id: data.projectId,
      src: `storage:${path}`,
      caption: data.caption,
      category: data.category,
      sort_order: (lastInProject?.[0]?.sort_order ?? -1) + 1,
      gallery_order: (firstInGallery?.[0]?.gallery_order ?? 0) - 1,
    });
    if (inserted.error) {
      await supabase.storage.from(photoBucket).remove([path]);
      throw new Error(inserted.error.message);
    }
    return changed({ success: true });
  });

// ---- FAQs

export const saveFaq = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: id.optional(),
        question: z.string().trim().min(3).max(300),
        answer: z.string().trim().min(3).max(3000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await db();
    if (data.id) {
      check(
        await supabase
          .from("site_faqs")
          .update({ question: data.question, answer: data.answer })
          .eq("id", data.id),
      );
    } else {
      const last = check(
        await supabase
          .from("site_faqs")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1),
      );
      check(
        await supabase.from("site_faqs").insert({
          question: data.question,
          answer: data.answer,
          sort_order: (last?.[0]?.sort_order ?? -1) + 1,
        }),
      );
    }
    return changed({ success: true });
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ data }) => {
    check(await (await db()).from("site_faqs").delete().eq("id", data.id));
    return changed({ success: true });
  });

// ---- Page text

const textKey = z.string().refine(isTextKey, "Unknown page text.");

export const saveText = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z.object({ key: textKey, value: z.string().trim().min(1).max(3000) }).parse(data),
  )
  .handler(async ({ data }) => {
    check(
      await (
        await db()
      )
        .from("site_text")
        .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() }),
    );
    return changed({ success: true });
  });

export const resetText = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ key: textKey }).parse(data))
  .handler(async ({ data }) => {
    check(await (await db()).from("site_text").delete().eq("key", data.key));
    return changed({ success: true });
  });
