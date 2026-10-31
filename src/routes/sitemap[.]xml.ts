import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import {
  isSitemapRouteIncluded,
  sitemapPathForLocation,
  sitemapStaticPaths,
  sitemapXML,
  type SitemapEntry,
} from "@/lib/sitemap";

// Public site origin — used for every <loc> in /sitemap.xml.
const BASE_URL = "https://www.fysontiling.com.au";

const PROJECT_ROUTE_ID = "/projects_/$slug";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        if (!BASE_URL) {
          return new Response("Sitemap domain not configured", {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          });
        }
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        // Project pages come from the published projects Shaun manages in /admin.
        const projectRoute = router.routesById[PROJECT_ROUTE_ID];
        if (isSitemapRouteIncluded(projectRoute)) {
          const { loadSiteContent } = await import("@/lib/content.server");
          const { projects } = await loadSiteContent();
          for (const project of projects) {
            const location = router.buildLocation({
              to: "/projects/$slug",
              params: { slug: project.slug },
              search: () => ({}),
              hash: "",
            });
            const path = sitemapPathForLocation(router, location, PROJECT_ROUTE_ID);
            if (path) entries.push({ path });
          }
        }

        if (entries.length === 0) {
          return new Response(
            'No pages are included in this sitemap. Check route decisions and ancestor exclusions. Setting "exclude-subtree" on the root excludes the entire site.',
            { status: 404, headers: { "Cache-Control": "no-store" } },
          );
        }
        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
