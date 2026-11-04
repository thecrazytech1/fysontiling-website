import { useEffect } from "react";

const UMAMI_URL = "https://analytics.fysontiling.com.au/script.js";

const WEBSITE_ID = "ecc4eb06-886f-4aac-ae42-1001613a1e41";

export function UmamiTracker() {
  useEffect(() => {
    // Only load analytics in production.
    if (!import.meta.env.PROD) return;

    // Prevent duplicate scripts, including React StrictMode.
    if (document.getElementById("umami-tracker")) return;

    const script = document.createElement("script");

    script.id = "umami-tracker";
    script.src = UMAMI_URL;
    script.async = true;

    script.setAttribute("data-website-id", WEBSITE_ID);
    script.setAttribute("data-domains", "fysontiling.com.au,www.fysontiling.com.au");

    document.head.appendChild(script);
  }, []);

  return null;
}
