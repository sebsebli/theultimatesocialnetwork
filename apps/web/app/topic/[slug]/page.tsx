import { TopicPage } from '@/components/topic-page';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getTopic(slug: string) {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  const token = (await cookies()).get('token')?.value;
  
  if (!token) {
    redirect('/');
  }
  
  try {
    const res = await fetch(`${API_URL}/topics/${slug}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch topic', e);
  }
  return null;
}

export default async function TopicPageRoute(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const topic = await getTopic(params.slug);

  if (!topic) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-secondary">Topic not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          <TopicPage topic={topic} />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
