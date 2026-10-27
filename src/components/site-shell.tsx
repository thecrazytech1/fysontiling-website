import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight, Instagram, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import fysonLogo from "@/assets/fyson-logo.png";
import { contact } from "@/lib/site-data";

const links = [
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/gallery", label: "Inspiration" },
  { to: "/reviews", label: "Reviews" },
  { to: "/media", label: "Media" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-30 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="site-width flex h-20 items-center justify-between gap-4">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          aria-label="Fyson Tiling home"
          className="flex shrink-0 items-center gap-3"
        >
          <img
            src={fysonLogo}
            alt="Fyson Tiling logo"
            width={48}
            height={48}
            className="size-11 md:size-12"
            fetchPriority="high"
          />
          <span className="flex flex-col leading-none text-foreground">
            <span className="font-display text-[26px] leading-none tracking-wide md:text-[30px]">
              FYSON
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.42em] text-muted-foreground">
              Tiling
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 lg:flex" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={contact.phoneTel}
            className="hidden items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary xl:flex"
          >
            <Phone size={15} />
            {contact.phoneDisplay}
          </a>
          <Button asChild className="h-11 rounded-full px-5">
            <Link to="/contact">
              Let’s talk tiles <ArrowUpRight />
            </Link>
          </Button>
        </nav>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-20 border-b border-border bg-background px-6 py-5 lg:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block border-b border-border py-3 text-sm"
            >
              {l.label}
            </Link>
          ))}
          <Button asChild className="mt-4 h-11 w-full">
            <a href={contact.phoneTel} onClick={() => setOpen(false)}>
              <Phone />
              {contact.phoneDisplay}
            </a>
          </Button>
          <Button asChild variant="outline" className="mt-3 h-11 w-full">
            <Link to="/contact" onClick={() => setOpen(false)}>
              Enquire about your project <ArrowUpRight />
            </Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="bg-foreground py-12 text-background">
      <div className="site-width">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center">
              <img
                src={fysonLogo}
                alt="Fyson Tiling logo"
                width={72}
                height={72}
                loading="lazy"
                className="size-16 bg-secondary p-1.5"
              />
            </Link>
          </div>
          <div>
            <p className="eyebrow mb-4 text-background/50">Explore</p>
            <div className="grid gap-3 text-sm">
              {links.map((l) => (
                <Link key={l.to} to={l.to}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4 text-background/50">Stay connected</p>
            <a href={contact.phoneTel} className="flex items-center gap-2 text-sm">
              <Phone size={16} />
              {contact.phoneDisplay}
            </a>
            <a
              href="https://www.instagram.com/fysontiling/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2 text-sm"
            >
              <Instagram size={16} /> Instagram <ArrowUpRight size={14} />
            </a>
            <a
              href="https://www.facebook.com/fysontiling"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2 text-sm"
            >
              Facebook <ArrowUpRight size={14} />
            </a>
            <Link to="/areas" className="mt-5 block text-sm">
              Service areas
            </Link>
            <Link to="/faq" className="mt-3 block text-sm">
              FAQs
            </Link>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-background/20 pt-5 font-mono text-[9px] text-background/50">
          <span>© {new Date().getFullYear()} Fyson Tiling</span>
          <span>Mornington Peninsula, Victoria</span>
        </div>
      </div>
    </footer>
  );
}
