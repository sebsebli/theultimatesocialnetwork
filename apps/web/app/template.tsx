'use client';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      {children}
    </div>
  );
}