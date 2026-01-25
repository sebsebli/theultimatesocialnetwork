'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PostItem } from './post-item';

interface ProfilePageProps {
  user: {
    id: string;
    handle: string;
    displayName: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    quoteReceivedCount: number;
    posts?: any[];
  };
  isSelf?: boolean;
}

export function ProfilePage({ user, isSelf = false }: ProfilePageProps) {
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'quotes' | 'collections'>('posts');
  const [loading, setLoading] = useState(false);
  const [tabData, setTabData] = useState<any>({
    replies: null,
    quotesReceived: null,
    collections: null,
  });

  useEffect(() => {
    if (activeTab === 'replies' && !tabData.replies) {
      loadReplies();
    } else if (activeTab === 'quotes' && !tabData.quotesReceived) {
      loadQuotes();
    } else if (activeTab === 'collections' && !tabData.collections) {
      loadCollections();
    }
  }, [activeTab]);

  const loadReplies = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setTabData((prev: any) => ({ ...prev, replies: data }));
      }
    } catch (error) {
      console.error('Failed to load replies', error);
    }
  };

  const loadQuotes = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/quotes`);
      if (res.ok) {
        const data = await res.json();
        setTabData((prev: any) => ({ ...prev, quotesReceived: data }));
      }
    } catch (error) {
      console.error('Failed to load quotes', error);
    }
  };

  const loadCollections = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/collections`);
      if (res.ok) {
        const data = await res.json();
        setTabData((prev: any) => ({ ...prev, collections: data }));
      }
    } catch (error) {
      console.error('Failed to load collections', error);
    }
  };

  const handleFollow = async () => {
    if (isSelf) return;
    
    setLoading(true);
    try {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${user.id}/follow`, { method });
      
      if (res.ok) {
        setFollowing(!following);
      }
    } catch (error) {
      console.error('Failed to toggle follow', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-secondary hover:text-paper">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <button className="text-secondary hover:text-paper">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-6 pt-6 pb-4 border-b border-divider">
        <div className="flex flex-col items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
            {user.displayName.charAt(0).toUpperCase()}
          </div>

          {/* Identity */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-paper mb-1">{user.displayName}</h1>
            <p className="text-tertiary text-sm">@{user.handle}</p>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-secondary text-[15px] text-center max-w-[320px] leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Action Buttons */}
          {!isSelf && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleFollow}
                disabled={loading}
                className={`px-6 py-2 rounded-full border transition-colors disabled:opacity-50 ${
                  following
                    ? 'bg-primary border-primary text-white'
                    : 'border-primary text-primary hover:bg-primary/10'
                }`}
              >
                {loading ? '...' : following ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={async () => {
                  // Create or open DM thread
                  try {
                    const res = await fetch('/api/messages/threads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user.id }),
                    });
                    if (res.ok) {
                      const thread = await res.json();
                      window.location.href = `/inbox?thread=${thread.id}`;
                    }
                  } catch (error) {
                    console.error('Failed to create thread', error);
                  }
                }}
                className="px-6 py-2 rounded-full border border-divider text-paper hover:bg-white/10 transition-colors"
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 pt-4">
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <p className="text-paper text-lg font-bold group-hover:text-primary transition-colors">
              {user.followerCount.toLocaleString()}
            </p>
            <p className="text-tertiary text-xs font-medium uppercase tracking-wider">Followers</p>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <p className="text-paper text-lg font-bold group-hover:text-primary transition-colors">
              {user.followingCount.toLocaleString()}
            </p>
            <p className="text-tertiary text-xs font-medium uppercase tracking-wider">Following</p>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <p className="text-paper text-lg font-bold group-hover:text-primary transition-colors">
              {user.quoteReceivedCount.toLocaleString()}
            </p>
            <p className="text-tertiary text-xs font-medium uppercase tracking-wider">Quotes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[60px] z-10 bg-ink border-b border-divider">
        <div className="flex px-6">
          {(['posts', 'replies', 'quotes', 'collections'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-paper'
                  : 'border-transparent text-tertiary hover:text-paper'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'posts' && (
          <div className="space-y-0">
            {user.posts && user.posts.length > 0 ? (
              user.posts.map((post: any) => (
                <PostItem key={post.id} post={post} isAuthor={isSelf} />
              ))
            ) : (
              <p className="text-secondary text-sm text-center py-8">No posts yet.</p>
            )}
          </div>
        )}

        {activeTab === 'replies' && (
          <div className="space-y-0">
            {tabData.replies && tabData.replies.length > 0 ? (
              tabData.replies.map((reply: any) => (
                <Link key={reply.id} href={`/post/${reply.postId}`}>
                  <div className="p-4 border-b border-divider hover:bg-white/5 transition-colors">
                    <p className="text-secondary text-sm">{reply.body}</p>
                    <p className="text-tertiary text-xs mt-2">Reply to post</p>
                  </div>
                </Link>
              ))
            ) : tabData.replies === null ? (
              <p className="text-secondary text-sm text-center py-8">Loading...</p>
            ) : (
              <p className="text-secondary text-sm text-center py-8">No replies yet.</p>
            )}
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-0">
            {tabData.quotesReceived && tabData.quotesReceived.length > 0 ? (
              tabData.quotesReceived.map((quote: any) => (
                <PostItem key={quote.id} post={quote} />
              ))
            ) : tabData.quotesReceived === null ? (
              <p className="text-secondary text-sm text-center py-8">Loading...</p>
            ) : (
              <p className="text-secondary text-sm text-center py-8">No quotes received yet.</p>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-4">
            {tabData.collections && tabData.collections.length > 0 ? (
              tabData.collections.map((collection: any) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <h3 className="font-semibold text-paper mb-1">{collection.title}</h3>
                  {collection.description && (
                    <p className="text-secondary text-sm">{collection.description}</p>
                  )}
                  <p className="text-tertiary text-xs mt-2">{collection.itemCount || 0} items</p>
                </Link>
              ))
            ) : tabData.collections === null ? (
              <p className="text-secondary text-sm text-center py-8">Loading...</p>
            ) : (
              <p className="text-secondary text-sm text-center py-8">No collections yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
