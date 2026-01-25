'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PostItem } from './post-item';
import { WhyLabel } from './why-label';

export function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'topics';
  const sort = searchParams.get('sort') || 'recommended';
  
  const [topics, setTopics] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [quotedNow, setQuotedNow] = useState<any[]>([]);
  const [deepDives, setDeepDives] = useState<any[]>([]);
  const [newsroom, setNewsroom] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContent();
  }, [tab, sort]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (sort) query.set('sort', sort);
      const queryString = query.toString() ? `?${query.toString()}` : '';

      if (tab === 'topics') {
        const res = await fetch(`/api/explore/topics${queryString}`);
        if (res.ok) {
          const data = await res.json();
          // Handle both array and object with items property
          setTopics(Array.isArray(data) ? data : (data.items || []));
        }
      } else if (tab === 'people') {
        const res = await fetch(`/api/explore/people${queryString}`);
        if (res.ok) {
          const data = await res.json();
          setPeople(Array.isArray(data) ? data : (data.items || []));
        }
      } else if (tab === 'quoted') {
        const res = await fetch(`/api/explore/quoted-now${queryString}`);
        if (res.ok) {
          const data = await res.json();
          setQuotedNow(Array.isArray(data) ? data : (data.items || []));
        }
      } else if (tab === 'deep-dives') {
        const res = await fetch(`/api/explore/deep-dives${queryString}`);
        if (res.ok) {
          const data = await res.json();
          setDeepDives(Array.isArray(data) ? data : (data.items || []));
        }
      } else if (tab === 'newsroom') {
        const res = await fetch(`/api/explore/newsroom${queryString}`);
        if (res.ok) {
          const data = await res.json();
          setNewsroom(Array.isArray(data) ? data : (data.items || []));
        }
      }
    } catch (error) {
      console.error('Failed to load content', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = () => {
    const newSort = sort === 'recommended' ? 'newest' : 'recommended';
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-0 px-4 pt-2">
      <h3 className="text-xl font-bold leading-tight text-left text-paper tracking-tight px-4 mb-4">
        Recommended for You
      </h3>

      {tab === 'topics' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">Loading topics...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">No topics found.</p>
            </div>
          ) : (
            topics.map((topic) => (
              <Link key={topic.id} href={`/topic/${topic.slug}`}>
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-stretch justify-end rounded-xl p-6 shadow-sm overflow-hidden border border-white/10 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-paper text-xl font-bold">{topic.title}</h4>
                    {topic.reasons && <WhyLabel reasons={topic.reasons} />}
                  </div>
                  <p className="text-secondary text-sm mb-4">Explore posts about {topic.title.toLowerCase()}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'people' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">Loading people...</p>
            </div>
          ) : people.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">No people found.</p>
            </div>
          ) : (
            people.map((person) => (
              <Link key={person.id} href={`/user/${person.handle}`}>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {person.displayName?.charAt(0) || person.handle.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-paper">{person.displayName || person.handle}</div>
                      <div className="text-sm text-tertiary">@{person.handle}</div>
                      {person.bio && (
                        <div className="text-sm text-secondary mt-1">{person.bio}</div>
                      )}
                    </div>
                    {person.reasons && <WhyLabel reasons={person.reasons} />}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'quoted' && (
        <div className="space-y-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">Loading quoted posts...</p>
            </div>
          ) : quotedNow.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">No trending quotes yet.</p>
            </div>
          ) : (
            quotedNow.map((post) => (
              <div key={post.id}>
                <PostItem post={post} />
                {post.reasons && <WhyLabel reasons={post.reasons} />}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'deep-dives' && (
        <div className="space-y-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">Loading deep dives...</p>
            </div>
          ) : deepDives.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">No deep dives found.</p>
            </div>
          ) : (
            deepDives.map((post) => (
              <div key={post.id}>
                <PostItem post={post} />
                {post.reasons && <WhyLabel reasons={post.reasons} />}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'newsroom' && (
        <div className="space-y-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">Loading newsroom...</p>
            </div>
          ) : newsroom.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">No newsroom posts yet.</p>
            </div>
          ) : (
            newsroom.map((post) => (
              <div key={post.id}>
                <PostItem post={post} />
                {post.reasons && <WhyLabel reasons={post.reasons} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
