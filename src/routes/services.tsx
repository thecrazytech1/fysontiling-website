import { createFileRoute } from '@tanstack/react-router';
import { T } from '@/lib/site-content';
import { pageHead, servicesJsonLd } from '@/lib/site-data';
import { ServicesSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute('/services')({ staticData: { sitemap: true }, head: () => ({ ...pageHead('Tiling services — bathrooms, splashbacks, walls & floors', 'Bathroom and ensuite tiling, kitchen splashbacks, and wall and floor tiling across the Mornington Peninsula by Shaun Fyson, a local tiler with 20 years of experience.', '/services'), scripts: [{ type: 'application/ld+json', children: JSON.stringify(servicesJsonLd()) }] }), component: ServicesPage });
function ServicesPage() { return <><div className="site-width pt-14"><p className="eyebrow mb-4 text-primary"><T k="servicesPage.eyebrow"/></p><h1 className="page-title"><T k="servicesPage.title"/></h1></div><ServicesSection/><ProjectCTA/></>; }