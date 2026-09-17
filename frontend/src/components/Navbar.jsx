import { useQuery } from "@tanstack/react-query";
import { BellIcon, BellRingIcon, MenuIcon, MessageSquareIcon } from "lucide-react";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { getFriendRequests } from "../lib/api";
import ThemeSelector from "./ThemeSelector";

const Navbar = ({ showSidebarToggle = false, onSidebarToggle }) => {
    const { authUser } = useAuthUser();
    const location = useLocation();
    const isChatPage = location.pathname?.startsWith("/chat");
    
    const { data: friendRequests } = useQuery({
        queryKey: ["friendRequests"],
        queryFn: getFriendRequests,
        enabled: !!authUser,
    });
    const incomingFriendRequestCount = friendRequests?.incomingFriendRequests?.length || 0;
    const NotificationIcon = incomingFriendRequestCount > 0 ? BellRingIcon : BellIcon;

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-14 flex items-center text-base-content">
        <div className="w-full px-3 sm:px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {showSidebarToggle && (
                    <button className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary lg:hidden" onClick={onSidebarToggle}>
                        <MenuIcon className="h-5 w-5" />
                    </button>
                )}
                
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content shadow-md">
                        <MessageSquareIcon className="size-5 fill-current" />
                    </div>
                    <span className="text-xl font-bold text-base-content tracking-wide font-mono">
                        Digi<span className="text-primary">Talk</span>
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-2">
                <Link to="/notifications" className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary relative">
                    <NotificationIcon className="h-5 w-5" />
                    {incomingFriendRequestCount > 0 && (
                        <span className="badge badge-primary badge-sm absolute -right-1 -top-1 min-w-4 text-center">
                            {incomingFriendRequestCount}
                        </span>
                    )}
                </Link>

                <ThemeSelector />

                <Link to="/profile" className="avatar transition-transform hover:scale-105 ml-1">
                    <div className="w-8 h-8 rounded-full ring-2 ring-primary">
                        <img src={authUser?.profilePic} alt={authUser?.fullName} rel="noreferrer" />
                    </div>
                </Link>
            </div>
        </div>
    </nav>
  )
}

export default Navbar;
