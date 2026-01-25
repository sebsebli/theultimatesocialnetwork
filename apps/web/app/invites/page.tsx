'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';

interface Invite {
  code: string;
  createdAt: string;
}

interface InviteStatus {
  codes: Invite[];
  remaining: number;
}

export default function InvitesPage() {
  const [status, setStatus] = useState<InviteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await fetch('/api/invites/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchInvites();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/sign-in?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
          <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="lg:hidden text-secondary hover:text-paper">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-paper">Invite Friends</h1>
            </div>
          </header>

          <div className="p-6 max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-2">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-paper">Build the Network</h2>
              <p className="text-secondary max-w-md mx-auto">
                CITE is built on trust. Invite people whose writing and thinking you value.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-sm text-tertiary uppercase tracking-wider font-semibold mb-2">Invites Remaining</div>
              <div className="text-4xl font-bold text-primary mb-6">
                {loading ? '...' : status?.remaining}
              </div>
              
              <button
                onClick={generateCode}
                disabled={!status || status.remaining <= 0 || generating}
                className="w-full sm:w-auto px-8 h-12 bg-primary hover:bg-[#7d8b9d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all active:scale-[0.98]"
              >
                {generating ? 'Generating...' : 'Generate New Code'}
              </button>
            </div>

            {status?.codes && status.codes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-secondary ml-1">Active Codes</h3>
                <div className="space-y-3">
                  {status.codes.map((invite) => (
                    <div key={invite.code} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-primary/30 transition-colors">
                      <div className="font-mono text-lg text-paper tracking-wider">
                        {invite.code}
                      </div>
                      <button
                        onClick={() => copyLink(invite.code)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                          copied === invite.code 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-white/5 text-secondary hover:text-primary hover:bg-white/10'
                        }`}
                      >
                        {copied === invite.code ? 'Copied Link!' : 'Copy Link'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
