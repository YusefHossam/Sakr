import { Suspense } from "react";
import type { Metadata } from "next";
import { Permanent_Marker } from "next/font/google";
import { cacheLife, cacheTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { GraffitiWall, type Tag } from "@/components/lab/graffiti-wall";
import { PageHeader } from "@/components/shop/page-header";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { WALL_TAG } from "@/lib/tags";
import { GraffitiTag } from "@/models/graffiti";

const marker = Permanent_Marker({ variable: "--font-marker", subsets: ["latin"], weight: "400" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wall");
  return { title: t("title") };
}

async function getTags(): Promise<Tag[]> {
  "use cache";
  cacheTag(WALL_TAG);
  cacheLife("minutes");
  await connectDB();
  const docs = await GraffitiTag.find().sort({ updatedAt: -1 }).limit(300).lean();
  return docs.map((d) => ({ id: String(d._id), text: d.text, color: d.color, x: d.x, y: d.y, rotate: d.rotate, size: d.size }));
}

export default async function WallPage() {
  const [t, tags] = await Promise.all([getTranslations("wall"), getTags()]);
  return (
    <div className={`mx-auto max-w-[1400px] px-4 pt-4 md:px-8 ${marker.variable}`}>
      <PageHeader eyebrow="SAKR LAB" title={t("title")} text={t("text")} />
      <Suspense fallback={<GraffitiWall tags={tags} loggedIn={false} />}>
        <WithSession tags={tags} />
      </Suspense>
    </div>
  );
}

async function WithSession({ tags }: { tags: Tag[] }) {
  return <GraffitiWall tags={tags} loggedIn={!!(await getSession())} />;
}
