import { Suspense } from "react";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

// Brand pages were retired: the shop is organised by section only. Old links land on a search for the brand.
export default function BrandRedirect({ params }: PageProps<"/[locale]/brands/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: Pick<PageProps<"/[locale]/brands/[slug]">, "params">) {
  await connection();
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  redirect({ href: `/search?q=${encodeURIComponent(slug.replace(/-/g, " "))}`, locale });
  return null;
}
