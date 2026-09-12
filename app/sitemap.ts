import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${env.appUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${env.appUrl}/roast`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${env.appUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${env.appUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
