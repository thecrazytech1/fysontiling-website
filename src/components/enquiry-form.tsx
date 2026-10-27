import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitEnquiry } from "@/lib/enquiries.functions";

export function EnquiryForm({ initialSuburb = "" }: { initialSuburb?: string }) {
  const [service, setService] = useState("Bathroom tiling");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setState("sending");
    const form = new FormData(event.currentTarget);
    try {
      await submitEnquiry({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          suburb: String(form.get("suburb") ?? ""),
          message: String(form.get("message") ?? ""),
          website: String(form.get("website") ?? ""),
          service: service as
            "Bathroom tiling" | "Kitchens & splashbacks" | "Wall & floor tiling" | "Something else",
        },
      });
      setState("sent");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your enquiry could not be sent. Please try again.",
      );
      setState("idle");
    }
  }
  if (state === "sent")
    return (
      <div role="status" className="py-12">
        <CheckCircle2 className="mb-5 size-10 text-primary" />
        <h2 className="font-display text-4xl">THANK YOU. YOU’RE ON THE LIST.</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Your project enquiry has been received and saved for Shaun to review.
        </p>
        <Button variant="outline" className="mt-7" onClick={() => setState("idle")}>
          Send another enquiry
        </Button>
      </div>
    );
  return (
    <form onSubmit={send} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          { name: "name", label: "Your name", type: "text", required: true },
          { name: "email", label: "Email address", type: "email", required: true },
          { name: "phone", label: "Phone number (optional)", type: "tel", required: false },
          { name: "suburb", label: "Your suburb", type: "text", required: true },
        ].map((f) => (
          <div key={f.name} className="grid gap-2">
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input
              id={f.name}
              name={f.name}
              type={f.type}
              required={f.required}
              defaultValue={f.name === "suburb" ? initialSuburb : undefined}
              minLength={f.type === "text" ? 2 : undefined}
              maxLength={f.name === "email" ? 254 : 120}
              className="h-12 bg-card"
              autoComplete={
                f.name === "name"
                  ? "name"
                  : f.name === "phone"
                    ? "tel"
                    : f.name === "email"
                      ? "email"
                      : "address-level2"
              }
            />
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="service">What do you have in mind?</Label>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger id="service" className="h-12 w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "Bathroom tiling",
              "Kitchens & splashbacks",
              "Wall & floor tiling",
              "Something else",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Tell us about your project</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder="Your space, ideas, approximate size and preferred timing…"
          className="bg-card"
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={state === "sending"}
        className="h-12 w-full rounded-full sm:w-fit sm:px-8"
      >
        {state === "sending" ? (
          <>
            <LoaderCircle className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send your enquiry <ArrowUpRight />
          </>
        )}
      </Button>
      <p className="text-xs leading-6 text-muted-foreground">
        Your details are kept private and used to respond to your project enquiry.
      </p>
    </form>
  );
}
