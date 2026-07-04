import React from 'react';
import { AlignLeft, Calendar, Info, Clock, User, Activity } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';

export default function LogDetailView({ log, onClose }) {
    if (!log) return null;

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'warning':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Modal
            bottomSheetOnMobile={true}
            isOpen={true}
            onClose={onClose}
            maxWidth="max-w-5xl"
            title="System Log Details"
            subtitle="View complete audit trail details"
            icon={<Info size={24} />}
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Main Content Area */}
                <div className="md:col-span-7 space-y-4 md:space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Log Information</h3>
                        <p className="text-[11px] text-text-secondary mb-4">Detailed information about this action</p>
                        <div className="space-y-1">
                            <InfoRow label={<><Activity className="w-4 h-4 text-gray-400" /> Action</>}>{log.action}</InfoRow>
                            <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> User</>}>
                                {log.user?.name || log.user?.email || 'System'} <span className="text-gray-400 ml-1">({log.userRole})</span>
                            </InfoRow>
                            <InfoRow label={<><AlignLeft className="w-4 h-4 text-gray-400" /> Details</>}>
                                <div className="break-words max-w-full whitespace-pre-wrap mt-1 text-[#444444]">
                                    {log.details || 'N/A'}
                                </div>
                            </InfoRow>
                            {log.status && (
                                <InfoRow label={<><Info className="w-4 h-4 text-gray-400" /> Status</>}>
                                    <span className="flex items-center capitalize">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(log.status)}`}></span>
                                        {log.status}
                                    </span>
                                </InfoRow>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Time Context</h3>
                    <div className="space-y-1">
                        <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Date</>}>
                            {new Date(log.createdAt).toLocaleDateString()}
                        </InfoRow>
                        <InfoRow label={<><Clock className="w-4 h-4 text-gray-400" /> Time</>}>
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </InfoRow>
                    </div>
                </div>
            </div >
        </Modal >
    );
}
