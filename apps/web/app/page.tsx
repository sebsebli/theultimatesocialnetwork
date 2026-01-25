import { LandingPage } from "@/components/landing-page";
// import { cookies } from 'next/headers';
// import { redirect } from 'next/navigation';

export default async function Home() {
  // const token = (await cookies()).get('token')?.value;
  
  // If authenticated, redirect to home feed
  // if (token) {
  //   redirect('/home');
  // }
  
  // Show landing page for unauthenticated users
  return <LandingPage />;
}
