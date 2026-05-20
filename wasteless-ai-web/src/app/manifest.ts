import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WasteLessAI",
    short_name: "WasteLessAI",
    description: "AI-assisted household inventory, barcode scanning, and receipt OCR.",
    start_url: "/dashboard/scanning",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#059669",
    orientation: "portrait",
    categories: ["food", "productivity", "utilities"],
    icons: [
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
