import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPage } from "@/components/auth/auth-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle"), robots: { index: false } };
}

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
