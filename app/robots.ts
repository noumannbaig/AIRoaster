import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Individual roasts and post-payment pages are private to their owner.
        disallow: ["/api/", "/admin", "/roast/", "/success"],
      },
    ],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
