import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from '@/lib/site-data';
import { PressSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute("/media")({
  staticData: { sitemap: true },
  head: () => pageHead('Fyson Tiling in the media', 'Magazine and press features featuring Fyson Tiling — local wall and floor tiling on the Mornington Peninsula.', '/media'),
  component: Media,
});
function Media() {
  return <><section className="border-b border-border py-14 md:py-20"><div className="site-width"><p className="eyebrow mb-3 text-primary">Press &amp; publications</p><h1 className="page-title">IN THE MEDIA.</h1><p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">Stories and features about Fyson Tiling from magazines and publications.</p></div></section><PressSection/><ProjectCTA/></>;
}
