import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useAuthStore } from '@/store/useAuthStore';
import ResolveTaskModal from '../components/complaints/ResolveTaskModal';

export default function MaintenanceAssignedTasks() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
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
            case 'Resolved': return 'bg-green-50 text-success';
            case 'In progress': return 'bg-blue-50 text-[#0A437A]';
            case 'Pending': return 'bg-gray-50 text-gray-600';
            case 'Awaiting': return 'bg-orange-50 text-orange-500';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const filteredTasks = tasks.filter(task => 
        task.roomNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleResolveClick = (task) => {
        setSelectedTask(task);
        setResolveModalOpen(true);
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden bg-[#F8FAFC] p-4 md:p-6 text-black flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#0A437A] rounded-xl flex items-center justify-center text-white font-bold text-lg tracking-wider uppercase">
                    {user?.name?.substring(0, 2) || 'MS'}
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your assigned maintenance tasks here.</p>
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
                        <div className="relative">
                            <select className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0A437A] cursor-pointer text-gray-700">
                                <option>All Status</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                                <tr><td colSpan="6" className="text-center p-8 text-gray-500">Loading tasks...</td></tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-gray-500">No tasks found.</td></tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="p-4 pl-8 text-start text-gray-500 font-medium">{task.roomNo}</td>
                                        <td className="p-4 text-start text-gray-500">{task.category?.name || 'N/A'}</td>
                                        <td className="p-4 text-start text-gray-500">{task.subject}</td>
                                        <td className="p-4 text-start text-gray-500">{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-medium w-28 ${getStatusStyle(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {task.status === 'In progress' ? (
                                                <button 
                                                    onClick={() => handleResolveClick(task)}
                                                    className="px-3 py-1.5 bg-[#0A437A] text-white rounded text-xs font-medium hover:bg-blue-800 transition-colors cursor-pointer"
                                                >
                                                    Resolve
                                                </button>
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

                {/* Pagination */}
                <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-[#222222]">Showing {filteredTasks.length} tasks</p>
                </div>
            </div>

            <ResolveTaskModal
                isOpen={resolveModalOpen}
                onClose={() => setResolveModalOpen(false)}
                complaint={selectedTask}
                onResolved={fetchTasks}
            />
        </div>
    );
}
