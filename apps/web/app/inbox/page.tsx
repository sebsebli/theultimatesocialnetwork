'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessagesTab } from '@/components/messages-tab';
import { Navigation } from '@/components/navigation';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DesktopRightSidebar } from '@/components/desktop-right-sidebar';

interface Notification {
  id: string;
  type: string;
  createdAt: string;
  actor?: {
    handle: string;
    displayName: string;
  };
  post?: {
    id: string;
    title?: string;
  };
  readAt?: string;
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [tabData, setTabData] = useState<{
    notifications: Notification[];
  }> ({
    notifications: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'notifications' && tabData.notifications.length === 0) {
      loadNotifications();
    }
  }, [activeTab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setTabData(prev => ({ ...prev, notifications: data }));
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      // Update local state optimistically
      setTabData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, readAt: new Date().toISOString() }))
      }));
    } catch (e) {
      console.error(e);
      loadNotifications(); // Reload on failure
    }
  };

  // ... (inside render)
  {activeTab === 'notifications' && tabData.notifications.length > 0 && (
    <button
      onClick={markAllRead}
      className="text-primary text-sm font-medium hover:underline"
    >
      Mark all read
    </button>
  )}

  // ... (inside Content section)
  {activeTab === 'notifications' && (
    <div className="space-y-4">
      {loading && tabData.notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary text-sm">Loading notifications...</p>
        </div>
      ) : tabData.notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary text-sm">No notifications yet.</p>
        </div>
      ) : (
        tabData.notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.post ? `/post/${notif.post.id}` : '#'}
                  className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {notif.actor?.displayName?.charAt(0) || 'N'}
                    </div>
                    <div className="flex-1">
                      <p className="text-paper text-sm">{formatNotificationText(notif)}</p>
                      <p className="text-tertiary text-xs mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notif.readAt && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && <MessagesTab />}
      </div>
      <Navigation />
        </div>
      </main>
      <DesktopRightSidebar />
    </div>
  );
}
