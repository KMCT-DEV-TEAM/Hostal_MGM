import React from 'react';
import Modal from '@/components/ui/Modal';

export default function ParentDetailsModal({ parent, onClose }) {
    if (!parent) return null;
    console.log("parent object:", parent.status);

    return (
        <Modal isOpen={true} onClose={onClose} maxWidth="max-w-5xl">                {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                        <span className="font-bold text-xl uppercase">
                            {parent.parentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{parent.parentName}</h1>
                        <p className="text-gray-400 text-sm">Parent - {parent.student?.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-primary mb-1">Basic Info</h3>
                        <p className="text-xs text-gray-400 mb-6">Basic contact information of the Parent</p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Full Name</span> <span className="col-span-2 font-medium text-gray-900">: {parent.parentName}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Phone No</span> <span className="col-span-2 font-medium text-gray-900">: {parent.phone}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-gray-500">Email</span> <span className="col-span-2 font-medium text-gray-900">: {parent.email}</span></div>
                            <div className="grid grid-cols-3 text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className="col-span-2 font-medium text-gray-900 flex items-center">:
                                    <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mx-2`}></span>
                                    {parent.isActive}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Linked Student Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-primary mb-1">Linked Student Information</h3>
                        <p className="text-xs text-gray-400 mb-6">Information of the linked Student</p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Full Name</span> <span className="col-span-2 font-medium text-gray-900">: {parent.student.name}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Assigned Hostel</span> <span className="col-span-2 font-medium text-gray-900">: Kmct Engineering Hostel</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Email</span> <span className="col-span-2 font-medium text-gray-900">: {typeof parent.student === 'object' ? parent.student?.email || 'N/A' : 'student@gmail.com'}</span></div>
                            <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Full Address</span> <span className="col-span-2 font-medium text-gray-900 leading-relaxed">: Abc street, saojini nagar india</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-lg font-semibold text-primary mb-4">Parent Summary</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Full Name</span> <span className="col-span-2 font-medium text-gray-900">: {parent.parentName}</span></div>
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Relation</span> <span className="col-span-2 font-medium text-gray-900">: {parent.relationship}</span></div>
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Student Name</span> <span className="col-span-2 font-medium text-gray-900">: {typeof parent.student === 'object' ? parent.student?.name : parent.student}</span></div>
                        <div className="grid grid-cols-3 text-sm"><span className="text-text-secondary">Hostel</span> <span className="col-span-2 font-medium text-gray-900">: Kmct Engineering Hostel</span></div>
                        <div className="grid grid-cols-3 text-sm">
                            <span className="text-text-secondary">Status</span>
                            <span className="col-span-2 font-medium text-gray-900 flex items-center">:
                                <span className={`w-2 h-2 rounded-full ${parent.isActive === true ? 'bg-green-500' : 'bg-red-500'} mx-2`}></span>
                                {parent.isActive}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
