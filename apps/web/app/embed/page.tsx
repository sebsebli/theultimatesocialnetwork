import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicNav } from "@/components/landing/public-nav";
import { PublicFooter } from "@/components/landing/public-footer";

export const metadata: Metadata = {
  title: "Embed Citewalk Posts",
  description: "Embed Citewalk posts on your website with a simple iframe.",
  alternates: {
    canonical: "https://citewalk.com/embed",
  },
};

export default async function EmbedPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] font-serif">
      <PublicNav isAuthenticated={isAuthenticated} />
      <main className="max-w-[720px] mx-auto px-6 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-4 text-[#F2F2F2]">
          Embed Citewalk Posts
        </h1>
        <p className="text-[#A8A8AA] mb-8 text-lg">
          Embed any public Citewalk post on your website, blog, or article using
          a simple iframe.
        </p>

        <h2 className="text-xl font-bold mb-3 text-[#F2F2F2] mt-8">
          How to embed
        </h2>
        <p className="text-[#A8A8AA] mb-4">
          Copy this code and replace{" "}
          <code className="bg-[#121215] border border-[#1A1A1D] px-2 py-0.5 rounded text-[#E8B86D]">
            POST_ID
          </code>{" "}
          with the post ID:
        </p>
        <pre className="bg-[#121215] border border-[#1A1A1D] rounded-xl p-4 overflow-x-auto text-sm mb-8 text-[#A8A8AA]">
          <code>{`<iframe
  src="https://citewalk.com/api/embed/POST_ID"
  width="100%"
  height="250"
  style="border:none;border-radius:12px;max-width:550px"
  loading="lazy"
></iframe>`}</code>
        </pre>

        <h2 className="text-xl font-bold mb-3 text-[#F2F2F2] mt-8">
          Finding the Post ID
        </h2>
        <p className="text-[#A8A8AA] mb-4">
          The Post ID is the UUID in the post URL. For example, in{" "}
          <code className="bg-[#121215] border border-[#1A1A1D] px-2 py-0.5 rounded text-[#E8B86D]">
            citewalk.com/p/abc-123-def
          </code>
          , the ID is{" "}
          <code className="bg-[#121215] border border-[#1A1A1D] px-2 py-0.5 rounded text-[#E8B86D]">
            abc-123-def
          </code>
          .
        </p>

        <h2 className="text-xl font-bold mb-3 text-[#F2F2F2] mt-8">Styling</h2>
        <p className="text-[#A8A8AA] mb-4">
          The embed widget automatically matches Citewalk&apos;s dark theme. You
          can adjust the width and height to fit your layout. The widget is
          responsive and will scale down on mobile devices.
        </p>

        <h2 className="text-xl font-bold mb-3 text-[#F2F2F2] mt-8">
          Privacy & Performance
        </h2>
        <p className="text-[#A8A8AA] mb-4">
          Embeds are cached for 5 minutes to ensure fast loading. Only public
          posts from non-protected accounts can be embedded. Protected accounts
          and deleted posts will show a &quot;no longer available&quot; message.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
