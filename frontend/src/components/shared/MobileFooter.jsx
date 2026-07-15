import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, FileEdit, Tag } from 'lucide-react';

const MobileFooter = () => {
    const navItems = [
        { path: '/dashboard', icon: Home, end: true },
        { path: '/dashboard/attendance', icon: Calendar },
        { path: '/dashboard/leaves', icon: FileEdit },
        { path: '/dashboard/complaints', icon: Tag }
    ];

    return (
        <div className="pb-6 pt-3 px-6 bg-background-secondary">
            <div className="bg-white rounded-[32px] p-2 flex items-center justify-between shadow-sm border border-gray-50">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-text-secondary hover:text-gray-600 hover:bg-gray-50'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2 : 1.5} />
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileFooter;