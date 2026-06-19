import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://usehorizon.dev";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/user pages and API routes shouldn't be indexed
      disallow: ["/login", "/profile", "/watchlists", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
