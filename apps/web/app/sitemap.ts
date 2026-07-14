import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://vioraa.tech",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
