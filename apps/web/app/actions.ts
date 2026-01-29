"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
// import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function createPostAction(formData: FormData) {
  const body = formData.get("body") as string;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body, visibility: "PUBLIC" }),
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: "Failed to create post" }));
      return {
        success: false,
        error: error.message || "Failed to create post",
      };
    }

    const post = await res.json();
    revalidatePath("/home");
    return { success: true, data: post };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}
