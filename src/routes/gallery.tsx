import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/site-data';
import { GallerySection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute('/gallery')({
  staticData: { sitemap: true },
  head: () => pageHead('Tiling inspiration gallery', 'Browse bathroom, kitchen and floor tiling by Fyson Tiling on the Mornington Peninsula, and talk through your ideas with us.', '/gallery'),
  validateSearch: (search: Record<string, unknown>): { type?: string | undefined } => ({ type: typeof search['type'] === 'string' ? search['type'] : undefined }),
  component: GalleryPage,
});
function GalleryPage() {
  const { type } = Route.useSearch();
  return <><div className="site-width py-14"><p className="eyebrow mb-4 text-primary">Colours, textures & possibilities</p><h1 className="page-title">YOUR NEXT SPACE<br/>STARTS WITH AN IDEA.</h1><p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">A look at the kinds of spaces we tile — bathrooms, kitchens, walls and floors. For the latest from Fyson Tiling, visit our Instagram or Facebook page.</p></div><GallerySection full initialType={type}/><ProjectCTA/></>;
}
