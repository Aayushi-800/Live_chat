import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BanIcon, BellIcon, BellRingIcon, MessageSquareIcon, LogOutIcon, UserPlusIcon, UserIcon, XIcon, ShieldAlertIcon } from "lucide-react";
import { getFriendRequests, logout } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const Sidebar = ({ mobileOpen = false, onClose }) => {
    const { authUser } = useAuthUser();
    const location = useLocation();
    const currentPath = location.pathname;
    const queryClient = useQueryClient();
    
    const { data: friendRequests } = useQuery({
        queryKey: ["friendRequests"],
        queryFn: getFriendRequests,
        enabled: !!authUser,
    });
    const incomingFriendRequestCount = friendRequests?.incomingFriendRequests?.length || 0;
    const NotificationIcon = incomingFriendRequestCount > 0 ? BellRingIcon : BellIcon;

    const { mutate: logoutMutation, isPending } = useMutation({
        mutationFn: logout,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] })
    });

  return (
    <>
    {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation overlay"
        />
    )}
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-base-200 text-base-content border-r border-base-300 flex flex-col h-screen transform transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* WhatsApp Top Header Bar */}
        <div className="h-14 px-3.5 bg-base-300 border-b border-base-300 flex items-center justify-between">
            <Link to="/profile" onClick={onClose} className="flex items-center gap-2.5 group">
                <div className="avatar">
                    <div className="w-9 h-9 rounded-full ring-2 ring-primary">
                        <img src={authUser?.profilePic} alt="Profile" />
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">{authUser?.fullName}</p>
                    <p className="text-[11px] opacity-70 truncate">Online</p>
                </div>
            </Link>
            
            <button className="btn btn-ghost btn-circle btn-xs text-base-content/70 lg:hidden" onClick={onClose}>
                <XIcon className="size-5" />
            </button>
        </div>

        {/* WhatsApp Sidebar Navigation Links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            <Link 
                to="/" 
                onClick={onClose} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentPath === "/" ? "bg-base-300 text-primary font-medium" : "text-base-content hover:bg-base-300/50"}`}
            >
                <MessageSquareIcon className="size-4" />
                <span>Chats</span>
            </Link>

            <Link 
                to="/add-friends" 
                onClick={onClose} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentPath === "/add-friends" ? "bg-base-300 text-primary font-medium" : "text-base-content hover:bg-base-300/50"}`}
            >
                <UserPlusIcon className="size-4" />
                <span>Discover People</span>
            </Link>

            <Link 
                to="/notifications" 
                onClick={onClose} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${currentPath === "/notifications" ? "bg-base-300 text-primary font-medium" : "text-base-content hover:bg-base-300/50"}`}
            >
                <NotificationIcon className="size-4" />
                <span>Notifications</span>
                {incomingFriendRequestCount > 0 && (
                    <span className="ml-auto badge badge-primary badge-sm font-bold min-w-5 text-center">
                        {incomingFriendRequestCount}
                    </span>
                )}
            </Link>

            <Link 
                to="/blocked-users" 
                onClick={onClose} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentPath === "/blocked-users" ? "bg-base-300 text-primary font-medium" : "text-base-content hover:bg-base-300/50"}`}
            >
                <BanIcon className="size-4" />
                <span>Blocked</span>
            </Link>

            {authUser?.isAdmin && (
                <Link 
                    to="/admin/manage-users" 
                    onClick={onClose} 
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentPath.startsWith("/admin") ? "bg-base-300 text-primary font-medium" : "text-base-content hover:bg-base-300/50"}`}
                >
                    <ShieldAlertIcon className="size-4 text-warning" />
                    <span>Admin Panel</span>
                </Link>
            )}
        </nav>

        {/* WhatsApp Sidebar Footer */}
        <div className="p-3 border-t border-base-300 bg-base-200 mt-auto">
            <button
              className="btn btn-outline btn-error btn-sm w-full flex items-center justify-center gap-2"
              onClick={logoutMutation}
              disabled={isPending}
            >
              <LogOutIcon className="size-4" />
              <span>{isPending ? "Logging out..." : "Log Out"}</span>
            </button>
        </div>
    </aside>
    </>
  )
}

export default Sidebar;
