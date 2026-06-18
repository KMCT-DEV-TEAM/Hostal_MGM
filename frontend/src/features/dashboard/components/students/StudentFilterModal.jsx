import React from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function StudentFilterModal({ onClose, onFilter }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Filter Students</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Course */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Course</label>
                        <select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"><option>Select</option></select>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Department</label>
                        <select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"><option>Select</option></select>
                    </div>

                    {/* Hostel */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Hostel</label>
                        <select className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-secondary"><option>Select</option></select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs mb-1.5 font-medium">Status</label>
                        <div className="bg-green-50/50 w-30 border border-green-100 rounded-lg p-2.5 text-xs text-success flex justify-between items-center cursor-pointer">
                            <span>Active</span>
                            <ChevronDown size={14} />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">Reset</button>
                        <button onClick={() => { if (onFilter) onFilter(); onClose(); }} className="flex-1 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors">Filter</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
