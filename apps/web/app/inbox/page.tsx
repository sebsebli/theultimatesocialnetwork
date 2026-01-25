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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'FOLLOW':
        return `${notif.actor?.displayName} started following you`;
      case 'REPLY':
        return `${notif.actor?.displayName} replied to your post`;
      case 'QUOTE':
        return `${notif.actor?.displayName} quoted your post`;
      case 'LIKE':
        return `${notif.actor?.displayName} liked your post`;
      case 'MENTION':
        return `${notif.actor?.displayName} mentioned you`;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <DesktopSidebar />
      <main className="flex-1 flex justify-center lg:max-w-4xl xl:max-w-5xl">
        <div className="w-full border-x border-divider">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-paper">Inbox</h1>
          {activeTab === 'notifications' && notifications.length > 0 && (
            <button
              onClick={async () => {
                await fetch('/api/notifications/read-all', { method: 'POST' });
                loadNotifications();
              }}
              className="text-primary text-sm font-medium hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[60px] z-10 bg-ink border-b border-divider">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-primary text-paper'
                : 'border-transparent text-tertiary hover:text-paper'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-primary text-paper'
                : 'border-transparent text-tertiary hover:text-paper'
            }`}
          >
            Messages
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-secondary text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary text-sm">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
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
