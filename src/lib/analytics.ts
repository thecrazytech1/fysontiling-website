type EventProperties = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(event: string, properties?: EventProperties): void;
    };
  }
}

function track(event: string, properties: EventProperties = {}) {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined") return;

  window.umami?.track(event, properties);
}

export const analytics = {
  track,

  cta(name: string, location: string) {
    track("CTA Clicked", { name, location });
  },

  formSubmitted(form: string) {
    track("Form Submitted", { form });
  },

  quoteRequested() {
    track("Quote Requested");
  },

  contact(method: "phone" | "email") {
    track("Contact Clicked", { method });
  },

  download(file: string) {
    track("Document Downloaded", { file });
  },

  signup() {
    track("Signup Completed");
  },
};
