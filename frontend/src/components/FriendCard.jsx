import React from 'react'
import { Link } from 'react-router';
import { getLanguageFlag } from '../lib/language.jsx';
import { formatChatTime } from '../lib/chat.js';
import UserSafetyMenu from './UserSafetyMenu.jsx';
import { CheckCheckIcon, MessageSquareIcon } from 'lucide-react';

const FriendCard = ({ friend, recentMessage, lastMessageAt, unreadCount = 0 }) => {
  return (
    <Link 
      to={friend.active !== false ? `/chat/${friend._id}` : "#"} 
      className="group block px-3 py-3 rounded-xl bg-base-200 hover:bg-base-300 border border-base-300 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="avatar relative shrink-0">
          <div className="w-12 h-12 rounded-full">
            <img src={friend.profilePic} alt={friend.fullName} className="object-cover" />
          </div>
          {friend.active !== false && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-base-200 rounded-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="truncate font-medium text-sm text-base-content group-hover:text-primary transition-colors">
                {friend.fullName}
              </h3>
              {friend.active === false && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-error/20 text-error">Deactivated</span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {lastMessageAt && (
                <span className={`text-[11px] ${unreadCount > 0 ? "text-primary font-semibold" : "opacity-60 text-base-content"}`}>
                  {formatChatTime(lastMessageAt, { month: "short", day: "numeric" })}
                </span>
              )}
              <UserSafetyMenu user={friend} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1 min-w-0 text-xs text-base-content/70">
              {recentMessage && <CheckCheckIcon className="size-3.5 text-info shrink-0" />}
              <span className="truncate">{recentMessage || "Tap to start conversation"}</span>
            </div>

            {unreadCount > 0 && (
              <span className="shrink-0 badge badge-primary badge-sm text-[10px] font-bold min-w-5 text-center">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="text-[10px] bg-base-300 text-base-content/80 px-1.5 py-0.5 rounded flex items-center gap-1">
              {getLanguageFlag(friend.nativeLanguage)} {capitalize(friend.nativeLanguage)}
            </span>
            <span className="text-[10px] bg-base-300 text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
              {getLanguageFlag(friend.learningLanguage)} {capitalize(friend.learningLanguage)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default FriendCard;

const capitalize = (value = "") => {
  if (!value) return "Not set";
  return value.charAt(0).toUpperCase() + value.slice(1);
};
