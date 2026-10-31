import { createFileRoute } from "@tanstack/react-router";
import { siteOrigin } from "@/lib/site-data";

// A plain-text summary for AI assistants (https://llmstxt.org). Projects and FAQs come
// from the content Shaun manages in /admin, so new work shows up here automatically.
const intro = `# Fyson Tiling

> Fyson Tiling is Shaun Fyson's owner-operated residential tiling business on the
> Mornington Peninsula, Victoria, Australia. Twenty years of tiling experience,
> covering bathrooms and ensuites, kitchen splashbacks, wall and floor tiling and
> outdoor areas, with close attention to grout colours, tile trims and layout.

- Owner: Shaun Fyson
- Phone: 0401 428 430 (tel:+61401428430)
- Website: https://www.fysontiling.com.au
- Service area: Mornington Peninsula and surrounds, Victoria
- Google Business Profile: https://share.google/ZVZgl5Mg4IQAs1SEL
- Google reviews: https://g.page/r/CbXkkwPjS2eSEAI/review
- Facebook: https://www.facebook.com/fysontiling
- Instagram: https://www.instagram.com/fysontiling/

No street address, email address or business hours are published for this
business. Enquiries are made by phone or through the enquiry form at
https://www.fysontiling.com.au/contact. Prices are quoted individually for each
project; no standard rates are published.

## Services

- Bathroom tiling: wall and floor tiling for bathrooms and ensuites.
- Kitchens and splashbacks: from subtle textures to statement splashbacks.
- Wall and floor tiling: considered layouts and clean lines through the home.
- Outdoor tiling: patios, poolside paving, terraces and entry steps (see the
  Outdoors category of the gallery).

## Suburbs served

Arthurs Seat, Balnarring, Baxter, Bittern, Blairgowrie, Boneo, Cape Schanck,
Capel Sound, Carrum Downs, Crib Point, Dromana, Fingal, Flinders, Frankston,
Frankston South, Hastings, Langwarrin, Main Ridge, McCrae, Merricks, Moorooduc,
Mornington, Mount Eliza, Mount Martha, Point Leo, Portsea, Red Hill,
Red Hill South, Rosebud, Rye, Safety Beach, Seaford, Shoreham, Somers,
Somerville, Sorrento, St Andrews Beach, Tootgarook, Tuerong and Tyabb.
For other nearby suburbs, include the location in an enquiry to confirm.

`;

const pages = `## Pages

- [Home](https://www.fysontiling.com.au/)
- [Services](https://www.fysontiling.com.au/services): tiling services
- [Inspiration gallery](https://www.fysontiling.com.au/gallery): bathroom, splashback, floor and outdoor tiling photos
- [Projects](https://www.fysontiling.com.au/projects): project listing
- [Media](https://www.fysontiling.com.au/media): magazine and press features
- [Reviews](https://www.fysontiling.com.au/reviews): homeowner reviews
- [About](https://www.fysontiling.com.au/about): about Shaun and Fyson Tiling
- [Service areas](https://www.fysontiling.com.au/areas): suburbs served, with a map
- [FAQ](https://www.fysontiling.com.au/faq): quotes, costs, timing and coverage
- [Contact](https://www.fysontiling.com.au/contact): enquiry form

`;

export const Route = createFileRoute("/llms.txt")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const { loadSiteContent } = await import("@/lib/content.server");
        const { projects, faqs } = await loadSiteContent();
        const press = projects
          .filter((p) => p.publication)
          .map((p) => `- ${p.publication}: ${p.title}`);
        const projectLines = projects.map((p) => {
          const lead = p.intro || p.photos[p.magazinePages]?.caption || "";
          const featured = p.publication ? `featured in ${p.publication}. ` : "";
          return `- [${p.title}](${siteOrigin}/projects/${p.slug}): ${featured}${lead}`.trimEnd();
        });
        const body = [
          intro.trimEnd(),
          ...(press.length ? ["## Press", press.join("\n")] : []),
          pages.trimEnd(),
          "## Projects",
          projectLines.join("\n"),
          "## FAQ",
          faqs.map(([q, a]) => `- ${q} ${a}`).join("\n"),
        ].join("\n\n");
        return new Response(`${body}\n`, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
