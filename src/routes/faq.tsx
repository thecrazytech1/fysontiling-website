import { createFileRoute } from '@tanstack/react-router';
import { faqJsonLd, pageHead } from '@/lib/site-data';
import { FAQSection, ProjectCTA } from '@/components/site-sections';
import { T } from '@/lib/site-content';
export const Route = createFileRoute('/faq')({ staticData: { sitemap: true }, loader: async ({ parentMatchPromise }) => (await parentMatchPromise).loaderData?.faqs ?? [], head: ({ loaderData }) => ({ ...pageHead('Tiling FAQs — quotes, costs and timing', 'Answers to common questions about tiling quotes, costs, choosing tiles, start dates and which Mornington Peninsula suburbs Fyson Tiling covers.', '/faq'), scripts: [{ type: 'application/ld+json', children: JSON.stringify(faqJsonLd(loaderData ?? [])) }] }), component: FAQPage });
function FAQPage() { return <><div className="site-width pt-14"><p className="eyebrow mb-4 text-primary"><T k="faqPage.eyebrow"/></p><h1 className="page-title"><T k="faqPage.title"/></h1></div><FAQSection/><ProjectCTA/></>; }