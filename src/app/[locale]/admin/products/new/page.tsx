import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { NewProductForm } from "@/components/admin/product-forms";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewProduct() {
  const t = await getTranslations("admin.products");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">{t("new")}</h1>
      <Suspense fallback={null}>
        <Guarded />
      </Suspense>
    </div>
  );
}

async function Guarded() {
  await requireAdmin();
  return <NewProductForm />;
}
