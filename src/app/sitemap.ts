import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://openlearning.app";

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/dashboard`,
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: `${baseUrl}/study/today`,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${baseUrl}/study/review`,
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: `${baseUrl}/progress`,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/profile`,
      changeFrequency: "monthly",
      priority: 0.6
    }
  ];
}
