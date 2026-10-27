import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/terms", "/privacy"].map((path) => ({ url: `${site.url}${path}`, changeFrequency: "monthly", priority: path ? 0.3 : 1 }));
}
