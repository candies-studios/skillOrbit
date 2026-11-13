import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/design-system", "/api"] }],
    sitemap: `${brand.siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
