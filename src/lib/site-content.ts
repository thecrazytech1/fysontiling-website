import { Fragment } from "react";
import { createElement, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { bundledAssetUrl } from "@/lib/site-data";
import { textDefaults, type TextKey } from "@/lib/site-text";

// Rows as stored in the site_* tables (see drizzle/schema.ts).
export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  publication: string;
  intro: string;
  cover_photo_id: string | null;
  cover_focus: string;
  sort_order: number;
  published: boolean;
};
export type PhotoRow = {
  id: string;
  project_id: string | null;
  src: string;
  caption: string;
  category: string | null;
  magazine_page: boolean;
  category_cover: boolean;
  focus: string;
  sort_order: number;
  gallery_order: number;
};
export type FaqRow = { id: string; question: string; answer: string; sort_order: number };
export type TextRow = { key: string; value: string };
export type ContentRows = {
  projects: ProjectRow[];
  photos: PhotoRow[];
  faqs: FaqRow[];
  text: TextRow[];
};

// Shapes the pages render.
export type ProjectPhoto = { url: string; caption: string };
export type Project = {
  slug: string;
  title: string;
  publication: string;
  intro: string;
  cover: string | undefined;
  coverFocus: string;
  // Printed magazine pages first, then the project's own photographs.
  photos: ProjectPhoto[];
  magazinePages: number;
};
export type GalleryItem = {
  image: string;
  title: string;
  type: string;
  focus: string;
  cover: boolean;
};
export type SiteContent = {
  projects: Project[];
  gallery: GalleryItem[];
  faqs: Array<[question: string, answer: string]>;
  text: Partial<Record<TextKey, string>>;
};

export const galleryCategories = [
  "Bathroom Tiling",
  "Splashback",
  "Floor Tiling",
  "Outdoors",
] as const;
export const photoBucket = "site-photos";

// "asset:<file>" is a photo bundled with the site; "storage:<path>" was uploaded from /admin.
export function photoUrl(src: string, storageBase: string) {
  if (src.startsWith("asset:")) return bundledAssetUrl(src.slice("asset:".length)) ?? "";
  if (src.startsWith("storage:"))
    return `${storageBase}/storage/v1/object/public/${photoBucket}/${src.slice("storage:".length)}`;
  return src;
}

const byOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

export function assembleContent(rows: ContentRows, storageBase: string): SiteContent {
  const url = (photo: PhotoRow) => photoUrl(photo.src, storageBase);
  // A project needs at least one photo to show; until then it would be an empty card.
  const published = rows.projects
    .filter((p) => p.published && rows.photos.some((photo) => photo.project_id === p.id))
    .sort(byOrder);
  const publishedIds = new Set(published.map((p) => p.id));
  const projects = published.map((project): Project => {
    const photos = rows.photos
      .filter((photo) => photo.project_id === project.id)
      .sort((a, b) => Number(b.magazine_page) - Number(a.magazine_page) || byOrder(a, b));
    const cover =
      photos.find((photo) => photo.id === project.cover_photo_id) ??
      photos.find((photo) => !photo.magazine_page) ??
      photos[0];
    return {
      slug: project.slug,
      title: project.title,
      publication: project.publication,
      intro: project.intro,
      cover: cover && url(cover),
      coverFocus: project.cover_focus,
      photos: photos.map((photo) => ({ url: url(photo), caption: photo.caption })),
      magazinePages: photos.filter((photo) => photo.magazine_page).length,
    };
  });
  const gallery = rows.photos
    .filter(
      (photo) =>
        photo.category &&
        !photo.magazine_page &&
        (photo.project_id === null || publishedIds.has(photo.project_id)),
    )
    .sort((a, b) => a.gallery_order - b.gallery_order)
    .map((photo): GalleryItem => ({
      image: url(photo),
      title: photo.caption,
      type: photo.category ?? "",
      focus: photo.focus,
      cover: photo.category_cover,
    }));
  const text: SiteContent["text"] = {};
  for (const row of rows.text) if (row.key in textDefaults) text[row.key as TextKey] = row.value;
  return {
    projects,
    gallery,
    faqs: [...rows.faqs].sort(byOrder).map((faq) => [faq.question, faq.answer]),
    text,
  };
}

// The root route loads the content once; every page reads it from there.
const rootRoute = getRouteApi("__root__");
export const useSiteContent = (): SiteContent => rootRoute.useLoaderData();

export function useText() {
  const { text } = useSiteContent();
  return (key: TextKey) => text[key] ?? textDefaults[key].value;
}

// Page text with line breaks kept, so a heading Shaun writes on two lines shows on two.
export function T({ k }: { k: TextKey }) {
  const value = useText()(k);
  const lines = value.split("\n");
  return createElement(
    Fragment,
    null,
    ...lines.flatMap((line, i): ReactNode[] =>
      i === 0 ? [line] : [createElement("br", { key: i }), line],
    ),
  );
}
