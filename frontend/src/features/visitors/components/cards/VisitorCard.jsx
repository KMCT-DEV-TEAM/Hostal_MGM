import React from 'react';
import { Pencil, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateReadable, formatTime } from '@/utils/formatters';
import LeaveStatusBadge from '@/features/leaves/components/badges/LeaveStatusBadge';

const VisitorCard = ({ data, onEdit, isHistory }) => {
    const navigate = useNavigate();
    // Shared data extraction
    const visitorName = data?.visitorName || data?.visitor?.name || data?.name || 'Unknown';
    const relation = data?.relationship || data?.visitor?.relation || data?.relation || 'Visitor';
    const initials = visitorName.charAt(0).toUpperCase();

    console.log(data, "data");


    // History specific data
    const dateValue = data?.checkInTime ? formatDateReadable(data.checkInTime) : '--';
    const timeValue = data?.checkInTime ? formatTime(data.checkInTime) : '--';
    const purpose = data?.purpose || data?.reason || 'No values'; // Default fallback

    const handleCardClick = () => {
        const id = isHistory ? (data?.visitId || data?._id) : (data?._id || data?.id || data?.visitorId);
        console.log("Card clicked! ID:", id, "Data:", data);
        if (id) {
            navigate(`/dashboard/visitors/${id}`, { state: { isHistory } });
        } else {
            console.error("NO ID FOUND FOR NAVIGATION");
        }
    };

    return (
        <div 
            onClick={handleCardClick}
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col mb-3 active:scale-[0.99] transition-transform w-full cursor-pointer"
        >
            {/* Top Row: Avatar, Name, Relationship, and Status/Edit (Right Aligned) */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#D1E0EE] text-[#0A437A] flex items-center justify-center font-bold text-lg shrink-0">
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-text-primary text-[15px] leading-tight">{visitorName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Relationship: <span className="capitalize">{relation}</span></p>
                    </div>
                </div>

                {/* Right side section (Status and Edit button) */}
                <div className="flex items-center gap-2">
                    {/* Replaced custom status badge with LeaveStatusBadge */}
                    <LeaveStatusBadge status={data?.status || 'Inside'} className="w-auto! px-3 py-1 text-[11px]" />

                    {/* Edit Pencil icon (only for parents on requests tab) */}
                    {onEdit && !isHistory && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(data);
                            }}
                            className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* History specific rows */}
            {isHistory && (
                <>
                    <div className="w-full h-px bg-gray-100 my-4"></div>

                    {/* Middle Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Date</span>
                            </div>
                            <p className="text-[13px] font-semibold text-gray-900">{dateValue}</p>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Time</span>
                            </div>
                            <p className="text-[13px] font-semibold text-gray-900">{timeValue}</p>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-4"></div>

                    {/* Bottom Row */}
                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-gray-400 mb-1">Purpose</span>
                        <p className="text-[13px] font-medium text-gray-900">{purpose}</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default VisitorCard;
