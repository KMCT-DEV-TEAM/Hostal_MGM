import React, { useState } from 'react';
import WardenComplaintsTable from '../components/complaints/WardenComplaintsTable';
import WardenComplaintsToolbar from '../components/complaints/WardenComplaintsToolbar';
import WardenComplaintsFilterModal from '../components/complaints/WardenComplaintsFilterModal';
import WardenComplaintDetailView from '../components/complaints/WardenComplaintDetailView';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WardenComplaints() {
    // Initial mocked student complaints for warden view
    const initialComplaints = [
        {
            id: '1',
            student: 'Nila Mohan',
            roomNo: 'A112390',
            category: 'Mess',
            subject: 'Food was cold and not fresh',
            date: '12 June',
            priority: 'High',
            status: 'Pending'
        }
    ];

    const [complaints, setComplaints] = useState(initialComplaints);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [roomNoFilter, setRoomNoFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [viewingComplaint, setViewingComplaint] = useState(null);
    const limit = 10;

    const handleCategoryChange = (id, newCategory) => {
        setComplaints(complaints.map(c =>
            c.id === id ? { ...c, category: newCategory } : c
        ));
    };

    // Apply filtering
    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              complaint.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              complaint.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || complaint.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'All' || complaint.category === categoryFilter;
        const matchesRoomNo = roomNoFilter === '' || complaint.roomNo.toLowerCase().includes(roomNoFilter.toLowerCase());
        const matchesDate = dateFilter === '' || complaint.date === dateFilter;
        
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesRoomNo && matchesDate;
    });

    // Apply pagination
    const totalComplaints = filteredComplaints.length;
    const totalPages = Math.ceil(totalComplaints / limit) || 1;
    const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * limit, currentPage * limit);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0A437A]">Complaints</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and resolve student complaints in your hostel.</p>
            </div>

            {/* Toolbar Section */}
            <WardenComplaintsToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                openFilterModal={() => setIsFilterModalOpen(true)}
                initiateExport={() => console.log('Exporting warden complaints')}
            />

            {/* Table Section */}
            <WardenComplaintsTable
                complaints={paginatedComplaints}
                handleCategoryChange={handleCategoryChange}
                onViewClick={(complaint) => setViewingComplaint(complaint)}
            />

            {/* PAGINATION BAR FOOTER */}
            <div className="flex flex-col sm:flex-row p-4 bg-white border border-gray-50 items-center justify-between text-xs font-medium text-gray-500 rounded-b-xl shadow-sm gap-3">
                <div>
                    Showing {totalComplaints === 0 ? 0 : (currentPage - 1) * limit + 1}{" "}
                    to {Math.min(currentPage * limit, totalComplaints)} of{" "}
                    {totalComplaints} entries
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => {
                        const pageNum = index + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-all cursor-pointer ${currentPage === pageNum
                                    ? "bg-[#0A437A] text-white shadow-sm font-bold"
                                    : "border border-transparent text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isFilterModalOpen && (
                <WardenComplaintsFilterModal
                    initialRoomNo={roomNoFilter}
                    initialCategory={categoryFilter}
                    initialDate={dateFilter}
                    initialPriority={priorityFilter}
                    initialStatus={statusFilter}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={(filters) => {
                        setRoomNoFilter(filters.roomNo);
                        setCategoryFilter(filters.category);
                        setDateFilter(filters.date);
                        setPriorityFilter(filters.priority);
                        setStatusFilter(filters.status);
                        setCurrentPage(1); // Reset to first page on filter
                        setIsFilterModalOpen(false);
                    }}
                />
            )}

            {viewingComplaint && (
                <WardenComplaintDetailView
                    complaint={viewingComplaint}
                    onClose={() => setViewingComplaint(null)}
                />
            )}
        </div>
    );
}
