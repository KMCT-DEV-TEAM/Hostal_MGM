import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, AlertTriangle, Clock, Loader2, CheckCircle, LayoutGrid, List } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import ResolveTaskModal from '../components/complaints/ResolveTaskModal';
import RejectAssignedTaskModal from '../components/complaints/RejectAssignedTaskModal';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import Dropdown from '@/components/ui/Dropdown';
import { useDebounce } from '@/hooks/useDebounce';
import MaintenanceAssignedTasksMobileList from '../components/complaints/MaintenanceAssignedTasksMobileList';

export default function MaintenanceAssignedTasks() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showKPIs, setShowKPIs] = useState(false);

    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await ComplaintService.getAssignedComplaints();
            setTasks(res.data || []);
        } catch (error) {
            showErrorToast('Error', 'Failed to load assigned tasks');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-success/10 text-success';
            case 'In progress': return 'bg-blue-50 text-blue-600';
            case 'Pending': return 'bg-warning-50 text-warning-600';
            case 'Awaiting': return 'bg-warning-50 text-warning-600';
            case 'Rejected': return 'bg-red-50 text-danger';
            case 'Incomplete': return 'bg-primary/10 text-primary';
            default: return 'bg-text-secondary-50 text-text-secondary';
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.roomNo?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            task.category?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            task.subject?.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter]);

    const limit = 10;
    const totalTasks = filteredTasks.length;
    const totalPages = Math.ceil(totalTasks / limit) || 1;
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * limit, currentPage * limit);

    const handleResolveClick = (task) => {
        setSelectedTask(task);
        setResolveModalOpen(true);
    };

    const handleRejectClick = (task) => {
        setSelectedTask(task);
        setRejectModalOpen(true);
    };

    const totalAll = tasks.length;
    const pendingAll = tasks.filter(t => t.status === 'Pending' || t.status === 'Awaiting').length;
    const inProgressAll = tasks.filter(t => t.status === 'In progress').length;
    const resolvedAll = tasks.filter(t => t.status === 'Resolved').length;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Assigned Tasks</h1>
                    <p className="text-[10px] sm:text-xs text-[#777777] mt-0.5 sm:mt-1">Manage your assigned maintenance tasks here.</p>
                </div>
                
                <div className="hidden md:flex items-center self-end sm:self-auto">
                    <button
                        onClick={() => setShowKPIs(!showKPIs)}
                        className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        {showKPIs ? <List className="w-5 h-5 sm:w-4 sm:h-4" /> : <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" />}
                        <span className="hidden sm:inline">{showKPIs ? "Hide KPIs" : "Show KPIs"}</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards Section */}
            {showKPIs && (
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full shrink-0">
                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-red-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Tasks</p>
                        <h3 className="text-xl font-bold text-gray-900">{totalAll}</h3>
                    </div>
                    <div className="p-1.5 bg-red-50 rounded text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-orange-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pending</p>
                        <h3 className="text-xl font-bold text-gray-900">{pendingAll}</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-orange-400">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-blue-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
                        <h3 className="text-xl font-bold text-gray-900">{inProgressAll}</h3>
                    </div>
                    <div className="p-1.5 bg-blue-50 rounded text-blue-400">
                        <Loader2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-green-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resolved</p>
                        <h3 className="text-xl font-bold text-gray-900">{resolvedAll}</h3>
                    </div>
                    <div className="p-1.5 bg-green-50 rounded text-green-400">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>
            </div>
            )}

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                {/* Toolbar */}
                <div className="p-0 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0 mb-3 md:mb-0">
                    <div className="w-full sm:w-auto flex gap-2 flex-1 sm:max-w-xs">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm shadow-sm md:shadow-none focus:outline-none placeholder-gray-400 cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto sm:flex-1 justify-end">
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Dropdown
                                className="flex-1 sm:flex-none"
                                options={[
                                    { label: 'All Status', value: 'All' },
                                    { label: 'Pending', value: 'Pending' },
                                    { label: 'Awaiting', value: 'Awaiting' },
                                    { label: 'In progress', value: 'In progress' },
                                    { label: 'Rejected', value: 'Rejected' },
                                    { label: 'Incomplete', value: 'Incomplete' },
                                    { label: 'Resolved', value: 'Resolved' }
                                ]}
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                                placeholder="All Status"
                                minWidth="w-32"
                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="hidden md:block overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left border-collapse bg-white">
                        <thead className="sticky top-0 z-10 bg-[#FAFBFD] shadow-sm">
                            <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-700 text-sm font-semibold">
                                <th className="p-4 pl-8 text-start font-semibold">Room</th>
                                <th className="p-4 text-start font-semibold">Category</th>
                                <th className="p-4 text-start font-semibold">Subject</th>
                                <th className="p-4 text-start font-semibold">Assigned On</th>
                                <th className="p-4 text-center font-semibold">Status</th>
                                <th className="p-4 text-center font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {loading ? (
                                <TableSkeletonLoader columns={6} />
                            ) : paginatedTasks.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-gray-500">No tasks found.</td></tr>
                            ) : (
                                paginatedTasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="p-4 pl-8 text-start text-gray-500 font-medium">{task.roomNo}</td>
                                        <td className="p-4 text-start text-gray-500">{task.category?.name || 'N/A'}</td>
                                        <td className="p-4 text-start text-gray-500">{task.subject}</td>
                                        <td className="p-4 text-start text-gray-500">{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md border-none ${getStatusStyle(task.status)}`}>
                                                {task.status || 'Pending'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {task.status === 'In progress' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleResolveClick(task)}
                                                        className="px-3 py-1.5 bg-[#0A437A] text-white rounded text-xs font-medium hover:bg-primary-200 transition-colors cursor-pointer"
                                                    >
                                                        Resolve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectClick(task)}
                                                        className="px-3 py-1.5 bg-danger-100 text-danger-700 rounded text-xs font-medium hover:bg-danger-200 transition-colors cursor-pointer"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <MaintenanceAssignedTasksMobileList
                    tasks={paginatedTasks}
                    loading={loading}
                    handleResolveClick={handleResolveClick}
                    handleRejectClick={handleRejectClick}
                    getStatusStyle={getStatusStyle}
                />

                {/* Pagination */}
                <div className="flex flex-row p-3 sm:p-4 bg-white border border-gray-50 items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500 rounded-b-xl shadow-sm shrink-0 mt-auto">
                    <div>
                        <span className="hidden sm:inline">Showing </span>
                        {totalTasks === 0 ? 0 : (currentPage - 1) * limit + 1}
                        <span className="hidden sm:inline"> to </span>
                        <span className="sm:hidden">-</span>
                        {Math.min(currentPage * limit, totalTasks)} of {totalTasks}
                        <span className="hidden sm:inline"> entries</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {(() => {
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = Math.min(totalPages, currentPage + 1);

                            if (endPage - startPage < 2) {
                                if (startPage === 1) {
                                    endPage = Math.min(totalPages, 3);
                                } else if (endPage === totalPages) {
                                    startPage = Math.max(1, totalPages - 2);
                                }
                            }

                            const visiblePages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                visiblePages.push(i);
                            }

                            return visiblePages.map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${currentPage === pageNum
                                        ? 'bg-[#0A437A] text-white shadow-sm font-bold'
                                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                                        } cursor-pointer`}
                                >
                                    {pageNum}
                                </button>
                            ));
                        })()}

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-1.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <ResolveTaskModal
                isOpen={resolveModalOpen}
                onClose={() => setResolveModalOpen(false)}
                complaint={selectedTask}
                onResolved={fetchTasks}
            />

            <RejectAssignedTaskModal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                complaint={selectedTask}
                onRejected={fetchTasks}
            />
        </div>
    );
}
