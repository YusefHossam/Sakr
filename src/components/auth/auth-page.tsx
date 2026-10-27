import { getTranslations } from "next-intl/server";
import { AuthForm } from "./auth-form";

export async function AuthPage({ mode }: { mode: "login" | "register" }) {
  const t = await getTranslations("auth");
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-8 px-4 py-16">
      <div className="smoke-layer opacity-50" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-2 text-center">
        <p className="chrome-text font-gothic text-6xl" dir="ltr">Sakr</p>
        <h1 className="street-heading text-4xl">{mode === "login" ? t("loginTitle") : t("registerTitle")}</h1>
      </div>
      <div className="relative">
        <AuthForm mode={mode} />
      </div>
    </div>
  );
}
