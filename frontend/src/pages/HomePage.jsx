import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareIcon } from "lucide-react";
import { StreamChat } from "stream-chat";
import FriendCard from "../components/FriendCard";
import NoFriendFound from "../components/NoFriendFound";
import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken, getUserFriends } from "../lib/api";
import { getMessagePreview } from "../lib/chat.js";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const EMPTY_FRIENDS = [];

const HomePage = () => {
  const { authUser } = useAuthUser();
  const [sortedFriends, setSortedFriends] = useState([]);
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(true);

  const { data: friends = EMPTY_FRIENDS, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    let isMounted = true;

    const loadFriendActivity = async () => {
      if (!friends.length) {
        setSortedFriends([]);
        setLoadingRecentActivity(false);
        return;
      }

      if (!authUser || !tokenData?.token) {
        setSortedFriends(friends);
        setLoadingRecentActivity(false);
        return;
      }

      setLoadingRecentActivity(true);

      try {
        const client = StreamChat.getInstance(apiKey);

        if (client.userID && client.userID !== authUser._id) {
          await client.disconnectUser();
        }

        if (!client.userID) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
            },
            tokenData.token,
          );
        }

        const channels = await client.queryChannels(
          {
            type: "messaging",
            members: { $in: [authUser._id] },
          },
          { last_message_at: -1 },
          {
            watch: false,
            state: true,
            limit: 100,
          },
        );

        const activityMap = new Map();

        channels.forEach((channel) => {
          const otherMember = Object.values(channel.state.members).find(
            (member) => member.user?.id !== authUser._id,
          )?.user;

          if (!otherMember?.id) return;

          activityMap.set(otherMember.id, {
            recentMessage: getMessagePreview(channel),
            lastMessageAt:
              channel.lastMessage()?.created_at || channel.data?.last_message_at || null,
          });
        });

        const nextFriends = [...friends].sort((first, second) => {
          const firstActivity = activityMap.get(first._id);
          const secondActivity = activityMap.get(second._id);
          const firstTime = firstActivity?.lastMessageAt
            ? new Date(firstActivity.lastMessageAt).getTime()
            : 0;
          const secondTime = secondActivity?.lastMessageAt
            ? new Date(secondActivity.lastMessageAt).getTime()
            : 0;

          if (firstTime !== secondTime) return secondTime - firstTime;
          return first.fullName.localeCompare(second.fullName);
        }).map((friend) => ({
          ...friend,
          recentMessage: activityMap.get(friend._id)?.recentMessage || "",
          lastMessageAt: activityMap.get(friend._id)?.lastMessageAt || null,
          unreadCount: activityMap.get(friend._id)?.unreadCount || 0,
        }));

        if (isMounted) {
          setSortedFriends(nextFriends);
        }
      } catch (error) {
        console.log("Error loading friend activity:", error);
        if (isMounted) {
          setSortedFriends(friends);
        }
      } finally {
        if (isMounted) {
          setLoadingRecentActivity(false);
        }
      }
    };

    loadFriendActivity();

    return () => {
      isMounted = false;
    };
  }, [authUser, friends, tokenData]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = sortedFriends.filter(
    (friend) =>
      friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.nativeLanguage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.learningLanguage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-base-100 min-h-[calc(100vh-3.5rem)] text-base-content p-3 sm:p-4">
      <div className="w-full space-y-4">
        {/* WhatsApp Top Search Container */}
        <div className="bg-base-200 p-3 rounded-xl border border-base-300 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <h1 className="text-lg font-bold text-base-content flex items-center gap-2">
              <MessageSquareIcon className="size-5 text-primary" />
              <span>Chats</span>
            </h1>
            <span className="text-xs text-base-content/70 font-medium bg-base-300 px-2 py-0.5 rounded-full">
              {filteredFriends.length} {filteredFriends.length === 1 ? "conversation" : "conversations"}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-base-100 text-base-content placeholder:text-base-content/50 text-sm py-2 pl-9 pr-4 rounded-lg border border-base-300 focus:outline-none focus:border-primary transition-colors"
            />
            <svg
              className="absolute left-3 top-2.5 size-4 text-base-content/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Chats List */}
        <div className="space-y-2">
          {isLoading || loadingRecentActivity ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="bg-base-200 rounded-xl p-8 text-center border border-base-300">
              <NoFriendFound />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredFriends.map((friend) => (
                <FriendCard
                  key={friend._id}
                  friend={friend}
                  recentMessage={friend.recentMessage}
                  lastMessageAt={friend.lastMessageAt}
                  unreadCount={friend.unreadCount}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
