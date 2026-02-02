"use client";

import dynamic from "next/dynamic";
import type { PostDetailProps } from "@/components/post-detail";
import { PostSkeleton } from "@/components/skeletons";

const PostDetail = dynamic(
  () =>
    import("@/components/post-detail").then((m) => ({ default: m.PostDetail })),
  { ssr: false, loading: () => <PostSkeleton /> },
);

export default function PostDetailDynamic(props: PostDetailProps) {
  return <PostDetail {...props} />;
}
