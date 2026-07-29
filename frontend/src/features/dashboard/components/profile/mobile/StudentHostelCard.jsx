import React from 'react';
import { Building2, User, Phone } from 'lucide-react';

const StudentHostelCard = ({ hostel, block, room, checkInDate, warden }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary text-sm">Hostel Details</h3>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Hostel</p>
                        <p className="text-sm font-semibold text-text-primary truncate">{hostel}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Block</p>
                        <p className="text-sm font-semibold text-text-primary truncate">{block}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Room</p>
                        <p className="text-sm font-semibold text-text-primary truncate">{room}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                        <p className="text-sm font-semibold text-text-primary truncate">{checkInDate}</p>
                    </div>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Warden</p>
                            <p className="text-sm font-semibold text-text-primary">{warden}</p>
                        </div>
                    </div>
                    <button className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                        <Phone className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentHostelCard;
