import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://usehorizon.dev";

  const routes = [
    { path: "/",            priority: 1.0, changeFrequency: "daily"   as const },
    { path: "/etfs",        priority: 0.9, changeFrequency: "daily"   as const },
    { path: "/options",     priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/currencies",  priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/commodities", priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/futures",     priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/bonds",       priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/economy",     priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/global",      priority: 0.8, changeFrequency: "daily"   as const },
    { path: "/learn",       priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/about",       priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/contact",     priority: 0.4, changeFrequency: "yearly"  as const },
    { path: "/privacy",     priority: 0.3, changeFrequency: "yearly"  as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
