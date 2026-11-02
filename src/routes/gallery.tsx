import { createFileRoute } from "@tanstack/react-router";
import { RichT, T } from "@/components/rich-text";
import { pageHead } from "@/lib/site-data";
import { GallerySection, ProjectCTA } from "@/components/site-sections";
export const Route = createFileRoute("/gallery")({
  staticData: { sitemap: true },
  head: () =>
    pageHead(
      "Tiling inspiration gallery",
      "Browse bathroom, kitchen and floor tiling by Fyson Tiling on the Mornington Peninsula, and talk through your ideas with us.",
      "/gallery",
    ),
  validateSearch: (search: Record<string, unknown>): { type?: string | undefined } => ({
    type: typeof search["type"] === "string" ? search["type"] : undefined,
  }),
  component: GalleryPage,
});
function GalleryPage() {
  const { type } = Route.useSearch();
  return (
    <>
      <div className="site-width py-14">
        <p className="eyebrow mb-4 text-primary">
          <T k="galleryPage.eyebrow" />
        </p>
        <h1 className="page-title">
          <T k="galleryPage.title" />
        </h1>
        <RichT
          k="galleryPage.intro"
          className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground"
        />
      </div>
      <GallerySection full initialType={type} />
      <ProjectCTA />
    </>
  );
}
