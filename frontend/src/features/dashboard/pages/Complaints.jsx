import React, { useState } from 'react';
import ComplaintsTable from '../components/complaints/ComplaintsTable';
import ComplaintsToolbar from '../components/complaints/ComplaintsToolbar';
import { AlertTriangle, Clock, Loader2, CheckCircle } from 'lucide-react';

export default function Complaints() {
    // Initial mocked complaints summary
    const initialComplaints = [
        { id: '1', organization: 'Engineering', hostel: 'Hostel A', warden: 'Priya', total: 15, pending: 10, inProgress: 3, resolved: 5 },
        { id: '2', organization: 'Engineering', hostel: 'Hostel A', warden: 'Hima', total: 15, pending: 5, inProgress: 6, resolved: 7 },
        { id: '3', organization: 'Engineering', hostel: 'Hostel A', warden: 'Kanaka', total: 15, pending: 7, inProgress: 8, resolved: 3 },
        { id: '4', organization: 'Engineering', hostel: 'Hostel A', warden: 'Siddarth', total: 15, pending: 9, inProgress: 8, resolved: 6 },
        { id: '5', organization: 'Engineering', hostel: 'Hostel A', warden: 'Arun', total: 15, pending: 3, inProgress: 3, resolved: 9 },
        { id: '6', organization: 'Engineering', hostel: 'Hostel A', warden: 'Lalitha', total: 15, pending: 2, inProgress: 1, resolved: 10 }
    ];

    const [complaints] = useState(initialComplaints);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0A437A]">Complaints</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor complaint performance across organizations.</p>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-5 border-t-[3px] border-t-red-400 shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Complaints</p>
                        <h3 className="text-2xl font-bold text-gray-900">30</h3>
                    </div>
                    <div className="p-1.5 bg-red-50 rounded text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[3px] border-t-orange-300 shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pending</p>
                        <h3 className="text-2xl font-bold text-gray-900">15</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-orange-400">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[3px] border-t-blue-400 shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
                        <h3 className="text-2xl font-bold text-gray-900">2</h3>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded text-blue-400">
                        <Loader2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[3px] border-t-green-400 shadow-sm border border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved</p>
                        <h3 className="text-2xl font-bold text-gray-900">13</h3>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded text-green-500">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="bg-transparent md:bg-[#F8FAFC] md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                {/* Toolbar Section */}
                <ComplaintsToolbar 
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    setCurrentPage={setCurrentPage}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    initiateExport={() => console.log('Exporting complaints')}
                    openAddComplaintModal={() => console.log('Add new complaint')}
                />

                {/* Table Section */}
                <ComplaintsTable
                    complaints={complaints.filter(c => 
                        c.warden.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.organization.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                />

                {/* Pagination Section (Static Mock for visual completion) */}
                <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#222222]">
                        Showing {complaints.length} Of {complaints.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 disabled:opacity-50 cursor-not-allowed">
                            &lt;
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0A437A] text-white font-medium">
                            1
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-[#0A437A] hover:text-[#0A437A] transition-colors cursor-pointer">
                            2
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-[#0A437A] hover:text-[#0A437A] transition-colors cursor-pointer">
                            3
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 cursor-pointer">
                            &gt;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
