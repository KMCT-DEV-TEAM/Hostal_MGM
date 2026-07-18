import React from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { formatDateReadable, formatTime } from '@/utils/formatters';

export default function VisitorDetailsMobileView({ data, onBack }) {
    useLayoutConfig({
        header: {
            variant: 'page',
            title: 'Visitor Details',
            showBack: true,
            onBack: onBack
        },
        footer: {
            visible: false
        }
    });

    if (!data) return null;

    // Handle structured Visit details payload vs raw Visitor profile payload
    const isVisit = !!data?.visitInformation;

    let visitorName = 'Unknown';
    let relation = 'N/A';
    let phone = 'N/A';
    let email = 'N/A';
    let idType = 'N/A';
    let idNumber = 'N/A';
    let visitDate = '--';
    let visitTime = '--';
    let purpose = '--';
    let checkInTimeStr = null;
    let checkOutTimeStr = null;

    if (isVisit) {
        const vInfo = data.visitorInformation;
        const viInfo = data.visitInformation;
        const qSum = data.quickSummary;

        visitorName = vInfo?.name || qSum?.visitorName || 'Unknown';
        relation = vInfo?.relation || 'N/A';
        phone = vInfo?.phone || 'N/A';
        email = vInfo?.email || 'N/A';
        idType = vInfo?.idProofType || 'N/A';
        idNumber = vInfo?.idNumber || 'N/A';

        visitDate = viInfo?.checkInTime ? formatDateReadable(viInfo.checkInTime) : '--';
        visitTime = viInfo?.checkInTime ? formatTime(viInfo.checkInTime) : '--';
        purpose = viInfo?.purpose || '--';

        checkInTimeStr = viInfo?.checkInTime ? `${formatDateReadable(viInfo.checkInTime)} | ${formatTime(viInfo.checkInTime)}` : null;
        checkOutTimeStr = viInfo?.checkOutTime ? `${formatDateReadable(viInfo.checkOutTime)} | ${formatTime(viInfo.checkOutTime)}` : null;
    } else {
        // Fallback for simple profile
        const vData = data?.visitorId && typeof data.visitorId === 'object' ? data.visitorId : data?.visitor || data;
        visitorName = vData?.name || data?.visitorName || data?.name || 'Unknown';
        relation = vData?.relation || data?.relationship || data?.relation || 'N/A';
        phone = vData?.phone || data?.phone || 'N/A';
        email = vData?.email || data?.email || 'N/A';
        idType = vData?.idProofType || data?.idProofType || 'N/A';
        idNumber = vData?.idNumber || data?.idNumber || 'N/A';

        visitDate = data?.checkInTime ? formatDateReadable(data.checkInTime) : '--';
        visitTime = data?.checkInTime ? formatTime(data.checkInTime) : '--';
        purpose = data?.purpose || data?.reason || '--';

        checkInTimeStr = data?.checkInTime ? `${formatDateReadable(data.checkInTime)} | ${formatTime(data.checkInTime)}` : null;
        checkOutTimeStr = data?.checkOutTime ? `${formatDateReadable(data.checkOutTime)} | ${formatTime(data.checkOutTime)}` : null;
    }

    const renderField = (label, value) => (
        <div className="flex flex-col mb-4 last:mb-0">
            <span className="text-[11px] font-medium text-text-secondary mb-1">{label}</span>
            <span className="text-[13px] font-medium text-text-primary">{value}</span>
        </div>
    );

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-50/50 p-4 space-y-4 pb-20">

            {/* BASIC INFO CARD */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                    Basic Info
                </h4>

                {renderField("Name", visitorName)}
                {renderField("Phone Number", phone)}
                {renderField("Email Address", email)}
                {renderField("Relation", relation)}
                {renderField("Id Proof type", idType)}
                {renderField("Id Number", idNumber)}
            </div>

            {/* VISIT DETAILS CARD */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                    Visit Details
                </h4>

                <div className="flex items-center gap-6 mb-4">
                    <div className="flex-1">
                        <span className="block text-[11px] font-medium text-gray-400 mb-1">Date</span>
                        <span className="block text-[13px] font-medium text-text-primary">{visitDate}</span>
                    </div>
                    <div className="flex-1 border-l border-gray-100 pl-6">
                        <span className="block text-[11px] font-medium text-gray-400 mb-1">Time</span>
                        <span className="block text-[13px] font-medium text-text-primary">{visitTime}</span>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100 my-4"></div>

                <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-gray-400 mb-1">Purpose</span>
                    <span className="text-[13px] font-medium text-text-primary">{purpose}</span>
                </div>
            </div>

            {/* VISIT TIMELINE CARD */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
                    Visit Timeline
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-gray-100">

                    {/* Check Out Step (Top, since it's the latest in reverse chron, or shown first) */}
                    <div className="relative">
                        <div className="absolute -left-6 top-1.5 w-[11px] h-[11px] bg-white border-2 border-danger rounded-full flex items-center justify-center z-10">
                            <div className="w-1.5 h-1.5 bg-danger rounded-full"></div>
                        </div>
                        <h4 className="text-sm font-semibold text-text-primary mb-0.5">Check Out</h4>
                        <p className="text-xs text-gray-400">{checkOutTimeStr || 'Pending'}</p>
                    </div>

                    {/* Check In Step */}
                    <div className="relative">
                        <div className="absolute -left-6 top-1.5 w-[11px] h-[11px] bg-white border-2 border-success rounded-full flex items-center justify-center z-10">
                            <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                        </div>
                        <h4 className={`text-sm font-semibold mb-0.5 ${checkOutTimeStr ? 'text-gray-400' : 'text-text-primary'}`}>Check In</h4>
                        <p className="text-xs text-gray-400">{checkInTimeStr || 'Pending'}</p>
                    </div>

                </div>
            </div>

        </div>
    );
}
