import React, { useState } from 'react';
import { Pencil, Search, ChevronDown, Download, Phone, ChevronLeft, ChevronRight, X, User, Wrench, Calendar, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MaintenanceStaffManagement() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState('list');
    const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);

    const dummyStaff = Array(6).fill({
        id: 1,
        name: 'Ravi Kumar',
        specialization: 'Plumbing',
        phone: '9987898789',
        assignedTasks: 3,
        status: 'Active'
    }).map((staff, index) => ({ ...staff, id: index + 1 }));

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#0A437A]">Maintenance Staff</h1>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Manage maintenance staff</p>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-100 gap-4 bg-white">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A]"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <select className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0A437A] cursor-pointer text-gray-700">
                                <option>All</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0A437A] cursor-pointer text-gray-700">
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                            <Download className="w-4 h-4 text-gray-400" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="hidden md:block overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left border-collapse bg-white">
                        <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                            <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-500 text-sm font-semibold">
                                <th className="p-4 text-start font-semibold text-[#222222]">Name</th>
                                <th className="p-4 text-start font-semibold text-[#222222]">Specialization</th>
                                <th className="p-4 text-start font-semibold text-[#222222]">Phone</th>
                                <th className="p-4 text-start font-semibold text-[#222222]">Assigned Tasks</th>
                                <th className="p-4 text-start font-semibold text-[#222222]">Status</th>
                                <th className="p-4 text-center font-semibold text-[#222222]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {dummyStaff.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="p-4 font-medium text-[#777777]">
                                        <div 
                                            className="flex items-center gap-3 cursor-pointer hover:text-[#0A437A]"
                                            onClick={() => {
                                                setSelectedStaffDetail(staff);
                                                setView('detail');
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shrink-0 cursor-pointer tracking-wider">
                                                NM
                                            </div>
                                            <span className="font-medium text-[#777777] hover:text-[#0A437A] transition-colors cursor-pointer">{staff.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">{staff.specialization}</td>
                                    <td className="p-4 text-start text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {staff.phone}
                                        </div>
                                    </td>
                                    <td className="p-4 text-start text-gray-500">
                                        <button 
                                            onClick={() => navigate(`/dashboard/maintenance-staff/${staff.id}/tasks`)}
                                            className="font-medium text-[#0A437A] hover:underline transition-all cursor-pointer"
                                            title="View Assigned Tasks"
                                        >
                                            {staff.assignedTasks}
                                        </button>
                                    </td>
                                    <td className="p-4 text-start">
                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-green-50 text-success border border-green-100 hover:bg-green-100 transition-colors cursor-pointer">
                                            {staff.status} <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-success opacity-70" />
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="text-[#0A437A] hover:text-blue-800 transition-colors cursor-pointer" title="Edit">
                                            <Pencil className="w-4 h-4 mx-auto" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-[#222222]">Showing 1 Of 3</p>
                    <div className="flex items-center gap-1.5">
                        <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#0A437A] text-white font-medium cursor-pointer">
                            1
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                            2
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                            3
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {view === 'detail' && selectedStaffDetail && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Close Button */}
                        <button
                            onClick={() => setView('list')}
                            className="absolute top-6 right-6 p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>

                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{selectedStaffDetail.name}</h1>
                                    <p className="text-gray-400 text-sm">Maintenance Staff Details</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Main Content Area */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Basic Info Section */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                                    <p className="text-xs text-gray-400 mb-6">Basic information of the Maintenance Staff</p>
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedStaffDetail.name}</span></div>
                                        <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedStaffDetail.phone || 'N/A'}</span></div>
                                        <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Wrench className="w-4 h-4 text-gray-400" /> Specialization</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedStaffDetail.specialization || 'N/A'}</span></div>
                                        <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> Assigned Tasks</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedStaffDetail.assignedTasks || '0'}</span></div>
                                    </div>
                                </div>

                                {/* Status Details */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-[#0A437A] mb-1">Status</h3>
                                    <p className="text-xs text-gray-400 mb-6">Current activity status</p>
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-3 items-start sm:items-center">
                                            <span className="text-gray-500 flex items-center gap-1.5"><ToggleRight className="w-4 h-4 text-gray-400" /> Status</span>
                                            <span className="sm:col-span-2 font-medium flex items-center mt-2 sm:mt-0"><span className="hidden sm:inline mr-2">: </span>
                                                <span className={`w-2 h-2 rounded-full ${selectedStaffDetail.status === 'Active' ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                                {selectedStaffDetail.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Summary Sidebar */}
                            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                                <h3 className="text-lg font-semibold text-[#0A437A] mb-4">Staff Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> Name</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedStaffDetail.name}</span></div>
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0"><span className="text-gray-500 flex items-center gap-1.5"><Wrench className="w-4 h-4 text-gray-400" /> Specialization</span> <span className="sm:col-span-2 font-medium"><span className="hidden sm:inline">: </span>{selectedStaffDetail.specialization || 'N/A'}</span></div>
                                    <div className="flex flex-col sm:grid sm:grid-cols-3 text-sm gap-1 sm:gap-0">
                                        <span className="text-gray-500 flex items-center gap-1.5"><ToggleRight className="w-4 h-4 text-gray-400" /> Status</span>
                                        <span className="sm:col-span-2 font-medium flex items-center"><span className="hidden sm:inline mr-2">: </span>
                                            <span className={`w-2 h-2 rounded-full ${selectedStaffDetail.status === 'Active' ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                            {selectedStaffDetail.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
