import { Suspense } from "react";
import { LiveAdminForm } from "@/components/social/live-admin-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getSettings } from "@/lib/settings";

export default function AdminLive() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="street-heading text-5xl">Live drop</h1>
      <Suspense fallback={<div className="h-64 animate-pulse bg-smoke" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await requireAdmin();
  const s = await getSettings();
  return <LiveAdminForm initial={s.live} />;
}
