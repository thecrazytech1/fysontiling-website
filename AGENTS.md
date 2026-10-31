## Architecture

- Use the root route for shared site navigation/footer and separate public content routes; this keeps sections independently shareable and searchable.
- Keep fixed business details (phone, links, services, suburbs, press) in the browser-safe `site-data` module; this prevents duplicate copy across pages.
- Projects, photos, gallery categories, FAQs and page text are owner-editable from /admin: they live in the `site_*` tables, load once in the root loader (`useSiteContent`, `<T k>`), and fall back to `builtInRows` if the database can't be read; this lets Shaun edit without a deploy and keeps the site up when the database isn't.
- New page text needs a default in `site-text.ts` and a `<T k>` in the page; uploads go to the public `site-photos` storage bucket, shrunk in the browser first.
- A photo appears in the inspiration gallery only when it has a category and is not a magazine page; one row per photo keeps gallery and project captions aligned.
- Accept enquiries only through a validated, honeypot-protected, per-email-limited server function using a private table; visitors must never read submitted contact details.
- Named project pages use un-nested detail routes and only show photos Shaun has attached to that project; this avoids invented photo associations and keeps each story independently shareable.
