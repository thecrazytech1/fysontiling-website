import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Check, EyeOff, LoaderCircle, LogOut, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  addTestimonial,
  checkAdmin,
  deleteEnquiry,
  deleteTestimonial,
  enquiryStatuses,
  listEnquiries,
  listTestimonials,
  setEnquiryStatus,
  setTestimonialApproved,
} from "@/lib/admin.functions";
import { FaqsAdmin, GalleryAdmin, ProjectsAdmin, TextAdmin } from "@/components/admin-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [{ title: "Admin — Fyson Tiling" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminPage,
});

const statusLabels: Record<(typeof enquiryStatuses)[number], string> = {
  new: "New",
  contacted: "Contacted",
  done: "Done",
};
const projectTypes = [
  "Bathroom tiling",
  "Kitchens & splashbacks",
  "Wall & floor tiling",
  "Something else",
] as const;

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const when = (iso: string) => format(new Date(iso), "d MMM yyyy, h:mm a");

// The session lives in browser storage, so everything here loads client-side after sign-in.
function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <section className="site-width py-14 md:py-20">
      <p className="eyebrow mb-3 text-primary">Admin</p>
      <h1 className="font-display text-5xl md:text-6xl">WEBSITE ADMIN.</h1>
      <div className="mt-10">
        {session === undefined ? (
          <LoaderCircle className="animate-spin text-muted-foreground" />
        ) : session ? (
          <AdminArea email={session.user.email ?? ""} />
        ) : (
          <SignIn />
        )}
      </div>
    </section>
  );
}

function SignIn() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (error) setError(error.message);
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="grid max-w-sm gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="h-12 bg-card"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 bg-card"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="h-12 rounded-full sm:w-fit sm:px-8">
        {busy ? <LoaderCircle className="animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function AdminArea({ email }: { email: string }) {
  const access = useQuery({
    queryKey: ["admin", "access", email],
    queryFn: () => checkAdmin(),
    retry: false,
  });
  const signOut = (
    <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
      <LogOut /> Sign out
    </Button>
  );
  if (access.isPending) return <LoaderCircle className="animate-spin text-muted-foreground" />;
  if (access.isError)
    return (
      <div className="grid gap-4">
        <p className="text-sm text-destructive">{email} doesn't have admin access.</p>
        <div>{signOut}</div>
      </div>
    );
  return (
    <Tabs defaultValue="enquiries">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="text">Page text</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {email} {signOut}
        </div>
      </div>
      <TabsContent value="enquiries" className="mt-8">
        <Enquiries />
      </TabsContent>
      <TabsContent value="reviews" className="mt-8">
        <Reviews />
      </TabsContent>
      <TabsContent value="projects" className="mt-8">
        <ProjectsAdmin />
      </TabsContent>
      <TabsContent value="gallery" className="mt-8">
        <GalleryAdmin />
      </TabsContent>
      <TabsContent value="text" className="mt-8">
        <TextAdmin />
      </TabsContent>
      <TabsContent value="faqs" className="mt-8">
        <FaqsAdmin />
      </TabsContent>
    </Tabs>
  );
}

function Enquiries() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const enquiries = useQuery({ queryKey: ["admin", "enquiries"], queryFn: () => listEnquiries() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
  const updateStatus = useMutation({
    mutationFn: (data: { id: string; status: (typeof enquiryStatuses)[number] }) =>
      setEnquiryStatus({ data }),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteEnquiry({ data: { id } }),
    onSettled: refresh,
  });

  if (enquiries.isPending) return <LoaderCircle className="animate-spin text-muted-foreground" />;
  if (enquiries.isError)
    return <p className="text-sm text-destructive">{errorText(enquiries.error)}</p>;
  const shown = enquiries.data.filter((e) => filter === "all" || e.status !== "done");
  const newCount = enquiries.data.filter((e) => e.status === "new").length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">{newCount} new</span>
        <Button
          size="sm"
          variant={filter === "open" ? "default" : "outline"}
          onClick={() => setFilter("open")}
        >
          Open
        </Button>
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
      </div>
      {(updateStatus.error || remove.error) && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(updateStatus.error ?? remove.error)}
        </p>
      )}
      {shown.length === 0 && <p className="text-sm text-muted-foreground">No enquiries to show.</p>}
      {shown.map((e) => (
        <article key={e.id} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">
                {e.name} {e.status === "new" && <Badge className="ml-2 align-middle">New</Badge>}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.service} · {e.suburb} · {when(e.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={e.status}
                onValueChange={(status) =>
                  updateStatus.mutate({
                    id: e.id,
                    status: status as (typeof enquiryStatuses)[number],
                  })
                }
              >
                <SelectTrigger className="w-36 bg-background" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enquiryStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete enquiry"
                onClick={() => confirm(`Delete the enquiry from ${e.name}?`) && remove.mutate(e.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{e.message}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a
              href={`mailto:${e.email}`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="size-4" /> {e.email}
            </a>
            {e.phone && (
              <a
                href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="size-4" /> {e.phone}
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Reviews() {
  const queryClient = useQueryClient();
  const reviews = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: () => listTestimonials(),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
  const setApproved = useMutation({
    mutationFn: (data: { id: string; approved: boolean }) => setTestimonialApproved({ data }),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteTestimonial({ data: { id } }),
    onSettled: refresh,
  });

  if (reviews.isPending) return <LoaderCircle className="animate-spin text-muted-foreground" />;
  if (reviews.isError)
    return <p className="text-sm text-destructive">{errorText(reviews.error)}</p>;

  return (
    <div className="grid gap-5">
      <AddReview onAdded={refresh} />
      <p className="text-xs text-muted-foreground">
        The reviews page shows the 12 most recent approved reviews.
      </p>
      {(setApproved.error || remove.error) && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(setApproved.error ?? remove.error)}
        </p>
      )}
      {reviews.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      )}
      {reviews.data.map((r) => (
        <article key={r.id} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">
                {r.name}{" "}
                <Badge variant={r.approved ? "default" : "outline"} className="ml-2 align-middle">
                  {r.approved ? "Published" : "Pending"}
                </Badge>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {[r.suburb, r.project_type, when(r.created_at)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={r.approved ? "outline" : "default"}
                onClick={() => setApproved.mutate({ id: r.id, approved: !r.approved })}
              >
                {r.approved ? (
                  <>
                    <EyeOff /> Hide
                  </>
                ) : (
                  <>
                    <Check /> Approve
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete review"
                onClick={() => confirm(`Delete the review from ${r.name}?`) && remove.mutate(r.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{r.review}</p>
        </article>
      ))}
    </div>
  );
}

function AddReview({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [projectType, setProjectType] = useState<(typeof projectTypes)[number]>("Bathroom tiling");
  const add = useMutation({
    mutationFn: (data: {
      name: string;
      suburb: string;
      review: string;
      projectType: (typeof projectTypes)[number];
    }) => addTestimonial({ data }),
    onSuccess: () => {
      onAdded();
      setOpen(false);
    },
  });
  if (!open)
    return (
      <div>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus /> Add a review
        </Button>
      </div>
    );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    add.mutate({
      name: String(form.get("name") ?? ""),
      suburb: String(form.get("suburb") ?? ""),
      review: String(form.get("review") ?? ""),
      projectType,
    });
  }
  return (
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-border bg-card/40 p-6">
      <p className="text-sm text-muted-foreground">
        Use the customer's own words. Reviews added here are published straight away.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="review-name">Customer name</Label>
          <Input
            id="review-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            className="h-12 bg-card"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="review-suburb">Suburb (optional)</Label>
          <Input id="review-suburb" name="suburb" maxLength={120} className="h-12 bg-card" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="review-type">Project type</Label>
        <Select
          value={projectType}
          onValueChange={(v) => setProjectType(v as (typeof projectTypes)[number])}
        >
          <SelectTrigger id="review-type" className="h-12 w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="review-text">Review</Label>
        <Textarea
          id="review-text"
          name="review"
          required
          minLength={10}
          maxLength={1200}
          rows={5}
          className="bg-card"
        />
      </div>
      {add.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(add.error)}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={add.isPending} className="rounded-full px-8">
          {add.isPending ? <LoaderCircle className="animate-spin" /> : "Publish review"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
