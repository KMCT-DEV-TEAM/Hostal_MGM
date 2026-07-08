import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ComplaintService from '@/services/complaint.service';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import MobileList, { MobileRow } from '@/components/ui/MobileList';

const COMPLAINT_COLORS = {
    'Assigned': "#A855F7",
    'In progress': "#3B82F6",
    'Pending': "#F59E0B",
    'Completed': "#10B981",
};

export default function MaintenanceStaffDashboardOverview() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await ComplaintService.getAssignedComplaints();
                setTasks(res.data || []);
            } catch (error) {
                console.error("Failed to load tasks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'Awaiting').length;
    const inProgress = tasks.filter(t => t.status === 'In progress').length;
    const completed = tasks.filter(t => t.status === 'Resolved').length;
    // Assuming everything else is just 'Assigned' or recently created
    const assigned = tasks.length - pending - inProgress - completed;
    const total = tasks.length;

    // We can hardcode 50 for total, 7, 4, 3, 2 for demo purposes as in the image if we want to match the mockup exactly even without data, but it's better to use real data, and fallback to 0. 
    // To match the mockup design exactly, let's use the real values.
    
    const pieData = [
        { name: 'Assigned', value: assigned > 0 ? assigned : 0, color: COMPLAINT_COLORS['Assigned'] },
        { name: 'In progress', value: inProgress > 0 ? inProgress : 0, color: COMPLAINT_COLORS['In progress'] },
        { name: 'Pending', value: pending > 0 ? pending : 0, color: COMPLAINT_COLORS['Pending'] },
        { name: 'Completed', value: completed > 0 ? completed : 0, color: COMPLAINT_COLORS['Completed'] },
    ];
    // filter out 0 values for pie chart, but keep them for legend if we want
    const activePieData = pieData.filter(d => d.value > 0);
    // If no data, provide a dummy segment so chart isn't empty
    if (activePieData.length === 0) {
        activePieData.push({ name: 'No Tasks', value: 1, color: "#E5E7EB" });
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-success/10 text-success';
            case 'In progress': return 'bg-blue-50 text-blue-600';
            case 'Pending': return 'bg-warning-50 text-warning-600';
            case 'Awaiting': return 'bg-warning-50 text-warning-600';
            case 'Rejected': return 'bg-red-50 text-danger';
            case 'Incomplete': return 'bg-primary/10 text-primary';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const renderMobileBody = (task) => (
        <>
            <MobileRow label="Location" value={task.subject || 'N/A'} />
            <MobileRow 
                label="Priority" 
                value={
                    <span className="inline-flex items-center justify-center px-4 py-1 text-xs font-medium rounded-md bg-red-50 text-red-500">
                        {task.priority || 'High'}
                    </span>
                } 
            />
            <MobileRow label="Date" value={new Date(task.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} />
            <MobileRow 
                label="Status" 
                value={
                    <span className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium rounded-md ${
                        task.status === 'Pending' || task.status === 'Awaiting' 
                            ? 'bg-orange-50 text-orange-500' 
                            : task.status === 'Resolved' 
                            ? 'bg-green-50 text-green-500'
                            : task.status === 'In progress'
                            ? 'bg-blue-50 text-blue-500'
                            : 'bg-gray-100 text-gray-500'
                    }`}>
                        {task.status || 'Pending'}
                    </span>
                } 
            />
        </>
    );

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900">
            {/* Header */}
            <div className="px-4 md:px-8 py-6">
                <h1 className="text-2xl font-bold text-black mb-1">Dashboard</h1>
                <p className="text-sm text-gray-500">Here is your Task activity overview</p>
            </div>

            <div className="px-4 md:px-8 pb-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Task Overview */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Task Overview</h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 flex-1">
                            <div className="relative w-[220px] h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activePieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={75}
                                            outerRadius={105}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {activePieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-900">{total}</span>
                                    <span className="text-xs text-gray-500 font-medium">Total Tasks</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5">
                                {pieData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between w-[160px]">
                                        <div className="flex items-center gap-3 text-base text-gray-700">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <span className="text-base font-semibold text-gray-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col">
                        <h2 className="text-base font-bold text-gray-900 mb-1">Quick Summery</h2>
                        <p className="text-xs text-gray-400 mb-5">Today at glance</p>

                        <div className="flex flex-col gap-3 flex-1 justify-center">
                            <div className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-400 flex items-center justify-center mr-4">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Total Tasks</div>
                                    <div className="text-sm font-bold text-gray-900">{total}</div>
                                </div>
                            </div>

                            <div className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-400 flex items-center justify-center mr-4">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Pending Tasks</div>
                                    <div className="text-sm font-bold text-gray-900">{pending}</div>
                                </div>
                            </div>

                            <div className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-400 flex items-center justify-center mr-4">
                                    <Loader2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">In Progress Tasks</div>
                                    <div className="text-sm font-bold text-gray-900">{inProgress}</div>
                                </div>
                            </div>

                            <div className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-400 flex items-center justify-center mr-4">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Completed Tasks</div>
                                    <div className="text-sm font-bold text-gray-900">{completed}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Tasks */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col mt-4">
                    <div className="flex items-center justify-between p-6 pb-4">
                        <h2 className="text-base font-bold text-gray-900">Recent Tasks</h2>
                        <button 
                            onClick={() => navigate('/dashboard/tasks')} 
                            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                        >
                            View all →
                        </button>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FAFBFD] border-y border-gray-100">
                                <tr>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Task</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Location</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Priority</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <TableSkeletonLoader columns={5} />
                                ) : tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">No recent tasks found.</td>
                                    </tr>
                                ) : (
                                    tasks.slice(0, 5).map((task) => (
                                        <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                A{task._id ? task._id.substring(task._id.length - 6).toUpperCase() : '112390'}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {task.subject || 'N/A'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center justify-center px-4 py-1 text-xs font-medium rounded-md bg-red-50 text-red-500">
                                                    {task.priority || 'High'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {new Date(task.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1.5 text-xs font-medium rounded-md ${
                                                    task.status === 'Pending' || task.status === 'Awaiting' 
                                                        ? 'bg-orange-50 text-orange-500' 
                                                        : task.status === 'Resolved' 
                                                        ? 'bg-green-50 text-green-500'
                                                        : task.status === 'In progress'
                                                        ? 'bg-blue-50 text-blue-500'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {task.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden">
                        <MobileList
                            items={tasks.slice(0, 5)}
                            loading={loading}
                            canSelect={false}
                            canEdit={false}
                            emptyText="No recent tasks found."
                            titleFn={(task) => `A${task._id ? task._id.substring(task._id.length - 6).toUpperCase() : '112390'}`}
                            renderBody={renderMobileBody}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
