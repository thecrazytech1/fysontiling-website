import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40),
  suburb: z.string().trim().min(2).max(120),
  service: z.enum([
    "Bathroom tiling",
    "Kitchens & splashbacks",
    "Wall & floor tiling",
    "Something else",
  ]),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => enquirySchema.parse(data))
  .handler(async ({ data }) => {
    // Narrow public intake: validation + honeypot + per-email limit. No public read/update capability.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { count, error: countError } = await supabaseAdmin
      .from("project_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if (countError) throw new Error("Your enquiry could not be sent. Please try again shortly.");
    if ((count ?? 0) >= 3)
      throw new Error("You have already sent several enquiries. Please try again in an hour.");
    const { website: _website, ...enquiry } = data;
    const { error } = await supabaseAdmin.from("project_enquiries").insert({ ...enquiry, email });
    if (error) {
      console.error("[enquiries] Insert failed:", error.message);
      throw new Error("Your enquiry could not be sent. Please try again shortly.");
    }
    // The enquiry is already saved, so a mail outage must not fail the submission.
    try {
      const { sendEnquiryEmails } = await import("@/lib/mail.server");
      await sendEnquiryEmails({ ...enquiry, email });
    } catch (mailError) {
      console.error("[enquiries] Email notification failed:", mailError);
    }
    return { success: true };
  });
