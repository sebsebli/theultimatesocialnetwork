"use client";

import dynamic from "next/dynamic";
import { TopicPageProps } from "@/components/topic-page";
import { ExploreSkeleton } from "@/components/skeletons";

const TopicPage = dynamic(
  () =>
    import("@/components/topic-page").then((m) => ({ default: m.TopicPage })),
  { ssr: false, loading: () => <ExploreSkeleton /> },
);

export default function TopicPageDynamic(props: TopicPageProps) {
  return <TopicPage {...props} />;
}
