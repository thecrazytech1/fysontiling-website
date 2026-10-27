import { createFileRoute } from "@tanstack/react-router";
import { MapPin, ArrowUpRight, Phone } from "lucide-react";
import { pageHead, contact } from "@/lib/site-data";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/enquiry-form";
export const Route = createFileRoute("/contact")({
    staticData: { sitemap: true },
    validateSearch: (search: Record<string, unknown>): { suburb?: string } =>
        typeof search["suburb"] === "string" ? { suburb: search["suburb"].slice(0, 120) } : {},
    head: () =>
        pageHead(
            "Contact Fyson Tiling",
            "Send Shaun Fyson a private project enquiry for bathroom, kitchen, wall or floor tiling on the Mornington Peninsula.",
            "/contact",
        ),
    component: ContactPage,
});
function ContactPage() {
    const { suburb } = Route.useSearch();
    return (
        <section className="site-width grid gap-12 py-14 md:grid-cols-[1fr_1.2fr] md:gap-20 md:py-20">
            <div>
                <p className="eyebrow mb-4 text-primary">Your next chapter</p>
                <h1 className="page-title">
                    LET’S MAKE
                    <br />
                    IT HAPPEN.
                </h1>
                <p className="mt-6 max-w-sm text-sm leading-8 text-muted-foreground">
                    A new bathroom? A splashback with character? Tell Shaun what you have in mind. A great
                    space starts with a conversation.
                </p>
                <Button asChild className="mt-8 h-14 w-full rounded-full px-7 text-base sm:w-auto">
                    <a href={contact.phoneTel}>
                        <Phone size={19} />
                        {contact.phoneDisplay}
                    </a>
                </Button>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    Tap to call Shaun directly. Prefer to write it down? Use the form and you’ll hear back.
                </p>
                <p className="mt-8 flex items-center gap-2 text-sm">
                    <MapPin size={17} className="text-primary" />
                    Mornington Peninsula, Victoria
                </p>
                <a
                    href="https://www.instagram.com/fysontiling/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex items-center gap-2 text-sm text-primary"
                >
                    @fysontiling <ArrowUpRight size={16} />
                </a>
            </div>
            <EnquiryForm key={suburb ?? ""} initialSuburb={suburb ?? ""} />
        </section>
    );
}
