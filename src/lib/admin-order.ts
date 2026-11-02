import type { getAdminContent } from "@/lib/content.functions";

type AdminContent = Awaited<ReturnType<typeof getAdminContent>>;
export type OrderList = "projects" | "project-photos" | "gallery" | "faqs" | "categories";

// Applies a new order to the cached admin content, so a dropped item stays put at once.
export function withOrder(content: AdminContent, list: OrderList, ids: string[]): AdminContent {
  const position = new Map(ids.map((rowId, index) => [rowId, index]));
  const sorted = <T extends { id: string; sort_order: number }>(rows: T[]) =>
    rows
      .map((row) => ({ ...row, sort_order: position.get(row.id) ?? row.sort_order }))
      .sort((a, b) => a.sort_order - b.sort_order);
  if (list === "projects") return { ...content, projects: sorted(content.projects) };
  if (list === "faqs") return { ...content, faqs: sorted(content.faqs) };
  if (list === "categories") return { ...content, categories: sorted(content.categories) };
  const field = list === "gallery" ? "gallery_order" : "sort_order";
  return {
    ...content,
    photos: content.photos.map((photo) =>
      position.has(photo.id) ? { ...photo, [field]: position.get(photo.id)! } : photo,
    ),
  };
}

// After dragging within a filtered view (one gallery category), put those items back into
// the positions they already held in the full list, so everything else stays where it was.
export function placeInSlots(allIds: string[], shownIds: string[]): string[] {
  const shown = new Set(shownIds);
  const ids = [...allIds];
  const slots = ids.flatMap((rowId, index) => (shown.has(rowId) ? [index] : []));
  slots.forEach((slot, k) => (ids[slot] = shownIds[k]!));
  return ids;
}
