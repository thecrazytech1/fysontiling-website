import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/site-data';
import { ServicesSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute('/services')({ staticData: { sitemap: true }, head: () => pageHead('Tiling services', 'Bathroom, kitchen, splashback, wall and floor tiling enquiries with Fyson Tiling on the Mornington Peninsula.', '/services'), component: ServicesPage });
function ServicesPage() { return <><div className="site-width pt-14"><p className="eyebrow mb-4 text-primary">Fyson Tiling services</p><h1 className="page-title">A FRESH FINISH.<br/>A HOME THAT FEELS LIKE YOU.</h1></div><ServicesSection/><ProjectCTA/></>; }