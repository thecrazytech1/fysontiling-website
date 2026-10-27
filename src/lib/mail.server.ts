// Server-only SMTP mailer. Load inside server handlers: const { sendEnquiryEmails } = await import("@/lib/mail.server");
import nodemailer from "nodemailer";
import { contact } from "@/lib/site-data";

type Enquiry = {
  name: string;
  email: string;
  phone: string;
  suburb: string;
  service: string;
  message: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing mail environment variable: ${name}`);
  return value;
}

let transport: nodemailer.Transporter | undefined;

function getTransport() {
  if (!transport) {
    const port = Number(process.env["SMTP_PORT"] ?? 587);
    transport = nodemailer.createTransport({
      host: requireEnv("SMTP_HOST"),
      port,
      // Port 465 uses implicit TLS; 587/25 upgrade with STARTTLS.
      secure: process.env["SMTP_SECURE"] ? process.env["SMTP_SECURE"] === "true" : port === 465,
      auth: { user: requireEnv("SMTP_USER"), pass: requireEnv("SMTP_PASS") },
    });
  }
  return transport;
}

// Visitor input goes into headers, so collapse any line breaks.
const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

export async function sendEnquiryEmails(enquiry: Enquiry) {
  const from = requireEnv("MAIL_FROM");
  const notifyTo = requireEnv("ENQUIRY_NOTIFY_TO");
  const mailer = getTransport();
  const name = oneLine(enquiry.name);

  const notification = mailer.sendMail({
    from,
    to: notifyTo,
    replyTo: { name, address: enquiry.email },
    subject: `New enquiry: ${oneLine(enquiry.service)} in ${oneLine(enquiry.suburb)} (${name})`,
    text: [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone || "Not given"}`,
      `Suburb: ${enquiry.suburb}`,
      `Service: ${enquiry.service}`,
      "",
      enquiry.message,
      "",
      "Reply to this email to answer the customer directly.",
    ].join("\n"),
  });

  // Deliberately omits the visitor's free-text message so the form can't be used
  // to send arbitrary content to someone else's address.
  const confirmation = mailer.sendMail({
    from,
    to: { name, address: enquiry.email },
    replyTo: notifyTo,
    subject: "Thanks for your enquiry — Fyson Tiling",
    text: [
      `Hi ${name},`,
      "",
      `Thanks for getting in touch about ${oneLine(enquiry.service).toLowerCase()} in ${oneLine(enquiry.suburb)}. Shaun has received your enquiry and will be in touch soon.`,
      "",
      `If it's urgent, you can call Shaun on ${contact.phoneDisplay}.`,
      "",
      "Fyson Tiling",
    ].join("\n"),
  });

  const results = await Promise.allSettled([notification, confirmation]);
  for (const result of results) {
    if (result.status === "rejected") console.error("[mail] Enquiry email failed:", result.reason);
  }
}
