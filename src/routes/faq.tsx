import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/site-data';
import { FAQSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute('/faq')({ staticData: { sitemap: true }, head: () => pageHead('Frequently asked tiling questions', 'Find answers about requesting a tiling quote, choosing tiles, project timing and confirming your location with Fyson Tiling.', '/faq'), component: FAQPage });
function FAQPage() { return <><div className="site-width pt-14"><p className="eyebrow mb-4 text-primary">A little clarity</p><h1 className="page-title">LET’S GET YOUR<br/>QUESTIONS SORTED.</h1></div><FAQSection/><ProjectCTA/></>; }