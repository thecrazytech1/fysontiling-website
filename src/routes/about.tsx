import { createFileRoute } from '@tanstack/react-router';
import { T } from '@/lib/site-content';
import { pageHead } from '@/lib/site-data';
import { AboutSection, ReviewsSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute('/about')({ staticData: { sitemap: true }, head: () => pageHead('About Shaun and Fyson Tiling', 'Get to know Shaun Fyson’s local tiling business on the Mornington Peninsula and start a conversation about your home.', '/about'), component: AboutPage });
function AboutPage() { return <><div className="site-width pt-14"><p className="eyebrow mb-4 text-primary"><T k="aboutPage.eyebrow"/></p><h1 className="page-title"><T k="aboutPage.title"/></h1></div><AboutSection/><ReviewsSection/><ProjectCTA/></>; }