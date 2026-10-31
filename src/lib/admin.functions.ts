import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const enquiryStatuses = ["new", "contacted", "done"] as const;
const projectTypes = [
  "Bathroom tiling",
  "Kitchens & splashbacks",
  "Wall & floor tiling",
  "Something else",
] as const;

// A valid Supabase session is not enough: only emails listed in ADMIN_EMAILS get in,
// so an account created by anyone else can never read enquiries.
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const email =
      typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : "";
    const allowed = (process.env["ADMIN_EMAILS"] ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!email || !allowed.includes(email)) throw new Error("Unauthorized: Not an admin account");
    return next();
  });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function check<T>({ data, error }: { data: T; error: { message: string } | null }) {
  if (error) throw new Error(error.message);
  return data;
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => ({ ok: true }));

export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(
    async () =>
      check(
        await (
          await admin()
        )
          .from("project_enquiries")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ) ?? [],
  );

export const setEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(enquiryStatuses) }).parse(data),
  )
  .handler(async ({ data }) => {
    check(
      await (
        await admin()
      )
        .from("project_enquiries")
        .update({ status: data.status })
        .eq("id", data.id),
    );
    return { success: true };
  });

export const deleteEnquiry = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    check(await (await admin()).from("project_enquiries").delete().eq("id", data.id));
    return { success: true };
  });

export const listTestimonials = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(
    async () =>
      check(
        await (
          await admin()
        )
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ) ?? [],
  );

export const setTestimonialApproved = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    check(
      await (
        await admin()
      )
        .from("testimonials")
        .update({ approved: data.approved })
        .eq("id", data.id),
    );
    return { success: true };
  });

export const addTestimonial = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        suburb: z.string().trim().max(120),
        projectType: z.enum(projectTypes),
        review: z.string().trim().min(10).max(1200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    check(
      await (await admin()).from("testimonials").insert({
        name: data.name,
        suburb: data.suburb,
        project_type: data.projectType,
        review: data.review,
        approved: true,
      }),
    );
    return { success: true };
  });

export const deleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    check(await (await admin()).from("testimonials").delete().eq("id", data.id));
    return { success: true };
  });
