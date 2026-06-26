import React, { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import authApi from "@/features/auth/api/authApi";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import LogsViewer from "../components/LogsViewer";

const Logs = () => {
    // Password lock states
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleUnlock = async (e) => {
        e.preventDefault();
        if (!unlockPassword.trim()) return;

        setIsUnlocking(true);
        try {
            await authApi.verifyPassword({ password: unlockPassword });
            showSuccessToast('Identity verified. Access granted.');
            setIsUnlocked(true);
            setUnlockPassword("");
        } catch (error) {
            showErrorToast('Access Denied', error.response?.data?.message || 'Incorrect password');
            setUnlockPassword("");
        } finally {
            setIsUnlocking(false);
        }
    };

    if (!isUnlocked) {
        return (
            <div className="w-full h-[calc(100vh-82px)] flex items-center justify-center bg-[#F8FAFC] p-4 md:p-6 text-black">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Restricted Access</h2>
                    <p className="text-sm text-gray-500 text-center mb-8">
                        System logs contain highly sensitive audit information. Please verify your identity by entering your password.
                    </p>

                    <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
                        <div className="relative">
                            <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                value={unlockPassword}
                                onChange={(e) => setUnlockPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A]/20 transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUnlocking || !unlockPassword.trim()}
                            className="w-full py-3 bg-[#0A437A] hover:bg-[#0A437A]/90 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isUnlocking ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                "Unlock Logs"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">System Logs</h1>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">View application activity and audit trails</p>
                </div>
            </div>
            <LogsViewer />
        </div>
    );
};

export default Logs;
