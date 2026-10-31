import { createFileRoute } from '@tanstack/react-router';
import { T } from '@/lib/site-content';
import { pageHead } from '@/lib/site-data';
import { AreasSection, LocalAreasCopy, ProjectCTA } from '@/components/site-sections';
import { ServiceMapSection } from '@/components/service-map';
export const Route = createFileRoute('/areas')({ staticData: { sitemap: true }, head: () => pageHead('Mornington Peninsula tiler — service areas', 'Fyson Tiling tiles homes across the Mornington Peninsula — Mornington, Mount Martha, Dromana, Rosebud, Rye, Sorrento, Portsea, Red Hill and surrounds. Search your suburb or enquire.', '/areas'), component: AreasPage });
function AreasPage() { return <><div className="site-width py-16"><p className="eyebrow mb-4 text-primary"><T k="areasPage.eyebrow"/></p><h1 className="page-title"><T k="areasPage.title"/></h1></div><ServiceMapSection/><LocalAreasCopy/><AreasSection/><ProjectCTA/></>; }
