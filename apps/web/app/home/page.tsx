import { ComposeEditor } from "@/components/compose-editor";
import { PostItem } from "@/components/post-item";
import { SavedByItem } from "@/components/saved-by-item";
import { Navigation } from "@/components/navigation";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/desktop-right-sidebar";
import Link from "next/link";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getPosts() {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  const token = (await cookies()).get('token')?.value;
  
  if (!token) {
    redirect('/');
  }
  
  try {
    const res = await fetch(`${API_URL}/feed?limit=20&offset=0`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.items || []);
    }
    // Handle error statuses
    if (res.status === 401) redirect('/');
  } catch (e) {
    console.error('Failed to fetch posts', e);
  }
  return []; 
}

export default async function HomeFeed() {
  const posts = await getPosts();

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
      <header className="sticky top-0 z-10 bg-ink border-b border-divider px-4 py-3 md:bg-ink/80 md:backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
                <path d="M13 5H17V19H13"></path>
              </svg>
            </div>
            <h1 className="text-base font-bold tracking-tight text-paper">Home</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search" className="p-2 text-tertiary hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link href="/settings" className="p-2 text-tertiary hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      
      <ComposeEditor />

      <div className="divide-y divide-divider pb-20 md:pb-0">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            <p className="text-base mb-6 font-normal">Your timeline is quiet.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/explore" className="px-4 py-3 text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors text-sm font-semibold">
                Explore topics
              </Link>
              <Link href="/search" className="px-4 py-3 text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors text-sm font-semibold">
                Find people
              </Link>
            </div>
          </div>
        ) : (
          posts.map((item: any) => {
            // Handle FeedItem format: { type: 'post' | 'saved_by', data: ... }
            if (item.type === 'saved_by' && item.data) {
              return (
                <SavedByItem
                  key={`saved-${item.data.post?.id || item.data.postId}-${item.data.userId}`}
                  userId={item.data.userId}
                  userName={item.data.userName}
                  collectionId={item.data.collectionId}
                  collectionName={item.data.collectionName}
                  post={item.data.post}
                />
              );
            } else if (item.type === 'post' && item.data) {
              // Regular post
              return <PostItem key={item.data.id} post={item.data} />;
            } else {
              // Fallback for direct post objects (backwards compatibility)
              return <PostItem key={item.id} post={item} />;
            }
          })
        )}
      </div>
      
      <Navigation />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
