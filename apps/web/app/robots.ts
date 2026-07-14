import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/signin",
        "/signup",
        "/spaces",
        "/space/",
        "/phaser",
        "/health",
        "/_health_disabled",
      ],
    },
    sitemap: "https://vioraa.tech/sitemap.xml",
    host: "https://vioraa.tech",
  };
}
