'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function createPostAction(formData: FormData) {
  const body = formData.get('body') as string;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ body, visibility: 'PUBLIC' }),
  });

  if (!res.ok) {
    console.error('Failed to create post', await res.text());
    throw new Error('Failed to create post');
  }

  revalidatePath('/');
  return { success: true };
}
