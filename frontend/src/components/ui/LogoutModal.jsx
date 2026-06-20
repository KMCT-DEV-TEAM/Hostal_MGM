import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-[340px] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <LogOut className="w-8 h-8 text-danger ml-1" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                        {t('logout')}
                    </h3>

                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        {t('Are you sure you want to logout', 'Are you sure you want to log out of your account?')}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 px-4 bg-danger hover:bg-danger/90 text-white font-semibold rounded-xl text-sm transition-colors duration-200 shadow-sm shadow-red-200"
                        >
                            {t('logout')}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors duration-200 border border-gray-200"
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
