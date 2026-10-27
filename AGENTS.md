## Architecture

- Use the root route for shared site navigation/footer and separate public content routes; this keeps sections independently shareable and searchable.
- Keep shared static business content and bundled inspiration assets in a browser-safe data module; this prevents duplicate copy across pages.
- Derive additional inspiration entries from explicitly categorised project photographs, deduplicating image URLs and excluding magazine pages; this keeps gallery and project photos aligned without changing category covers.
- Accept enquiries only through a validated, honeypot-protected, per-email-limited server function using a private table; visitors must never read submitted contact details.
- Named project pages reuse owner-associated press content from the shared data module and use un-nested detail routes; this avoids invented photo associations and keeps each story independently shareable.
