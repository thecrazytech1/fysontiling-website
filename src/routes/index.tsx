import { createFileRoute } from "@tanstack/react-router";
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hero, pageHead } from '@/lib/site-data';
import { GallerySection, ProjectsSection, AboutSection, FAQSection, ReviewsSection, PressSection, ProjectCTA } from '@/components/site-sections';
import { ServiceMapSection } from '@/components/service-map';
export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => pageHead('Mornington Peninsula Tiler | Bathrooms, Kitchens & Floors', 'Fyson Tiling is Shaun Fyson’s local tiling business on the Mornington Peninsula — wall and floor tiling for bathrooms, kitchens and homes from Mornington and Mount Martha to Sorrento and Portsea.', '/'),
  component: Index,
});
function Index() {
  return <><section className="hero relative isolate overflow-hidden text-hero-ink"><img src={hero} alt="Tiled bathroom by Fyson Tiling" className="absolute inset-0 size-full object-cover object-[65%_center]" fetchPriority="high"/><div className="site-width relative z-10 flex h-full flex-col justify-center"><div className="hero-content max-w-2xl pb-10"><h1 className="font-display text-[52px] leading-[0.95] sm:text-[76px]">FYSON TILING.<span className="sr-only"> — wall and floor tiling on the Mornington Peninsula</span></h1><div className="mt-7 flex flex-wrap gap-3"><Button asChild variant="secondary" className="h-10 rounded-full px-5 text-sm"><Link to="/contact">Let’s talk about your project <ArrowUpRight/></Link></Button><Button asChild variant="ghost" className="h-10 rounded-full border border-hero-ink/40 px-5 text-sm text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink"><Link to="/gallery">Find inspiration <ArrowUpRight/></Link></Button></div></div><div className="absolute inset-x-0 bottom-6 flex items-center justify-between border-t border-hero-ink/25 pt-4"><span className="eyebrow text-hero-ink/70">Your local Mornington Peninsula tiler</span><span className="hidden font-mono text-[9px] text-hero-ink/60 sm:block">SCROLL TO EXPLORE</span><ArrowDown size={18}/></div></div></section><div className="border-b border-border"><div className="site-width flex flex-wrap justify-between gap-3 py-5 font-mono text-[9px] uppercase text-muted-foreground"><span className="flex items-center gap-2"><MapPin size={13} className="text-primary"/>Mornington Peninsula</span><span>Bathrooms · Kitchens · Walls & floors</span><span className="hidden sm:block">A personal, local approach</span></div></div><GallerySection limit={3}/><ProjectsSection limit={3}/><AboutSection/><ReviewsSection/><ServiceMapSection/><FAQSection/><PressSection/><ProjectCTA/></>;
}
