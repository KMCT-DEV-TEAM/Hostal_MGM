import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, AlertTriangle, Clock, Loader2, CheckCircle, LayoutGrid, List } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useDebounce } from '@/hooks/useDebounce';
import ResolveTaskModal from '../components/complaints/ResolveTaskModal';
import RejectAssignedTaskModal from '../components/complaints/RejectAssignedTaskModal';
import DataView from '@/components/ui/data-view/DataView';
import WardenComplaintDetailView from '../components/complaints/WardenComplaintDetailView';
import { Droplet, Lightbulb, Wifi, Wrench, AlertCircle, FileText, Home as HomeIcon } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import MaintenanceAssignedTasksHeader from '../components/maintenanceStaff/MaintenanceAssignedTasksHeader';

export default function MaintenanceAssignedTasks() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState('All');
    const [limit, setLimit] = useState(10);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [viewingTask, setViewingTask] = useState(null);
    const [viewMode, setViewMode] = useState('tasks'); // 'tasks' or 'history'

    useEffect(() => {
        fetchTasks();
    }, [viewMode]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = {};
            if (viewMode === 'history') {
                params.status = 'Resolved,Rejected,Incomplete,Awaiting';
            }
            const res = await ComplaintService.getAssignedComplaints(params);
            const rawData = res.data || [];
            const formatted = rawData.map(c => ({
                id: c.id || c._id,
                student: c.studentId?.name || 'Unknown',
                roomNo: c.roomNo || 'N/A',
                category: c.category?.name || 'Unknown',
                categoryId: c.category?.id,
                subject: c.subject,
                description: c.description,
                date: new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                createdAt: c.createdAt,
                priority: c.priority || 'Medium',
                status: c.status,
                hostelId: c.hostelId,
                hostelName: c.hostelId?.name || 'Unknown Hostel',
                assignedStaff: c.assignedStaff,
                timeline: c.timeline || [],
                internalNotes: c.internalNotes || [],
                materialsUsed: c.materialsUsed,
                resolutionNotes: c.resolutionNotes
            }));
            setTasks(formatted);
        } catch (error) {
            showErrorToast('Error', 'Failed to load assigned tasks');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-success-50 text-success border-success';
            case 'In progress': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Pending': return 'bg-warning-50 text-warning-600 border-warning-200';
            case 'Awaiting': return 'bg-warning-50 text-warning-600 border-warning-200';
            case 'Rejected': return 'bg-danger-50 text-danger border-danger';
            case 'Incomplete': return 'bg-primary/10 text-primary border-primary/20';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.roomNo?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            task.category?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            task.subject?.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
        
        let matchesViewMode = true;
        if (viewMode === 'tasks') {
            matchesViewMode = !['Resolved', 'Rejected', 'Incomplete'].includes(task.status);
        }

        return matchesSearch && matchesStatus && matchesViewMode;
    });

    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, limit, viewMode]);

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
    const pendingAll = viewMode === 'history' ? tasks.filter(t => t.status === 'Awaiting' || t.status === 'Incomplete').length : tasks.filter(t => t.status === 'Pending' || t.status === 'Awaiting').length;
    const inProgressAll = viewMode === 'history' ? tasks.filter(t => t.status === 'Rejected').length : tasks.filter(t => t.status === 'In progress').length;
    const resolvedAll = tasks.filter(t => t.status === 'Resolved').length;

    const getCategoryIcon = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('water') || cat.includes('plumb')) return <Droplet className="w-5 h-5 text-blue-500" />;
        if (cat.includes('light') || cat.includes('electric')) return <Lightbulb className="w-5 h-5 text-orange-500" />;
        if (cat.includes('internet') || cat.includes('wifi') || cat.includes('network')) return <Wifi className="w-5 h-5 text-teal-500" />;
        if (cat.includes('clean') || cat.includes('housekeep') || cat.includes('maintain') || cat.includes('repair')) return <Wrench className="w-5 h-5 text-gray-500" />;
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    };

    const getCategoryBgColor = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('water') || cat.includes('plumb')) return "bg-blue-50";
        if (cat.includes('light') || cat.includes('electric')) return "bg-orange-50";
        if (cat.includes('internet') || cat.includes('wifi') || cat.includes('network')) return "bg-teal-50";
        if (cat.includes('clean') || cat.includes('housekeep') || cat.includes('maintain') || cat.includes('repair')) return "bg-gray-50";
        return "bg-red-50";
    };

    const columns = [
        {
            key: "roomNo",
            header: "Room",
            renderCell: (o) => <span className="font-medium text-gray-500">{o.roomNo}</span>
        },
        {
            key: "category",
            header: "Category",
            accessor: (o) => o.category || 'N/A'
        },
        {
            key: "subject",
            header: "Subject",
            accessor: (o) => o.subject
        },
        {
            key: "assignedOn",
            header: "Assigned On",
            icon: Clock,
            accessor: (o) => o.date
        },
        {
            key: "status",
            header: "Status",
            align: "center",
            renderCell: (o) => (
                <div className={`inline-flex items-center justify-center w-[105px] px-3 py-1.5 text-xs font-medium rounded-md border ${getStatusStyle(o.status)}`}>
                    {o.status || 'Pending'}
                </div>
            )
        },
        {
            key: "action",
            header: "Action",
            align: "center",
            width: "200px",
            renderCell: (o) => (
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    {o.status === 'In progress' ? (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => handleResolveClick(o)}
                                className="px-3 py-1.5 bg-[#0A437A] text-white rounded text-xs font-medium hover:bg-primary-200 transition-colors cursor-pointer"
                            >
                                Resolve
                            </button>
                            <button
                                onClick={() => handleRejectClick(o)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                            >
                                Reject
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">-</span>
                    )}
                </div>
            )
        }
    ];

    const cardConfig = {
        customIcon: (o) => (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryBgColor(o.category)}`}>
                {getCategoryIcon(o.category)}
            </div>
        ),
        title: (o) => o.subject || 'Unknown Task',
        subtitle: (o) => o.category || 'N/A',
        status: (o) => {
            let dotColor = 'bg-blue-500', bgColor = 'bg-blue-50', textColor = 'text-blue-600';
            if (o.status === 'Resolved') { dotColor = 'bg-green-500'; bgColor = 'bg-green-50'; textColor = 'text-green-600'; }
            else if (o.status === 'Pending' || o.status === 'Awaiting') { dotColor = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-600'; }
            else if (o.status === 'Rejected') { dotColor = 'bg-red-500'; bgColor = 'bg-red-50'; textColor = 'text-red-600'; }
            return {
                label: o.status || 'Pending',
                dotClass: dotColor,
                bgClass: bgColor,
                textClass: textColor
            };
        },
        fields: [
            {
                label: "Room",
                icon: HomeIcon,
                value: (o) => o.roomNo || 'N/A'
            },
            {
                label: "Assigned On",
                icon: Clock,
                value: (o) => o.date
            }
        ],
        actionSlot: (o) => (
            o.status === 'In progress' && (
                <div className="grid grid-cols-2 w-full gap-3 mt-4 pt-4 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleResolveClick(o); }}
                        className="w-full py-2.5 bg-[#0A437A] text-white rounded-lg text-sm font-semibold hover:bg-primary-200 transition-colors cursor-pointer text-center truncate"
                    >
                        Resolve
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRejectClick(o); }}
                        className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer text-center truncate"
                    >
                        Reject
                    </button>
                </div>
            )
        )
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] text-black flex flex-col relative">
            <div className="p-4 md:p-6 flex-1 flex flex-col">
                <MaintenanceAssignedTasksHeader viewMode={viewMode} setViewMode={setViewMode} />

            {/* Stat Cards Section */}
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
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{viewMode === 'history' ? 'Awaiting' : 'Pending'}</p>
                        <h3 className="text-xl font-bold text-gray-900">{pendingAll}</h3>
                    </div>
                    <div className="p-1.5 bg-orange-50 rounded text-orange-400">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 border-t-[2px] border-t-blue-300 shadow-sm border-x border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{viewMode === 'history' ? 'Rejected' : 'In Progress'}</p>
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

            {/* MOBILE KPI CARDS */}
            <div className="md:hidden flex items-center justify-between px-3 py-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0">
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-red-500">{totalAll < 10 && totalAll > 0 ? `0${totalAll}` : totalAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">Total</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-orange-500">{pendingAll < 10 && pendingAll > 0 ? `0${pendingAll}` : pendingAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">{viewMode === 'history' ? 'Awaiting' : 'Pending'}</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-blue-500">{inProgressAll < 10 && inProgressAll > 0 ? `0${inProgressAll}` : inProgressAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">{viewMode === 'history' ? 'Rejected' : 'In Progress'}</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <span className="text-xl font-bold text-green-600">{resolvedAll < 10 && resolvedAll > 0 ? `0${resolvedAll}` : resolvedAll}</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 capitalize text-center leading-tight">Resolved</span>
                </div>
            </div>

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:shadow-sm flex-1 flex flex-col min-h-0">
                <DataView
                    pageScrollMode={true}
                    data={paginatedTasks}
                    columns={columns}
                    cardConfig={cardConfig}
                    loading={loading}
                    searchPlaceholder="Search tasks..."
                    searchQuery={searchQuery}
                    onSearchChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    toolbarStartSlot={
                        <Dropdown
                            options={[
                                { value: "All", label: "All Status" },
                                { value: "Pending", label: "Pending" },
                                { value: "Awaiting", label: "Awaiting" },
                                { value: "In progress", label: "In progress" },
                                { value: "Rejected", label: "Rejected" },
                                { value: "Incomplete", label: "Incomplete" },
                                { value: "Resolved", label: "Resolved" }
                            ]}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                            placeholder="All Status"
                            minWidth="w-32"
                            triggerClassName="w-full px-3 py-2 bg-white border border-gray-100 md:border-gray-200 rounded-lg text-sm text-[#777777] font-medium shadow-sm md:shadow-none focus:border-[#0A437A] cursor-pointer h-full"
                        />
                    }
                    emptyText="No tasks found."
                    onRowClick={(task) => setViewingTask(task)}
                    pagination={{
                        currentPage: currentPage,
                        totalPages: totalPages,
                        onPageChange: setCurrentPage,
                        limit: limit,
                        onLimitChange: (l) => { setLimit(l); setCurrentPage(1); },
                        totalItems: totalTasks
                    }}
                    mobilePagination={{
                        hasMore: currentPage < totalPages,
                        onLoadMore: () => setCurrentPage(prev => prev + 1)
                    }}
                    getItemId={(o) => o.id}
                />
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

            {viewingTask && (
                <WardenComplaintDetailView
                    complaint={viewingTask}
                    onClose={() => setViewingTask(null)}
                    onRefresh={fetchTasks}
                />
            )}
            </div>
        </div>
    );
}
