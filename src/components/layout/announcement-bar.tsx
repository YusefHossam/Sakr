import { getSettings } from "@/lib/settings";

/** Thin message strip above the header, controlled from Admin → Content. */
export async function AnnouncementBar() {
  const { announcement } = await getSettings();
  if (!announcement.active || !announcement.text) return null;
  return (
    <p className="relative z-[60] border-b border-ash bg-ink px-4 py-2 text-center text-xs tracking-[0.2em] text-bone" role="status">
      {announcement.text}
    </p>
  );
}
