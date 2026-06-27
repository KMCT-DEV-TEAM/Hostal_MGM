import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, ArrowLeft, AlertTriangle, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ComplaintService from '@/services/complaint.service';
import { showErrorToast } from '@/utils/toast';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import Dropdown from '@/components/ui/Dropdown';
import { useDebounce } from '@/hooks/useDebounce';
import { initSocket } from '@/services/socket.service';

export default function MaintenanceStaffTasks() {
    const navigate = useNavigate();
    const { staffId } = useParams();
    const location = useLocation();
    const staffName = location.state?.staffName || 'Staff Member';
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState('All');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
        
        const socket = initSocket();
        
        const handleComplaintEvent = () => {
            fetchTasks();
        };

        socket.on('complaintCreated', handleComplaintEvent);
        socket.on('complaintUpdated', handleComplaintEvent);
        socket.on('complaintDeleted', handleComplaintEvent);

        return () => {
            socket.off('complaintCreated', handleComplaintEvent);
            socket.off('complaintUpdated', handleComplaintEvent);
            socket.off('complaintDeleted', handleComplaintEvent);
        };
    }, [staffId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await ComplaintService.getAllComplaints({ assignedStaff: staffId });
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
            case 'Rejected': return 'bg-danger/10 text-danger';
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

    const totalAll = tasks.length;
    const pendingAll = tasks.filter(t => t.status === 'Pending' || t.status === 'Awaiting').length;
    const inProgressAll = tasks.filter(t => t.status === 'In progress').length;
    const resolvedAll = tasks.filter(t => t.status === 'Resolved').length;

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-y-auto bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="mb-4 shrink-0">
                <button 
                    onClick={() => navigate('/dashboard/maintenance-staff')}
                    className="flex items-center gap-2 text-[#3b82f6] hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back To Maintenance
                </button>
            </div>
            
            <div className="mb-6 shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{staffName}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Current maintenance tasks assigned to this staff.</p>
                </div>
            </div>

            {/* Stat Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full shrink-0">
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

            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-100 gap-4 bg-white">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A]"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Dropdown
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
                            onChange={(val) => setStatusFilter(val)}
                            placeholder="All Status"
                            triggerClassName="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 flex justify-between items-center shadow-sm md:shadow-none min-w-[130px]"
                            minWidth="w-[140px]"
                        />
                        <div className="relative">
                            <select className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0A437A] cursor-pointer text-gray-700">
                                <option>Sort by Date</option>
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
                            <tr className="bg-[#FAFBFD] border-b border-gray-100 text-gray-700 text-sm font-semibold">
                                <th className="p-4 pl-8 text-start font-semibold">Room</th>
                                <th className="p-4 text-start font-semibold">Category</th>
                                <th className="p-4 text-start font-semibold">Subject</th>
                                <th className="p-4 text-start font-semibold">Assigned On</th>
                                <th className="p-4 text-center font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {loading ? (
                                <TableSkeletonLoader columns={5} />
                            ) : filteredTasks.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-8 text-gray-500">No tasks found.</td></tr>
                            ) : (
                                filteredTasks.map((task) => (
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-[#222222]">Showing {filteredTasks.length} tasks</p>
                </div>
            </div>
        </div>
    );
}
