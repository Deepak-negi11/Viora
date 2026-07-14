import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Viora — Spatial workspace for remote teams",
    short_name: "Viora",
    description: "Move through a shared 2D space, talk when teammates are nearby, and return to the same room anytime.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e9",
    theme_color: "#10233b",
    icons: [
      {
        src: "/viora-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
