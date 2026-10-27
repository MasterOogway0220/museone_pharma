import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MuseOne Pharma",
    short_name: "MuseOne",
    description: "Billing, stock and expiry tracking for pharmacies.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#0f5e4b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
