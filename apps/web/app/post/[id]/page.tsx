import { PostDetail } from '@/components/post-detail';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getPost(id: string) {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  const token = (await cookies()).get('token')?.value;
  
  // Prepare headers
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      cache: 'no-store',
      headers: headers,
    });
    
    if (res.ok) {
      return { status: 'ok', data: await res.json() };
    }
    
    if (res.status === 404 || res.status === 403) {
      // API now returns null (404) if not visible
       return { status: 'not-found' };
    }

  } catch (e) {
    console.error('Failed to fetch post', e);
  }
  return { status: 'error' };
}

export default async function PostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const result = await getPost(params.id);

  if (result.status === 'not-found' || !result.data) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
         <div className="text-center">
            <h1 className="text-2xl font-bold text-paper mb-2">Unavailable</h1>
            <p className="text-secondary">This post is private or does not exist.</p>
         </div>
      </div>
    );
  }
  
  const post = result.data;

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          <PostDetail post={post} />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
