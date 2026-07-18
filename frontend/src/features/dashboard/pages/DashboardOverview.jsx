import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import adminService from "@/services/admin.service";
import wardenService from "@/services/warden.service";
import complaintService from "@/services/complaint.service";
import { logApi } from "@/features/dashboard/api/logApi";
import Dropdown from '@/components/ui/Dropdown';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell

} from "recharts";

import {
    Building2,
    ShieldCheck,
    Users,
    GraduationCap,
    House,
    Wrench,
    UserCheck,
    AlertTriangle,
    MessageSquare,
    X,
    ChevronDown,
    KeyRound,
    Info,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    UserPlus,
    Trash2,
    Edit,
    LogIn,
    PlusCircle,
    FileText
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import MaintenanceStaffDashboardOverview from "../components/MaintenanceStaffDashboardOverview";
import WardenDashboardOverview from "../components/WardenDashboardOverview";

const COMPLAINT_COLORS = ["#0A467F", "#9D77CE", "#F8BA52", "#55CDA6", "#A6A6A6", "#FF6B6B", "#4DABF7", "#FF922B", "#20C997", "#339AF0"];
import ParentDashboard from './ParentDashboard';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';

function DashboardOverview() {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const [period, setPeriod] = useState("This Year");
    const [attendancePeriod, setAttendancePeriod] = useState("This Year");
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceMetrics, setAttendanceMetrics] = useState({
        avgRate: "0%",
        currentMonth: "0%",
        vsLastMonth: "0%"
    });
    const [recentActivities, setRecentActivities] = useState([]);

    const defaultComplaintSummary = [
        { name: 'Resolved', count: 499, value: 40, color: COMPLAINT_COLORS[0] },
        { name: 'Pending', count: 312, value: 25, color: COMPLAINT_COLORS[1] },
        { name: 'In progress', count: 187, value: 15, color: COMPLAINT_COLORS[2] },
        { name: 'Rejected', count: 125, value: 10, color: COMPLAINT_COLORS[3] },
        { name: 'Awaiting', count: 125, value: 10, color: COMPLAINT_COLORS[4] }
    ];
    const [complaintData, setComplaintData] = useState(defaultComplaintSummary);
    const [complaintTotal, setComplaintTotal] = useState(50);
    const [dashboardStats, setDashboardStats] = useState({
        organizations: 0, admins: 0, wardens: 0, students: 0, hostels: 0,
        parents: 0, pendingComplaints: 0, leaveRequests: 0, presentToday: 0, absent: 0,
        inactiveWardens: 0, parentsMessages: 0, leaveApproved: 0,
        complaintsOverview: { total: 0, unresolved: 0 },
        attendance: { thisYear: [], lastYear: [] }
    });
    const [studentChartData, setStudentChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (user?.role === ROLES.SUPER_ADMIN) {
                    const { data: stats } = await adminService.getSuperAdminDashboardStats();
                    console.log('stats from super admin', stats)

                    setDashboardStats(prev => ({
                        ...prev,
                        organizations: stats?.organizations || 0,
                        admins: stats?.admins || 0,
                        wardens: stats?.wardens || 0,
                        hostels: stats?.hostels || 0,
                        students: stats?.students || 0,
                        newStudentsToday: stats?.newStudentsToday || 0,
                        highPriorityComplaints: stats?.highPriorityComplaints || 0,
                        pendingPasswordRequests: stats?.pendingPasswordRequests || 0,
                        inactiveOrganizations: stats?.inactiveOrganizations || 0,
                    }));
                } else if (user?.role === ROLES.ADMIN) {
                    const { data: stats } = await adminService.getDashboardStats();
                    console.log('stats from admin', stats)

                    setDashboardStats(prev => ({
                        ...prev,
                        wardens: stats?.wardens || 0,
                        students: stats?.students || 0,
                        parents: stats?.parents || 0,
                        pendingComplaints: stats?.pendingComplaints || 0,
                        leaveRequests: stats?.leaveRequests || 0,
                        wardenLastMonthCount: stats?.wardenLastMonthCount || 0,
                        studentLastMonthCount: stats?.studentLastMonthCount || 0,
                        parentLastMonthCount: stats?.parentLastMonthCount || 0,
                        inactiveWardens: stats?.inactiveWardens || 0,
                        parentsMessages: stats?.parentsMessages || 0,
                        complaintsOverview: stats?.complaintsOverview || { total: 0, unresolved: 0 },
                        leaveApproved: stats?.leaveApproved || 0,
                        attendance: stats?.attendance || { thisYear: [], lastYear: [] }
                    }));
                } else if (user?.role === ROLES.WARDEN) {
                    const { data: stats } = await wardenService.getWardenDashboardStats();
                    console.log('stats from warden', stats)

                    setDashboardStats(prev => ({
                        ...prev,
                        students: stats?.students || 0,
                        presentToday: stats?.presentToday || 0,
                        absent: stats?.absent || 0,
                        pendingComplaints: stats?.pendingComplaints || 0,
                        leaveRequests: stats?.leaveRequests || 0
                    }));
                }
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            }
        };

        const fetchActivities = async () => {
            try {
                const res = await logApi.getLogs({ page: 1, limit: 5 });
                const responseData = res.data?.data || res.data;
                setRecentActivities(responseData.logs || []);
            } catch (error) {
                console.error("Failed to fetch recent activities", error);
            }
        };

        const fetchComplaintSummary = async () => {
            try {
                const res = await complaintService.getComplaintSummary();
                if (res.success && res.data && res.data.total > 0) {
                    const total = res.data.total;
                    const items = (res.data.statuses && res.data.statuses.length > 0) ? res.data.statuses : res.data.categories;
                    const mappedData = items.map((item, index) => ({
                        name: item.name,
                        count: item.count,
                        value: total > 0 ? Math.round((item.count / total) * 100) : 0,
                        color: COMPLAINT_COLORS[index % COMPLAINT_COLORS.length]
                    }));
                    setComplaintData(mappedData);
                    setComplaintTotal(total);
                }
            } catch (error) {
                console.error("Failed to fetch complaint summary", error);
            }
        };

        fetchStats();
        fetchActivities();
        fetchComplaintSummary();
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === ROLES.SUPER_ADMIN) {
            const fetchChartData = async () => {
                try {
                    const { data: chartData } = await adminService.getStudentCountByOrganization({ period });
                    if (chartData && Array.isArray(chartData)) {
                        const formatted = chartData.map(item => ({
                            name: item.name.length > 8 ? item.name.substring(0, 8) + '..' : item.name,
                            value: item.count
                        }));
                        setStudentChartData(formatted);
                    }
                } catch (error) {
                    console.error("Failed to fetch chart data", error);
                }
            };
            fetchChartData();
        }
    }, [user?.role, period]);

    useEffect(() => {
        if (user?.role === ROLES.SUPER_ADMIN) {
            const fetchAttendanceData = async () => {
                try {
                    const res = await adminService.getAttendanceOverview({ period: attendancePeriod });
                    if (res && res.data) {
                        setAttendanceData(res.data.chartData || []);
                        setAttendanceMetrics({
                            avgRate: res.data.avgRate || "0%",
                            currentMonth: res.data.currentMonth || "0%",
                            vsLastMonth: res.data.vsLastMonth || "0%"
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch attendance data", error);
                }
            };
            fetchAttendanceData();
        }
    }, [user?.role, attendancePeriod]);

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    const getStatCards = () => {
        if (user?.role === ROLES.SUPER_ADMIN) {
            return [
                {
                    label: "Total Organizations", value: dashboardStats.organizations, sub: "+1 Added this month",
                    icon: <Building2 size={18} className="text-[#2D7CC3]" />, iconBg: "bg-blue-50"
                },
                {
                    label: "Total Admins", value: dashboardStats.admins, sub: "+1 Added this month",
                    icon: <ShieldCheck size={18} className="text-primary" />, iconBg: "bg-indigo-50"
                },
                {
                    label: "Total Wardens", value: dashboardStats.wardens, sub: "+4 Added this month",
                    icon: <Users size={18} className="text-[#9747FF]" />, iconBg: "bg-violet-50"
                },
                {
                    label: "Total Students", value: dashboardStats.students, sub: "+45 This month",
                    icon: <GraduationCap size={18} className="text-[#446015]" />, iconBg: "bg-green-50"
                },
                {
                    label: "Total Hostels", value: dashboardStats.hostels, sub: "+1 Added this month",
                    icon: <House size={18} className="text-[#14B8A6] " />, iconBg: "bg-teal-50"
                }
            ];
        }

        if (user?.role === ROLES.ADMIN) {
            return [
                {
                    label: "Total Students", value: dashboardStats.students, sub: `+${dashboardStats.studentLastMonthCount || 0} This month`,
                    icon: <GraduationCap size={18} className="text-[#446015]" />, iconBg: "bg-green-50"
                },
                {
                    label: "Total Wardens", value: dashboardStats.wardens, sub: `+${dashboardStats.wardenLastMonthCount || 0} Added this month`,
                    icon: <Users size={18} className="text-[#9747FF]" />, iconBg: "bg-violet-50"
                },
                {
                    label: "Total Parents", value: dashboardStats.parents, sub: `+${dashboardStats.parentLastMonthCount || 0} Added this month`,
                    icon: <Users size={18} className="text-[#2D7CC3]" />, iconBg: "bg-blue-50"
                },
                {
                    label: "Pending Complaints", value: dashboardStats.pendingComplaints, sub: "Requires attention",
                    icon: <AlertTriangle size={18} className="text-[#F59E0B]" />, iconBg: "bg-[#FFF4E5]"
                },
                {
                    label: "Total Leave Requests", value: dashboardStats.leaveRequests, sub: "Awaiting approval",
                    icon: <MessageSquare size={18} className="text-[#2D7CC3]" />, iconBg: "bg-[#EAF3FF]"
                }
            ];
        }

        if (user?.role === ROLES.WARDEN) {
            return [
                {
                    label: "Total Students", value: dashboardStats.students, sub: "+45 This month",
                    icon: <GraduationCap size={18} className="text-[#446015]" />, iconBg: "bg-green-50"
                },
                {
                    label: "Present Today", value: dashboardStats.presentToday, sub: "92% Attendance",
                    icon: <UserCheck size={18} className="text-[#6B8E23]" />, iconBg: "bg-[#EEF7E7]"
                },
                {
                    label: "Absent", value: dashboardStats.absent, sub: "8% Absent",
                    icon: <X size={18} className="text-[#EF4444]" />, iconBg: "bg-[#FEE2E2]"
                },
                {
                    label: "Pending Complaints", value: dashboardStats.pendingComplaints, sub: "2 High Priority",
                    icon: <AlertTriangle size={18} className="text-[#F59E0B]" />, iconBg: "bg-[#FFF4E5]"
                },
                {
                    label: "Total Leave Requests", value: dashboardStats.leaveRequests, sub: "5 Pending",
                    icon: <MessageSquare size={18} className="text-[#2D7CC3]" />, iconBg: "bg-[#EAF3FF]"
                }
            ];
        }

        return [];
    };

    const dynamicStatCards = getStatCards();

    // State to toggle the "Add Hostel" Modal
    const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

    // Form states for the modal inputs
    const [hostelName, setHostelName] = useState("");
    const [hostelType, setHostelType] = useState("");
    const [capacity, setCapacity] = useState("");

    // Form states for Add Organization Modal
    const [orgId, setOrgId] = useState("");
    const [orgName, setOrgName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    const handleAddHostelSubmit = (e) => {
        e.preventDefault();
        // Handle your creation logic here (API calls, state updates, etc.)
        console.log({ hostelName, hostelType, capacity });

        // Reset and close modal
        setHostelName("");
        setHostelType("");
        setCapacity("");
        setIsHostelModalOpen(false);
    };

    const handleAddOrgSubmit = (e) => {
        e.preventDefault();
        console.log({ orgId, orgName, phone, email, address });

        // Reset and close modal
        setOrgId("");
        setOrgName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setIsOrgModalOpen(false);
    };

    const getQuickSummary = () => [
        {
            icon: Users,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            title: "New Students",
            desc: `${dashboardStats.newStudentsToday || 0} new students today`,
            descClass: "text-primary",
        },
        {
            icon: AlertTriangle,
            iconBg: "bg-danger/10",
            iconColor: "text-danger",
            title: "Complaint Status",
            desc: `${dashboardStats.highPriorityComplaints || 0} High Priority`,
            descClass: "text-danger",
        },
        {
            icon: KeyRound,
            iconBg: "bg-warning/10",
            iconColor: "text-warning",
            title: "Password Request",
            desc: `${dashboardStats.pendingPasswordRequests || 0} New Requests`,
            descClass: "text-warning",
        },
        {
            icon: Building2,
            iconBg: "bg-success/10",
            iconColor: "text-success",
            title: "Inactive Organizations",
            desc: `${dashboardStats.inactiveOrganizations || 0} inactive organizations`,
            descClass: "text-primary",
        },
    ];

    if (user?.role === ROLES.PARENT) {
        return <ParentDashboard />;
    }

    if (user?.role === ROLES.STUDENT) {
        return <StudentDashboard />;
    }

    if (user?.role === 'maintenance_staff') {
        return <MaintenanceStaffDashboardOverview />;
    }

    if (user?.role === ROLES.WARDEN) {
        return <WardenDashboardOverview user={user} />;
    }

    const renderOrganizationOverview = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-full flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4 sm:gap-0">
                <div>
                    <h2 className="text-sm font-bold text-primary">
                        Organization Overview
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        View student distribution across organizations.
                    </p>
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                    <Dropdown
                        options={[
                            { value: "This Year", label: "This Year" },
                            { value: "Last Year", label: "Last Year" }
                        ]}
                        value={period}
                        onChange={(val) => setPeriod(val)}
                        placeholder="This Year"
                        minWidth="w-full sm:w-28"
                        triggerClassName="w-full sm:w-auto px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-500 font-medium cursor-pointer"
                    />
                </div>
            </div>
            {studentChartData && studentChartData.length > 0 ? (
                <div className="flex-1 w-full min-w-0 min-h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={studentChartData}
                            barSize={18}
                            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                        >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#F0F1F3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "#8898AA" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#8898AA" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip cursor={{ fill: "#F0F4FF" }} />
                        <Bar dataKey="value" fill="#B8CAFF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
                <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
                    <MessageSquare size={32} className="mb-2 text-gray-200" />
                    <p className="text-sm">No record found</p>
                </div>
            )}
        </div>
    );

    const renderQuickSummary = () => {
        const quickSummary = [
            {
                icon: AlertTriangle,
                iconBg: "bg-red-50",
                iconColor: "text-red-400",
                title: "Complaint Status",
                desc: `${dashboardStats.complaintsOverview?.unresolved || 0} Pending`,
            },
            {
                icon: UserCheck,
                iconBg: "bg-green-50",
                iconColor: "text-green-400",
                title: "Leave Approved",
                desc: `${dashboardStats.leaveApproved || 0} Approved`,
            },
            {
                icon: MessageSquare,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-400",
                title: "Parents Messages",
                desc: `${dashboardStats.parentsMessages || 0} New`,
            },
            {
                icon: Users,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-400",
                title: "Inactive Warden",
                desc: `${dashboardStats.inactiveWardens || 0} Inactive`,
            },
        ];

        return (
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
                <h2 className="text-base font-bold text-gray-900 mb-1">Quick Summary</h2>
                <p className="text-xs text-gray-400 mb-5">Today at a glance</p>

                <div className="flex flex-col gap-3 flex-1 justify-center">
                    {quickSummary.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50"
                        >
                            <div className={"w-10 h-10 rounded-lg flex items-center justify-center mr-4 " + item.iconBg}>
                                <item.icon className={"w-5 h-5 " + item.iconColor} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-medium">{item.title}</div>
                                <div className={`text-xs mt-0.5 ${item.iconColor}`}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAttendanceOverview = () => {
        let currentData = [];
        let avgRate = "0";
        let currentMonthValue = 0;
        let vsLastFormatted = "0%";

        if (user?.role === ROLES.SUPER_ADMIN) {
            currentData = attendanceData || [];
            avgRate = attendanceMetrics.avgRate;
            currentMonthValue = attendanceMetrics.currentMonth;
            vsLastFormatted = attendanceMetrics.vsLastMonth;
        } else {
            currentData = (attendancePeriod === "This Year" ? dashboardStats.attendance?.thisYear : dashboardStats.attendance?.lastYear) || [];
            
            const validMonths = currentData.filter(d => d.value > 0);
            avgRate = validMonths.length > 0 
                ? Math.round(validMonths.reduce((sum, d) => sum + d.value, 0) / validMonths.length)
                : 0;
                
            const currentMonthIndex = new Date().getMonth();
            currentMonthValue = currentData[currentMonthIndex]?.value || 0;
            
            const lastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
            const lastMonthValue = currentData[lastMonthIndex]?.value || 0;
            
            let vsLast = 0;
            if (lastMonthValue > 0) {
                vsLast = (((currentMonthValue - lastMonthValue) / lastMonthValue) * 100).toFixed(1);
            } else if (currentMonthValue > 0) {
                vsLast = 100.0;
            }
            vsLastFormatted = vsLast > 0 ? `+${vsLast}%` : `${vsLast}%`;
        }

        return (
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-[20px] font-bold text-black">
                        Attendance Overview
                    </h2>
                    <p className="text-sm text-[#8F8F8F] mt-1">
                        Overall attendance percentage across organizations.
                    </p>
                </div>
                <div className="relative min-w-[120px] w-full sm:w-auto">
                    <Dropdown
                        options={[
                            { value: "This Year", label: "This Year" },
                            { value: "Last Year", label: "Last Year" }
                        ]}
                        value={attendancePeriod}
                        onChange={(val) => setAttendancePeriod(val)}
                        triggerClassName="px-3 py-1.5 text-xs font-medium text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer w-full flex justify-between items-center"
                    />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                    <div className="text-[#2D7CC3] font-bold text-sm">{avgRate}{user?.role === ROLES.SUPER_ADMIN && typeof avgRate === 'string' && avgRate.includes('%') ? '' : '%'}</div>
                    <div className="text-xs text-[#8F8F8F] mt-1">Avg Rate</div>
                </div>
                <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                    <div className="text-success font-bold text-sm">{currentMonthValue}{user?.role === ROLES.SUPER_ADMIN && typeof currentMonthValue === 'string' && currentMonthValue.includes('%') ? '' : '%'}</div>
                    <div className="text-xs text-[#8F8F8F] mt-1">Current Month</div>
                </div>
                <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                    <div className="text-success font-bold text-sm">{vsLastFormatted}</div>
                    <div className="text-xs text-[#8F8F8F] mt-1">vs Last</div>
                </div>
            </div>

            <div className="flex-1 min-h-[220px] w-full min-w-0">
                {currentData.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={currentData}
                            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0A467F" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#0A467F" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#EEF1F4" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                                tickFormatter={(v) => v + "%"}
                                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                            />
                            <Tooltip formatter={(value) => [value + "%", "Attendance"]} cursor={{ fill: "#F3F4F6" }} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#0A467F"
                                strokeWidth={3}
                                fill="url(#attendanceGradient)"
                                dot={false}
                                activeDot={{ r: 5, fill: "#0A467F" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-10">
                        <MessageSquare size={32} className="mb-2 text-gray-200" />
                        <p className="text-sm">No attendance records found for {period.toLowerCase()}</p>
                    </div>
                )}
            </div>
        </div>
        );
    };

    const renderComplaintPieChart = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col items-center h-full">
            <h2 className="text-sm font-bold text-[#000000] self-start w-full">
                Complaint Status
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 self-start w-full mb-6">
                Current overview of all reported issues.
            </p>
            {complaintData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-10 flex-1 w-full mt-4">
                    <div className="relative w-[200px] h-[200px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={complaintData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {complaintData.map((entry, index) => (
                                        <Cell key={"cell-" + index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [value + "%", name]}
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[32px] font-bold text-gray-900 leading-none">
                                {complaintTotal}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1">Total Tasks</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {complaintData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between w-[160px]">
                                <div className="flex items-center gap-3 text-[13px] text-gray-700">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="truncate" title={item.name}>{item.name}</span>
                                </div>
                                <span className="text-[13px] font-semibold text-gray-900 ml-2">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 flex-1">
                    <MessageSquare size={32} className="mb-2 text-gray-200" />
                    <p className="text-sm">No complaints found</p>
                </div>
            )}
        </div>
    );

    const renderRecentActivities = () => (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-sm font-bold text-[#000000]">
                        Recent Activities
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Latest actions across the system
                    </p>
                </div>
                <Link
                    to="/dashboard/logs"
                    className="text-xs text-[#777777] font-medium hover:underline"
                >
                    View all
                </Link>
            </div>
            {recentActivities.map((log) => {
                let iconBg = "bg-[#EAF3FF]";
                let iconColor = "text-[#2D7CC3]";
                let tagClass = "bg-[#EAF3FF] text-[#2D7CC3]";
                
                const actionLower = (log.action || '').toLowerCase();
                const detailsLower = (log.details || '').toLowerCase();
                const combinedText = actionLower + ' ' + detailsLower;

                let IconComponent = Info;

                if (combinedText.includes('create') || combinedText.includes('add') || combinedText.includes('register')) {
                    IconComponent = combinedText.includes('user') || combinedText.includes('student') || combinedText.includes('warden') || combinedText.includes('admin') || combinedText.includes('parent')
                        ? UserPlus
                        : PlusCircle;
                } else if (combinedText.includes('delete') || combinedText.includes('remove')) {
                    IconComponent = Trash2;
                } else if (combinedText.includes('update') || combinedText.includes('edit') || combinedText.includes('modify')) {
                    IconComponent = Edit;
                } else if (combinedText.includes('login') || combinedText.includes('auth') || combinedText.includes('sign in')) {
                    IconComponent = LogIn;
                } else if (combinedText.includes('complaint') || combinedText.includes('issue')) {
                    IconComponent = MessageSquare;
                } else if (combinedText.includes('leave') || combinedText.includes('request')) {
                    IconComponent = FileText;
                }

                if (log.status === 'success') {
                    iconBg = "bg-[#EEF7E7]";
                    iconColor = "text-[#6B8E23]";
                    tagClass = "bg-[#EEF7E7] text-[#6B8E23]";
                    if (IconComponent === Info) IconComponent = CheckCircle;
                } else if (log.status === 'error') {
                    iconBg = "bg-[#FEE2E2]";
                    iconColor = "text-[#EF4444]";
                    tagClass = "bg-[#FEE2E2] text-[#EF4444]";
                    if (IconComponent === Info) IconComponent = XCircle;
                } else if (log.status === 'warning') {
                    iconBg = "bg-[#FFF4E5]";
                    iconColor = "text-[#F59E0B]";
                    tagClass = "bg-[#FFF4E5] text-[#F59E0B]";
                    if (IconComponent === Info) IconComponent = AlertTriangle;
                }

                return (
                    <div
                        key={log._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-4 py-3 mt-3 gap-2 sm:gap-4"
                    >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 " + iconBg}>
                                <IconComponent size={18} className={iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                    <p className="text-[13px] text-[#333333] break-words">
                                        {log.action} - <strong className="font-medium">{log.details?.length > 60 ? log.details.substring(0, 60) + '...' : log.details}</strong>
                                    </p>
                                    {log.status && (
                                        <span className={"px-2 py-0.5 rounded-full text-[10px] font-medium capitalize shrink-0 " + tagClass}>
                                            {log.status}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#9CA3AF] mt-1 capitalize truncate">
                                    By {log.user?.name || log.user?.email || 'System'} {log.userRole ? "(" + log.userRole + ")" : ''}
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] sm:text-xs text-[#9CA3AF] whitespace-nowrap self-start sm:self-auto ml-[52px] sm:ml-0">
                            {formatRelativeTime(log.createdAt)}
                        </span>
                    </div>
                );
            })}
            {recentActivities.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">No recent activities found.</div>
            )}
        </div>
    );


    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900">
            {/* Topbar */}
            <div className="px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left Section */}
                <div>
                    <h1 className="text-2xl font-bold text-black mb-1">
                        {t('dashboard')}
                    </h1>

                    <p className="text-sm text-gray-500">
                        Welcome back{" "}
                        <span className="text-primary font-semibold">{user?.name || "User"}</span>, here's
                        what's happening today
                    </p>
                </div>

                {/* Right Section */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0">

                </div>
            </div>

            <div className="p-4 md:p-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {dynamicStatCards.map((c, index) => {
                        const borderColors = [
                            "border-t-[#2D7CC3]", // 1st box
                            "border-t-[#0A467F]", // 2nd box
                            "border-t-[#9747FF]", // 3rd box
                            "border-t-[#446015]", // 4th box
                            "border-t-[#14B8A6]", // 5th box
                        ];

                        return (
                            <div
                                key={c.label}
                                className={`bg-white rounded-xl p-5 border border-gray-100 border-t-[2px] ${borderColors[index]} ${index === 0 ? 'col-span-2 sm:col-span-1' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xs text-gray-500 font-medium leading-tight uppercase tracking-wider">
                                        {c.label}
                                    </span>

                                    <div
                                        className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center text-sm flex-shrink-0`}
                                    >
                                        {c.icon}
                                    </div>
                                </div>

                                <div className="text-[24px] font-semibold tracking-tight mt-2 mb-1">
                                    {c.value}
                                </div>

                                <div className="text-[12px] text-[#9CA3AF]">{c.sub}</div>
                            </div>
                        );
                    })}
                </div>


                {user?.role === ROLES.SUPER_ADMIN && (
                    <div className="flex flex-col gap-4">
                        {/* Hostel Overview + Quick Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                            {renderOrganizationOverview()}

                    {/* Quick Summary */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-[#000000]">Quick Summary</h2>
                        <p className="text-xs text-[#777777] mt-0.5 mb-2">
                            Today at a glance
                        </p>
                        {getQuickSummary().map((item, i, arr) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    {/* Render component directly */}
                                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#777777]">{item.title}</p>
                                    <p className={`text-xs font-medium mt-0.5 ${item.descClass}`}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance + Complaint */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Attendance Area Chart */}
                    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-[20px] font-bold text-black">
                                    Attendance Overview
                                </h2>
                                <p className="text-sm text-[#8F8F8F] mt-1">
                                    Overall attendance percentage across organizations.
                                </p>
                            </div>

                            <div className="relative min-w-[120px] w-full sm:w-auto">
                                <Dropdown
                                    options={[
                                        { value: "This Year", label: "This Year" },
                                        { value: "Last Year", label: "Last Year" }
                                    ]}
                                    value={attendancePeriod}
                                    onChange={(val) => setAttendancePeriod(val)}
                                    triggerClassName="px-3 py-1.5 text-xs font-medium text-start rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer w-full flex justify-between items-center"
                                />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                                <div className="text-[#2D7CC3] font-bold text-sm">{attendanceMetrics.avgRate}</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Avg Rate</div>
                            </div>

                            <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">{attendanceMetrics.currentMonth}</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Current Month</div>
                            </div>

                            <div className="flex-1 bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-4 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">{attendanceMetrics.vsLastMonth}</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">vs Last</div>
                            </div>
                        </div>

                        {/* Chart */}
                        {attendanceData.some(d => d.value > 0) ? (
                            <div className="h-[220px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                    data={attendanceData}
                                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0A467F" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0A467F" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#EEF1F4"
                                    />

                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        domain={[0, 100]}
                                        ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                                    />

                                    <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />

                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#0A467F"
                                        strokeWidth={3}
                                        fill="url(#attendanceGradient)"
                                        dot={false}
                                        activeDot={{
                                            r: 5,
                                            fill: "#0A467F",
                                        }}
                                    />
                                </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
                                <p className="text-sm">No data found in this date period</p>
                            </div>
                        )}
                    </div>

                        {renderComplaintPieChart()}
                        </div>

                        <div className="mt-4">
                            {renderRecentActivities()}
                        </div>
                    </div>
                )}

                {user?.role === ROLES.ADMIN && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-stretch">
                            {renderAttendanceOverview()}
                            {renderQuickSummary()}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                            {renderComplaintPieChart()}
                            {renderRecentActivities()}
                        </div>
                    </div>
                )}

            </div>


            {isHostelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    {/* Modal Content container wrapper matching the UI design template */}
                    <div className="bg-white rounded-[24px] max-w-4xl w-full shadow-2xl p-8 md:p-10 relative border border-gray-100 transition-transform transform scale-100">

                        {/* Close button top right corner */}
                        <button
                            onClick={() => setIsHostelModalOpen(false)}
                            className="absolute top-8 right-8 p-2 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Title and Subtitle */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Hostel</h2>
                            <p className="text-sm text-gray-400 mt-1">Fill in the details to manually create a new Hostel</p>
                        </div>

                        {/* Divider Line */}
                        <div className="w-full h-[1px] bg-gray-100 mb-8" />

                        {/* Form elements structure */}
                        <form onSubmit={handleAddHostelSubmit} className="space-y-6">

                            {/* Row 1: Full-width Hostel Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                    Hostel Name<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter hostel name"
                                    value={hostelName}
                                    onChange={(e) => setHostelName(e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow text-sm"
                                />
                            </div>

                            {/* Row 2: Grid Split layout (Hostel Type & Capacity) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Hostel Type dropdown menu option fields */}
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Hostel Type<span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={hostelType}
                                            onChange={(e) => setHostelType(e.target.value)}
                                            className="w-full appearance-none px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-600 focus:outline-none focus:border-primary text-sm pr-10 cursor-pointer"
                                        >
                                            <option value="" disabled hidden>Select</option>
                                            <option value="Boys">Boys Hostel</option>
                                            <option value="Girls">Girls Hostel</option>
                                            <option value="Co-Ed">Co-Ed Hostel</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity selection dropdown box */}
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Capacity<span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                            className="w-full appearance-none px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-600 focus:outline-none focus:border-primary text-sm pr-10 cursor-pointer"
                                        >
                                            <option value="" disabled hidden>Select</option>
                                            <option value="100">100 Students</option>
                                            <option value="250">250 Students</option>
                                            <option value="500">500 Students</option>
                                            <option value="1000">1000+ Students</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons Container aligned exactly to the right floor */}
                            <div className="flex items-center justify-end gap-4 pt-4 mt-4">
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-primary hover:bg-[#1565B3] text-white font-medium rounded-xl transition-colors min-w-[120px] text-sm text-center cursor-pointer"
                                >
                                    save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsHostelModalOpen(false)}
                                    className="px-8 py-3 bg-white border border-primary text-primary hover:bg-[#1565B3] hover:text-white font-medium rounded-xl transition-colors min-w-[120px] text-sm text-center cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isOrgModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[24px] max-w-4xl w-full shadow-2xl p-8 md:p-10 relative border border-gray-100 transition-transform transform scale-100">
                        {/* Close button top right corner */}
                        <button
                            onClick={() => setIsOrgModalOpen(false)}
                            className="absolute top-8 right-8 p-2 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Title and Subtitle */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Organization</h2>
                            <p className="text-sm text-gray-400 mt-1">Fill in the details to manually create a new Organization</p>
                        </div>

                        {/* Divider Line */}
                        <div className="w-full h-[1px] bg-gray-100 mb-8" />

                        {/* Form structure matches the template image blueprint exactly */}
                        <form onSubmit={handleAddOrgSubmit} className="space-y-6">

                            {/* Row 1: Organization Id & Organization Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Organization Id<span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Eg : A78748"
                                        value={orgId}
                                        onChange={(e) => setOrgId(e.target.value)}
                                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Organization Name<span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter Organization name"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow text-sm"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Phone Number & Email Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Phone Number<span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-shadow">
                                        <div className="flex items-center gap-1 bg-white px-3 border-r border-gray-200 text-gray-600 text-sm">
                                            <span className="text-base">🇮🇳</span>
                                            <span>+91</span>
                                            <ChevronDown size={12} className="text-gray-400 ml-0.5" />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-4 py-3.5 bg-white text-gray-700 placeholder-gray-400 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-800">
                                        Email Address<span className="text-red-500 ml-0.5">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow text-sm"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Full Address Textarea */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                    Full Address<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Text the address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow text-sm resize-none"
                                />
                            </div>

                            {/* Row 4: Action Buttons aligned perfectly to the template image blueprint */}
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="px-10 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-[#1565B3] transition-colors cursor-pointer min-w-[100px] text-center"
                                >
                                    save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOrgModalOpen(false)}
                                    className="px-8 py-2.5 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-white     transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardOverview;
