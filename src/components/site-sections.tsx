import { Link } from "@tanstack/react-router";
import { RichT, T } from "@/components/rich-text";
import { ArrowUpRight, MapPin, ArrowRight, Phone, Newspaper, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lightbox } from "@/components/lightbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { services, contact, press } from "@/lib/site-data";
import { useImage, usePlainText, useSiteContent } from "@/lib/site-content";

// One hook call per service card (a fixed three), in card order.
function useServiceImages() {
  return [useImage("services.1.image"), useImage("services.2.image"), useImage("services.3.image")];
}

const serviceTitleKeys = ["services.1.title", "services.2.title", "services.3.title"] as const;
const serviceTextKeys = ["services.1.text", "services.2.text", "services.3.text"] as const;

export function ServicesSection() {
  const serviceImages = useServiceImages();
  const plainText = usePlainText();
  const [enlarged, setEnlarged] = useState<number | null>(null);
  const serviceAlt = (i: number) =>
    `${plainText(serviceTitleKeys[i] ?? "services.1.title")} by Fyson Tiling`;
  return (
    <section className="py-16 md:py-24">
      <div className="site-width">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-primary">
              <T k="services.eyebrow" />
            </p>
            <h2 className="section-title">
              <T k="services.title" />
            </h2>
          </div>
          <RichT k="services.intro" className="max-w-sm text-sm leading-7 text-muted-foreground" />
        </div>
        <div className="grid gap-7 md:grid-cols-3">
          {services.map((s, i) => (
            <article key={s.title} className="group">
              <button
                type="button"
                onClick={() => setEnlarged(i)}
                aria-label={`Enlarge photo: ${serviceAlt(i)}`}
                className="block w-full cursor-zoom-in overflow-hidden rounded-md"
              >
                <img
                  src={serviceImages[i]?.src}
                  alt={serviceAlt(i)}
                  loading="lazy"
                  style={{ objectPosition: serviceImages[i]?.focus }}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  <T k={serviceTitleKeys[i] ?? "services.1.title"} />
                </h3>
                <span className="eyebrow text-primary">{s.number}</span>
              </div>
              <RichT
                k={serviceTextKeys[i] ?? "services.1.text"}
                className="mt-3 text-sm leading-7 text-muted-foreground"
              />
              <Button asChild variant="link" className="mt-2 px-0">
                <Link to="/contact">
                  Talk about your project <ArrowUpRight />
                </Link>
              </Button>
            </article>
          ))}
        </div>
        <Lightbox
          title="Our services"
          items={serviceImages.map((image, i) => ({
            src: image.src,
            alt: serviceAlt(i),
            caption: plainText(serviceTitleKeys[i] ?? "services.1.title"),
          }))}
          index={enlarged}
          onIndexChange={setEnlarged}
        />
      </div>
    </section>
  );
}

export function GallerySection({
  full = false,
  initialType,
  limit,
}: {
  full?: boolean;
  initialType?: string | undefined;
  limit?: number | undefined;
}) {
  const { gallery, categories } = useSiteContent();
  const [selected, setSelected] = useState<number | null>(null);
  // Categories come in the order Shaun sets in /admin; empty ones are already left out.
  const types = ["All", ...categories];
  const [filter, setFilter] = useState(
    initialType && types.includes(initialType) ? initialType : "All",
  );
  const items = full ? gallery.filter((g) => filter === "All" || g.type === filter) : [];
  // Category cards avoid repeating the photos already used on the service cards.
  const shown = new Set(useServiceImages().map((image) => image.src));
  const categoryCards = types
    .filter((t) => t !== "All")
    .map((t) => ({
      type: t,
      photo:
        gallery.find((g) => g.type === t && g.cover) ??
        gallery.find((g) => g.type === t && !shown.has(g.image)) ??
        gallery.find((g) => g.type === t),
    }))
    .filter((c): c is { type: string; photo: (typeof gallery)[number] } => c.photo !== undefined);
  const visibleCards = typeof limit === "number" ? categoryCards.slice(0, limit) : categoryCards;
  const hiddenCards = categoryCards.length - visibleCards.length;
  return (
    <section className="py-16 md:py-24">
      <div className="site-width">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-primary">
              <T k="gallery.eyebrow" />
            </p>
            <h2 className="section-title">
              <T k="gallery.title" />
            </h2>
          </div>
          <RichT k="gallery.intro" className="max-w-sm text-sm leading-7 text-muted-foreground" />
        </div>
        {full && (
          <div className="mb-8 flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilter(t);
                  setSelected(null);
                }}
                aria-pressed={filter === t}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${filter === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {full ? (
          <div className="grid gap-7 sm:grid-cols-2">
            {items.map((g, i) => (
              <article key={g.image} className="group">
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  className="block w-full cursor-zoom-in overflow-hidden rounded-md text-left"
                  aria-label={`Enlarge photo: ${g.title}`}
                >
                  <img
                    src={g.image}
                    alt={g.type}
                    style={{ objectPosition: g.focus }}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
                <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <h3 className="text-lg font-medium">{g.title}</h3>
                  <span className="eyebrow text-primary">{g.type}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-7 md:grid-cols-3">
              {visibleCards.map((c) => (
                <article key={c.type} className="group flex h-full min-w-0 flex-col">
                  <Link
                    to="/gallery"
                    search={{ type: c.type }}
                    aria-label={`Browse ${c.type}`}
                    className="block overflow-hidden rounded-md bg-secondary"
                  >
                    <img
                      src={c.photo.image}
                      alt={c.type}
                      style={{ objectPosition: c.photo.focus }}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                  <p className="eyebrow mt-5 text-primary">{c.type}</p>
                  <h3 className="mt-2 grow text-lg font-medium">{c.photo.title}</h3>
                  <Button asChild variant="link" className="mt-2 px-0">
                    <Link to="/gallery" search={{ type: c.type }}>
                      Browse {c.type.toLowerCase()} <ArrowUpRight />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
            {hiddenCards > 0 && (
              <div className="mt-10 flex justify-center">
                <Button asChild variant="outline" className="h-12 rounded-full px-6">
                  <Link to="/gallery">
                    More inspiration <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
        {full && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No projects in this category yet - check back soon.
          </p>
        )}
        {full && (
          <Lightbox
            title="Tiling inspiration"
            items={items.map((g) => ({ src: g.image, alt: g.title, caption: g.title }))}
            index={selected}
            onIndexChange={setSelected}
          />
        )}
      </div>
    </section>
  );
}
export function ProjectsSection({ limit }: { limit?: number | undefined }) {
  const { projects } = useSiteContent();
  const visibleProjects = typeof limit === "number" ? projects.slice(0, limit) : projects;
  const hiddenProjects = projects.length - visibleProjects.length;
  return (
    <section className="py-16 md:py-24">
      <div className="site-width">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-primary">
              <T k="projects.eyebrow" />
            </p>
            <h2 className="section-title">
              <T k="projects.title" />
            </h2>
          </div>
          <RichT k="projects.intro" className="max-w-sm text-sm leading-7 text-muted-foreground" />
        </div>
        <div className="grid gap-7 md:grid-cols-3">
          {visibleProjects.map((project) => (
            <article key={project.slug} className="group flex h-full min-w-0 flex-col">
              <Link
                to="/projects/$slug"
                params={{ slug: project.slug }}
                aria-label={`Explore ${project.title}`}
                className="block overflow-hidden rounded-md bg-secondary"
              >
                <img
                  src={project.cover}
                  alt={
                    project.publication
                      ? `${project.title} in ${project.publication}`
                      : `${project.title} by Fyson Tiling`
                  }
                  loading="lazy"
                  style={{ objectPosition: project.coverFocus }}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <p className="eyebrow mt-5 text-primary">{project.publication || "Fyson Tiling"}</p>
              <h3 className="mt-2 grow text-lg font-medium">{project.title}</h3>
              <Button asChild variant="link" className="mt-2 px-0">
                <Link to="/projects/$slug" params={{ slug: project.slug }}>
                  Explore project <ArrowUpRight />
                </Link>
              </Button>
            </article>
          ))}
        </div>
        {hiddenProjects > 0 && (
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline" className="h-12 rounded-full px-6">
              <Link to="/projects">
                See all our projects <ArrowUpRight />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
export function AboutSection() {
  const photo = useImage("about.photo");
  const [enlarged, setEnlarged] = useState<number | null>(null);
  return (
    <section className="py-16 md:py-24">
      <div className="site-width grid items-center gap-10 md:grid-cols-2 md:gap-20">
        <button
          type="button"
          onClick={() => setEnlarged(0)}
          aria-label={`Enlarge photo: ${photo.alt}`}
          className="relative block cursor-zoom-in"
        >
          <img
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            style={{ objectPosition: photo.focus }}
            className="aspect-square max-h-[520px] w-full rounded-md object-cover"
          />
        </button>
        <Lightbox
          title="About Fyson Tiling"
          items={[{ src: photo.src, alt: photo.alt }]}
          index={enlarged}
          onIndexChange={setEnlarged}
        />
        <div>
          <p className="eyebrow mb-4 text-primary">
            <T k="about.eyebrow" />
          </p>
          <h2 className="section-title">
            <T k="about.title" />
          </h2>
          <RichT k="about.p1" className="mt-6 text-sm leading-8 text-muted-foreground" />
          <RichT k="about.p2" className="mt-4 text-sm leading-8 text-muted-foreground" />
          <Button asChild className="mt-8 h-12 rounded-full">
            <Link to="/contact">
              Meet your next project <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function AreasSection() {
  return (
    <section className="border-y border-border bg-muted py-14">
      <div className="site-width flex flex-col justify-between gap-7 md:flex-row md:items-center">
        <div>
          <p className="eyebrow mb-3 text-primary">
            <T k="areas.eyebrow" />
          </p>
          <h2 className="section-title">
            <T k="areas.title" />
          </h2>
        </div>
        <div className="max-w-md">
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPin size={18} className="text-primary" />
            Mornington Peninsula, Victoria
          </p>
          <RichT k="areas.text" className="mt-4 text-sm leading-7 text-muted-foreground" />
          <Button asChild variant="link" className="mt-3 px-0">
            <Link to="/contact">
              Ask about your area <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function LocalAreasCopy() {
  return (
    <section className="py-16 md:py-24">
      <div className="site-width grid gap-9 md:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow mb-3 text-primary">
            <T k="localAreas.eyebrow" />
          </p>
          <h2 className="section-title">
            <T k="localAreas.title" />
          </h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-muted-foreground">
          <RichT k="localAreas.p1" />
          <RichT k="localAreas.p2" />
          <RichT k="localAreas.p3" />
          <Button asChild variant="link" className="px-0">
            <Link to="/contact">
              Enquire about your suburb <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function FAQSection() {
  const { faqs } = useSiteContent();
  return (
    <section className="py-16 md:py-24">
      <div className="site-width grid gap-9 md:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow mb-3 text-primary">
            <T k="faq.eyebrow" />
          </p>
          <h2 className="section-title">
            <T k="faq.title" />
          </h2>
        </div>
        <Accordion type="single" collapsible>
          {faqs.map(([q, a], i) => (
            <AccordionItem value={String(i)} key={q}>
              <AccordionTrigger className="py-5 text-left text-sm">{q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
export function ReviewsSection() {
  return (
    <section className="border-y border-border py-12">
      <div className="site-width flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="eyebrow mb-2 text-primary">
            <T k="community.eyebrow" />
          </p>
          <h2 className="font-display text-3xl">
            <T k="community.title" />
          </h2>
          <RichT k="community.text" className="mt-3 text-sm text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-12 rounded-full">
            <a href={contact.facebook} target="_blank" rel="noreferrer">
              Visit our Facebook page <ArrowUpRight />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full">
            <a href={contact.instagram} target="_blank" rel="noreferrer">
              <Instagram />
              Visit our Instagram page <ArrowUpRight />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full">
            <a href={contact.googleReview} target="_blank" rel="noreferrer">
              Review us on Google <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function PressSection() {
  const [feature, setFeature] = useState<{
    title: string;
    publication: string;
    pages: string[];
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(0);
  const openFeature = (title: string, publication: string, pages: string[]) => {
    setZoom(1);
    setPage(0);
    setFeature({ title, publication, pages });
  };
  const gotoPage = (i: number) => {
    setZoom(1);
    setPage(i);
  };
  const pageCount = feature?.pages.length ?? 0;
  return (
    <section className="py-16 md:py-24">
      <div className="site-width">
        <div className="mb-9">
          <p className="eyebrow mb-3 text-primary">
            <T k="press.eyebrow" />
          </p>
          <h2 className="section-title">
            <T k="press.title" />
          </h2>
        </div>
        {press.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-secondary/50 px-7 py-12 text-center">
            <Newspaper size={26} className="mx-auto text-primary" />
            <p className="mt-4 text-sm font-medium">Magazine features are on their way.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
              When Fyson Tiling appears in print or online publications, you’ll find the stories
              here. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {press.map((p) => {
              const featureImage = p.featureImage;
              const pages = p.featurePages ?? (p.featureImage ? [p.featureImage] : []);
              const card = (
                <div className="group flex h-full flex-col rounded-md border border-border bg-background p-6 transition-colors hover:border-primary/60">
                  {p.image && (
                    <div className="relative mb-5 overflow-hidden rounded-sm">
                      <img
                        src={p.image}
                        alt={`${p.title} - ${p.publication} cover`}
                        loading="lazy"
                        className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {(p.url || featureImage) && (
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
                          Read the feature <ArrowUpRight size={13} />
                        </span>
                      )}
                    </div>
                  )}
                  <p className="eyebrow text-primary">{p.publication}</p>
                  <h3 className="mt-2 text-lg font-medium">{p.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{p.blurb}</p>
                  {(p.url || featureImage) && (
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4">
                      Open the feature <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
              );
              if (pages.length > 0)
                return (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => openFeature(p.title, p.publication, pages)}
                    className="block h-full w-full text-left"
                  >
                    {card}
                  </button>
                );
              return p.url ? (
                <a
                  key={p.title}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full"
                >
                  {card}
                </a>
              ) : (
                <div key={p.title} className="h-full">
                  {card}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Dialog
        open={feature !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFeature(null);
            setZoom(1);
            setPage(0);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          {feature && (
            <>
              <DialogTitle>
                {feature.title} - {feature.publication}
              </DialogTitle>
              <DialogDescription>
                {pageCount > 1
                  ? `The feature pages as they appeared in print (${page + 1} of ${pageCount}).`
                  : "The feature page as it appeared in print."}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2">
                {pageCount > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => gotoPage(page - 1)}
                      disabled={page === 0}
                      className="rounded-full"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => gotoPage(page + 1)}
                      disabled={page === pageCount - 1}
                      className="rounded-full"
                    >
                      Next
                    </Button>
                  </>
                )}
                <Button
                  variant={pageCount > 1 ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => setZoom(1)}
                  className="rounded-full"
                >
                  Fit page
                </Button>
                <Button
                  variant={zoom > 1 ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.75))}
                  className="rounded-full"
                >
                  Zoom in
                </Button>
                {zoom > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(1)}
                    className="rounded-full"
                  >
                    Reset
                  </Button>
                )}
              </div>
              <div className="max-h-[65svh] overflow-auto rounded border border-border">
                <img
                  src={feature.pages[page] ?? feature.pages[0]}
                  alt={`${feature.title} feature page ${page + 1} in ${feature.publication}`}
                  style={{ width: `${zoom * 100}%` }}
                  className="max-w-none"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function ProjectCTA() {
  return (
    <section className="bg-primary py-10 text-primary-foreground">
      <div className="site-width flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow mb-2 text-primary-foreground/70">
            <T k="cta.eyebrow" />
          </p>
          <h2 className="font-display text-3xl md:text-4xl">
            <T k="cta.title" />
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Button variant="secondary" asChild className="h-10 rounded-full px-5 text-sm">
            <Link to="/contact">
              Tell us about your project <ArrowUpRight />
            </Link>
          </Button>
          <a
            href={contact.phoneTel}
            className="flex items-center gap-2 text-sm font-medium underline underline-offset-4"
          >
            <Phone size={15} />
            {contact.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
