import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import useAuthUser from '../hooks/useAuthUser';
import { useQuery } from '@tanstack/react-query';
import { getFriendRequests, getStreamToken, getUserFriends } from '../lib/api';
import { formatChatTime, getMessagePreview, getUnreadCount } from '../lib/chat.js';
import { StreamChat } from "stream-chat";

import { Channel, ChannelHeader, MessageList, MessageInput, Thread, Chat, Window } from "stream-chat-react";
import toast from 'react-hot-toast';
import ChatLoader from '../components/ChatLoader';
import CallButton from '../components/CallButton';
import { BellIcon, BellRingIcon, HomeIcon, MenuIcon, MessageSquareIcon, XIcon } from 'lucide-react';

const apiKey = import.meta.env.VITE_STREAM_API_KEY
const EMPTY_FRIENDS = [];
const getStreamImage = (image) =>
  typeof image === "string" && /^https?:\/\//i.test(image) ? image : undefined;

const ChatPage = () => {
  const { id: targetUserId } = useParams()
  const navigate = useNavigate();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [channelMeta, setChannelMeta] = useState({});
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();
  const { data: friends = EMPTY_FRIENDS, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: !!authUser,
  });
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    enabled: !!authUser,
  });
  const {data:tokenData} = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser
  })
  const incomingFriendRequestCount = friendRequests?.incomingFriendRequests?.length || 0;
  const NotificationIcon = incomingFriendRequestCount > 0 ? BellRingIcon : BellIcon;
  const activeFriend = friends.find((friend) => friend._id === targetUserId);

  useEffect(() => {
    if (loadingFriends) return;

    if (!activeFriend) {
      toast.error("This chat is unavailable.");
      navigate("/", { replace: true });
    }
  }, [activeFriend, loadingFriends, navigate]);

  useEffect(()=> {
    let isMounted = true;

    const initChat = async ()=>{
      if(!authUser || !tokenData?.token || !targetUserId || !activeFriend) return;

      setLoading(true);
      try{

        const client = StreamChat.getInstance(apiKey);

        if (client.userID && client.userID !== authUser._id) {
          await client.disconnectUser();
        }

        if (!client.userID) {
          await client.connectUser({
            id: authUser._id,
            name: authUser.fullName,
            image: getStreamImage(authUser.profilePic),
          }, tokenData.token);
        }

        const channelId = [authUser._id, targetUserId].sort().join("-")

        const channels = await client.queryChannels(
          {
            type: "messaging",
            members: { $in: [authUser._id] },
          },
          { last_message_at: -1 },
          {
            watch: true,
            state: true,
            limit: 30,
          },
        );

        const metadata = {};
        channels.forEach((item) => {
          const otherMember = Object.values(item.state.members).find(
            (member) => member.user?.id !== authUser._id,
          )?.user;

          if (!otherMember?.id) return;

          metadata[otherMember.id] = {
            lastMessage: getMessagePreview(item),
            lastMessageAt: item.lastMessage()?.created_at || item.data?.last_message_at,
            unreadCount: getUnreadCount(item),
          };
        });

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        })

        await currChannel.watch();

        if (!isMounted) return;

        setChatClient(client);
        setChannel(currChannel);
        setChannelMeta({
          ...metadata,
          [targetUserId]: {
            lastMessage: getMessagePreview(currChannel),
            lastMessageAt: currChannel.lastMessage()?.created_at || currChannel.data?.last_message_at,
            unreadCount: getUnreadCount(currChannel),
          },
        });

      }catch(error){
        console.log("Error initializing chat:", error);
        toast.error(error?.message || "Failed to load chat. Please try again later.")

      }finally{
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    initChat();

    return () => {
      isMounted = false;
    };
  },[tokenData, authUser, targetUserId, activeFriend] )

  const handleVideoCall = async () => {
    if (!channel?.id) return;

    const callUrl = `${window.location.origin}/call/${channel.id}`;

    try {
      await channel.sendMessage({
        text: `Starting a video call, join me here: ${callUrl}`,
      });

      toast.success("Video call link sent to the chat!")
    } catch (error) {
      toast.error(error?.message || "Could not start the video call.");
    }
  }

  if(loading || loadingFriends || !activeFriend || !chatClient || !channel) return <ChatLoader />;
  return (
    <div className='h-[calc(100vh-3.5rem)] bg-base-100 text-base-content overflow-hidden flex flex-col'>
      <div className='h-full flex flex-1 min-h-0 min-w-0'>
      <Chat client={chatClient} theme="str-chat__theme-custom">
        <Channel channel={channel}>
          <div className='flex h-full min-h-0 w-full'>
            {friendsSidebarOpen && (
              <button
                className='fixed inset-0 z-40 bg-black/60 lg:hidden'
                onClick={() => setFriendsSidebarOpen(false)}
                aria-label='Close conversations overlay'
              />
            )}
            
            {/* WhatsApp Web Left Chat List Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-base-200 border-r border-base-300 flex flex-col transform transition-transform duration-200 lg:static lg:z-auto lg:flex lg:translate-x-0 ${friendsSidebarOpen ? "translate-x-0" : "-translate-x-full"} shrink-0`}>
              <div className='h-14 px-3.5 bg-base-300 border-b border-base-300 flex items-center justify-between'>
                <div className="flex items-center gap-2">
                  <MessageSquareIcon className="size-5 text-primary" />
                  <span className="font-bold text-base text-base-content">Chats</span>
                </div>
                <button className='btn btn-ghost btn-circle btn-xs text-base-content/70 lg:hidden' onClick={() => setFriendsSidebarOpen(false)}>
                  <XIcon className='size-4' />
                </button>
              </div>

              {/* Chat Sidebar List */}
              <div className='flex-1 space-y-1 overflow-y-auto p-2'>
                {friends.length === 0 ? (
                  <div className='rounded-xl bg-base-300 p-4 text-center border border-base-300 mt-4'>
                    <MessageSquareIcon className='mx-auto size-6 text-primary' />
                    <p className='mt-2 text-xs text-base-content/70'>Add friends to start chatting.</p>
                  </div>
                ) : (
                  friends.map((friend) => {
                    const isActive = friend._id === targetUserId;

                    return (
                      <Link
                        key={friend._id}
                        to={`/chat/${friend._id}`}
                        onClick={() => setFriendsSidebarOpen(false)}
                        className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                          isActive
                            ? "bg-base-300 text-primary font-medium"
                            : "hover:bg-base-300/50 text-base-content"
                        }`}
                      >
                        <div className='avatar shrink-0 relative'>
                          <div className='w-11 h-11 rounded-full'>
                            <img src={friend.profilePic} alt={friend.fullName} />
                          </div>
                          {friend.active !== false && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-base-200 rounded-full" />
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex min-w-0 items-center justify-between gap-1'>
                            <p className={`truncate text-sm font-medium ${isActive ? "text-primary" : "text-base-content"}`}>
                              {friend.fullName}
                            </p>
                            <span className='shrink-0 text-[11px] opacity-60'>
                              {formatChatTime(channelMeta[friend._id]?.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className='truncate text-xs opacity-70'>
                              {channelMeta[friend._id]?.lastMessage || "Tap to chat"}
                            </p>
                            {channelMeta[friend._id]?.unreadCount > 0 && (
                              <span className='shrink-0 badge badge-primary badge-sm text-[10px] font-bold min-w-4 text-center'>
                                {channelMeta[friend._id].unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </aside>

            {/* WhatsApp Main Active Chat Canvas */}
            <div className='flex min-w-0 flex-1 border-l border-base-300 flex-col bg-base-100 wa-chat-bg'>
              <div className='h-14 bg-base-200 border-b border-base-300 flex items-center justify-between px-3 sm:px-4 shrink-0 z-10'>
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    className='btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary lg:hidden'
                    onClick={() => setFriendsSidebarOpen(true)}
                  >
                    <MenuIcon className='size-5' />
                  </button>
                  
                  <div className="avatar">
                    <div className="w-9 h-9 rounded-full ring-1 ring-primary">
                      <img src={activeFriend?.profilePic} alt={activeFriend?.fullName} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-base-content truncate">{activeFriend?.fullName}</h2>
                    <p className="text-[11px] text-primary">Online</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CallButton handleVideoCall={handleVideoCall} />
                </div>
              </div>

              {/* Mobile Quick Contacts Strip */}
              <div className='border-b border-base-300 bg-base-200 px-2.5 py-1.5 lg:hidden shrink-0'>
                <div className='flex gap-2 overflow-x-auto pb-0.5'>
                  {friends.map((friend) => {
                    const isActive = friend._id === targetUserId;

                    return (
                      <Link
                        key={friend._id}
                        to={`/chat/${friend._id}`}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                          isActive
                            ? "bg-primary text-primary-content font-medium"
                            : "bg-base-300 text-base-content/80 hover:text-base-content"
                        }`}
                      >
                        <div className='avatar'>
                          <div className='w-5 h-5 rounded-full'>
                            <img src={friend.profilePic} alt={friend.fullName} />
                          </div>
                        </div>
                        <span className='max-w-20 truncate'>{friend.fullName}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Message List and Input Window */}
              <Window>
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </div>
        </Channel>
      </Chat>
      </div>
    </div>
  )
}

export default ChatPage
