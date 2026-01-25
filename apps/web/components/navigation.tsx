'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/home') {
      return pathname === '/home';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-ink/90 backdrop-blur-lg border-t border-divider z-50 lg:hidden">
      <div className="max-w-[680px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/home"
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${
            isActive('/home') ? 'text-primary' : 'text-tertiary hover:text-paper'
          }`}
        >
          <svg className="w-6 h-6 mt-1" fill={isActive('/') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className={`text-xs font-medium mt-[-4px] ${isActive('/') ? 'text-primary' : 'text-tertiary'}`}>Home</span>
        </Link>
        <Link
          href="/explore"
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${
            isActive('/explore') ? 'text-primary' : 'text-tertiary hover:text-paper'
          }`}
        >
          <svg className="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className={`text-xs font-medium mt-[-4px] ${isActive('/explore') ? 'text-primary' : 'text-tertiary'}`}>Discover</span>
        </Link>
        <Link
          href="/compose"
          className="flex flex-col items-center justify-center w-12 h-full transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mt-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </Link>
        <Link
          href="/inbox"
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${
            isActive('/inbox') ? 'text-primary' : 'text-tertiary hover:text-paper'
          }`}
        >
          <svg className="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className={`text-xs font-medium mt-[-4px] ${isActive('/inbox') ? 'text-primary' : 'text-tertiary'}`}>Activity</span>
        </Link>
        <Link
          href="/user/dev"
          className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${
            isActive('/user') ? 'text-primary' : 'text-tertiary hover:text-paper'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-[10px] mt-1">
            D
          </div>
          <span className={`text-xs font-medium mt-[-4px] ${isActive('/user') ? 'text-primary' : 'text-tertiary'}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
