import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/site-data';
import { AboutSection, ReviewsSection, ProjectCTA } from '@/components/site-sections';
export const Route = createFileRoute('/about')({ staticData: { sitemap: true }, head: () => pageHead('About Shaun and Fyson Tiling', 'Get to know Shaun Fyson’s local tiling business on the Mornington Peninsula and start a conversation about your home.', '/about'), component: AboutPage });
function AboutPage() { return <><div className="site-width pt-14"><p className="eyebrow mb-4 text-primary">Behind the name</p><h1 className="page-title">HELLO, WE’RE<br/>FYSON TILING.</h1></div><AboutSection/><ReviewsSection/><ProjectCTA/></>; }