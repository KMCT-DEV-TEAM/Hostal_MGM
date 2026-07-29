import React from 'react';
import { Settings, Globe, LogOut } from 'lucide-react';

const AccountSettingsCard = ({ setIsLogoutModalOpen }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background-secondary flex items-center justify-center">
                    <Settings className="w-4 h-4 text-text-secondary" />
                </div>
                <h3 className="font-semibold text-text-primary text-sm">Account settings</h3>
            </div>

            <div className="flex flex-col">
                <button className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-text-primary">Language</p>
                            <p className="text-[10px] font-medium text-gray-400 mt-0.5">English (US)</p>
                        </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>

                <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <LogOut className="w-4 h-4 text-danger" />
                        <p className="text-sm font-semibold text-danger">Logout</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AccountSettingsCard;
