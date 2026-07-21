import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQRModalStore } from '@/store/useQRModalStore';
import { MapPin, QrCode, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

const MobileDashboardHeader = () => {
    const { user } = useAuthStore();
    const { openModal } = useQRModalStore();
    const { unreadCount } = useNotifications();

    const capitalizeWords = (str = "") =>
        str.replace(/\b\w/g, char => char.toUpperCase());

    const userName = capitalizeWords(user.name || user.parentName || "");
    const initials = userName.substring(0, 2).toUpperCase() || "ST";

    return (
        <div className="pt-8 pb-4 px-4 bg-background-secondary">
            <div className="bg-white rounded-[24px] p-2 flex items-center justify-between shadow-sm border border-gray-50">
                <Link to="/dashboard/profile" className="flex items-center gap-3 pl-1 hover:opacity-80 transition-opacity">
                    {user?.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={userName}
                            className="w-11 h-11 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                            {initials}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-text-primary leading-tight">
                            {userName}
                        </span>
                        <div className="flex items-center text-text-secondary gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{user?.roomNumber || 'Room No'}</span>
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-3 pr-3">
                    {user?.role === 'student' && (
                        <button 
                            onClick={openModal}
                            className="text-text-secondary hover:text-gray-600 transition-colors cursor-pointer active:scale-95"
                        >
                            <QrCode className="w-[22px] h-[22px]" strokeWidth={1.5} />
                        </button>
                    )}
                    <Link to="/dashboard/notifications" className="text-text-secondary hover:text-gray-600 relative transition-colors">
                        <Bell className="w-[22px] h-[22px]" strokeWidth={1.5} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MobileDashboardHeader;
