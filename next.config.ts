import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // The PDF report route reads the logo font from disk.
  outputFileTracingIncludes: { "/api/admin/reports": ["./src/assets/fonts/**"] },
  images: {
    // Product images already come resized (Shopify CDN `width=` or local files); skipping the optimizer
    // keeps the site inside free hosting limits.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
