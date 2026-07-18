import { ArrowLeft, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLayoutStore } from '@/store/useLayoutStore';

const MobilePageHeader = () => {
    const navigate = useNavigate();
    const title = useLayoutStore((state) => state.header.title);
    const showBack = useLayoutStore((state) => state.header.showBack);
    const onBack = useLayoutStore((state) => state.header.onBack);

    return (
        <div className="pt-8 pb-4 px-4 bg-background-secondary shrink-0">
            <div className="bg-white rounded-full py-4 px-4 flex items-center justify-between shadow-sm border border-gray-50">

                {/* Left Action (Back) */}
                <div className="w-8 flex items-center justify-start">
                    {showBack && (
                        <button
                            onClick={() => onBack ? onBack() : navigate(-1)}
                            className="text-text-secondary hover:text-text-primary transition-colors active:scale-95 p-1 -ml-1"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Center Title */}
                <h1 className="text-[15px] font-semibold text-text-primary flex-1 text-center truncate px-2">
                    {title}
                </h1>

                {/* Right Action (Notifications) */}
                <div className="w-8 flex items-center justify-end">
                    <Link to="/dashboard/notifications" className="text-text-secondary hover:text-gray-600 relative transition-colors active:scale-95 p-1 -mr-1">
                        <Bell className="w-5 h-5" strokeWidth={1.5} />
                        {/* Red unread indicator dot */}
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full border border-white"></span>
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default MobilePageHeader;
