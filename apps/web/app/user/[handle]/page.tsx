import { ProfilePage } from '@/components/profile-page';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getUser(handle: string) {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  const token = (await cookies()).get('token')?.value;
  
  if (!token) {
    redirect('/');
  }
  
  try {
    const res = await fetch(`${API_URL}/users/${handle}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch user', e);
  }
  return null;
}

export default async function UserPage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const user = await getUser(params.handle);

  if (!user) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-secondary">User not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          <ProfilePage user={user} />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
