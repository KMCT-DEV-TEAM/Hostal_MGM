import React from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function StudentFilterModal({ onClose, onFilter }) {
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Filter Students"
            maxWidth="max-w-md"
            footer={
                <>
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">Reset</button>
                    <button onClick={() => { if (onFilter) onFilter(); onClose(); }} className="flex-1 py-2 bg-[#0A437A] text-white rounded-lg text-xs font-medium hover:bg-[#0A437A]/90 transition-colors">Filter</button>
                </>
            }
        >
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
            </div>
        </Modal>
    );
}
