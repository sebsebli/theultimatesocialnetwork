"use client";

import Link from "next/link";
import { Avatar } from "./avatar";
import { WhyLabel } from "./why-label";

interface UserCardProps {
  person: {
    id: string;
    handle: string;
    displayName?: string;
    bio?: string;
    reasons?: string[];
    isFollowing?: boolean;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
  onFollow?: () => void;
}

export function UserCard({ person, onFollow }: UserCardProps) {
  return (
    <Link href={`/user/${person.handle}`}>
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200 group active:scale-[0.99] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar
            avatarKey={person.avatarKey}
            avatarUrl={person.avatarUrl}
            displayName={person.displayName ?? person.handle}
            handle={person.handle}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-paper text-base group-hover:text-primary transition-colors truncate">
              {person.displayName || person.handle}
            </div>
            <div className="text-xs text-tertiary">@{person.handle}</div>
            {person.bio && (
              <div className="text-xs text-secondary mt-0.5 line-clamp-1">
                {person.bio}
              </div>
            )}
          </div>
        </div>
        {person.reasons && (
          <div className="ml-2 shrink-0">
            <WhyLabel reasons={person.reasons} />
          </div>
        )}
        {onFollow && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFollow();
            }}
            className={`ml-3 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              person.isFollowing
                ? "bg-primary border-primary text-white"
                : "border-primary text-primary hover:bg-primary/10"
            }`}
          >
            {person.isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </Link>
  );
}
