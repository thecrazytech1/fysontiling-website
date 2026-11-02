import { createFileRoute } from "@tanstack/react-router";
import { RichT, T } from "@/components/rich-text";
import { pageHead } from '@/lib/site-data';
import { PressSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute("/media")({
  staticData: { sitemap: true },
  head: () => pageHead('Fyson Tiling in the media', 'Magazine and press features featuring Fyson Tiling — local wall and floor tiling on the Mornington Peninsula.', '/media'),
  component: Media,
});
function Media() {
  return <><section className="border-b border-border py-14 md:py-20"><div className="site-width"><p className="eyebrow mb-3 text-primary"><T k="mediaPage.eyebrow"/></p><h1 className="page-title"><T k="mediaPage.title"/></h1><RichT k="mediaPage.intro" className="mt-5 max-w-md text-sm leading-7 text-muted-foreground" /></div></section><PressSection/><ProjectCTA/></>;
}
