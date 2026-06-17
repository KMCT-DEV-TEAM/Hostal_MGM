import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import adminService from "@/services/admin.service";
import wardenService from "@/services/warden.service";
import organizationService from "@/services/organization.service";
import hostelService from "@/services/hostel.service";

import newStudentIcon from "../../../assets/images/dashboard/Frame.png";
import complaintIcon from "../../../assets/images/dashboard/Vector (1).png";
import passwordIcon from "../../../assets/images/dashboard/Group 719.png";
import organizationIcon from "../../../assets/images/dashboard/Frame1.png";

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
} from "lucide-react";


// ── Data ─────────────────────────────────────────────────────────────────────
const hostelData = [
    { month: "ENG", value: 210 },
    { month: "MED", value: 235 },
    { month: "DEN", value: 250 },
    { month: "NUR", value: 265 },
    { month: "PHARM", value: 195 },
    { month: "ARCH", value: 185 },
    { month: "POLY", value: 210 },
    { month: "AHS", value: 220 },
    { month: "LAW", value: 215 },
    { month: "JETM", value: 260 },
    { month: "HM", value: 265 },
    { month: "ITM", value: 250 },
    { month: "SD", value: 235 },
    { month: "CEW", value: 215 },
    { month: "NCP", value: 180 },
];

const attendanceData = [
    { month: "Jan", value: 70 },
    { month: "Feb", value: 72 },
    { month: "Mar", value: 78 },
    { month: "Apr", value: 97 },
    { month: "May", value: 82 },
    { month: "Jun", value: 74 },
    { month: "July", value: 68 },
    { month: "Aug", value: 65 },
    { month: "Sep", value: 67 },
    { month: "Oct", value: 65 },
    { month: "Nov", value: 60 },
    { month: "Dec", value: 50 },
];

const complaintData = [
    { name: "Maintenance", value: 40, color: "#0A467F", count: 499 },
    { name: "Mess / Food", value: 25, color: "#9D77CE", count: 312 },
    { name: "Roommate", value: 15, color: "#F8BA52", count: 187 },
    { name: "Wifi Network", value: 10, color: "#55CDA6", count: 125 },
    { name: "Other", value: 10, color: "#A6A6A6", count: 125 },
];

const activities = [
    {
        icon: <Wrench size={18} className="text-[#2D7CC3]" />,
        iconBg: "bg-[#EAF3FF]",
        text: (
            <>
                Maintenance complaint filed - Room A07 <strong>Plumbing</strong>
            </>
        ),
        tag: "New",
        tagClass: "bg-[#EAF3FF] text-[#2D7CC3]",
        by: "By Roy Mathew",
        time: "5 min ago",
    },
    {
        icon: <UserCheck size={18} className="text-[#6B8E23]" />,
        iconBg: "bg-[#EEF7E7]",
        text: (
            <>
                Leave Request from <strong>Rohan Mehtha</strong> approved
            </>
        ),
        tag: "Approved",
        tagClass: "bg-[#EEF7E7] text-[#6B8E23]",
        by: "By Admin",
        time: "10 min ago",
    },
    {
        icon: <AlertTriangle size={18} className="text-[#F59E0B]" />,
        iconBg: "bg-[#FFF4E5]",
        text: (
            <>
                Maintenance complaint filed — Room A08 <strong>plumbing</strong>
            </>
        ),
        tag: "Open",
        tagClass: "bg-[#FFF4E5] text-[#F59E0B]",
        by: "By Kiran Raj",
        time: "18 min ago",
    },
    {
        icon: <MessageSquare size={18} className="text-[#2D7CC3]" />,
        iconBg: "bg-[#EAF3FF]",
        text: (
            <>
                Parent of <strong>Aditya Sharma</strong> sent a message
            </>
        ),
        tag: null,
        tagClass: "",
        by: "Via Student Portal",
        time: "1 hour ago",
    },
];

const quickSummary = [
    {
        icon: Users,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        title: "New Students",
        desc: "2 new students today",
        descClass: "text-primary",
    },
    {
        icon: AlertTriangle,
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
        title: "Complaint Status",
        desc: "5 High Priority",
        descClass: "text-danger",
    },
    {
        icon: KeyRound,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
        title: "Password Request",
        desc: "10 New Requests",
        descClass: "text-warning",
    },
    {
        icon: Building2,
        iconBg: "bg-success/10",
        iconColor: "text-success",
        title: "Inactive Organizations",
        desc: "2 inactive organizations",
        descClass: "text-primary",
    },
];

function DashboardOverview() {
    const { user } = useAuthStore();
    const [period, setPeriod] = useState("This Year");
    const [dashboardStats, setDashboardStats] = useState({
        organizations: 0, admins: 0, wardens: 0, students: 0, hostels: 0,
        parents: 0, pendingComplaints: 0, leaveRequests: 0, presentToday: 0, absent: 0
    });

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
                        students: stats?.students || 0
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
                        leaveRequests: stats?.leaveRequests || 0
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

        fetchStats();
    }, [user?.role]);

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
                    label: "Total Students", value: dashboardStats.students, sub: "+45 This month",
                    icon: <GraduationCap size={18} className="text-[#446015]" />, iconBg: "bg-green-50"
                },
                {
                    label: "Total Wardens", value: dashboardStats.wardens, sub: "+4 Added this month",
                    icon: <Users size={18} className="text-[#9747FF]" />, iconBg: "bg-violet-50"
                },
                {
                    label: "Total Parents", value: dashboardStats.parents, sub: "+10 Added this month",
                    icon: <Users size={18} className="text-[#2D7CC3]" />, iconBg: "bg-blue-50"
                },
                {
                    label: "Pending Complaints", value: dashboardStats.pendingComplaints, sub: "5 High Priority",
                    icon: <AlertTriangle size={18} className="text-[#F59E0B]" />, iconBg: "bg-[#FFF4E5]"
                },
                {
                    label: "Total Leave Requests", value: dashboardStats.leaveRequests, sub: "12 Pending",
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

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900">
            {/* Topbar */}
            <div className="px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left Section */}
                <div>
                    <h1 className="text-2xl font-bold text-black mb-1">
                        Dashboard
                    </h1>

                    <p className="text-sm text-gray-500">
                        Welcome back{" "}
                        <span className="text-primary font-semibold">{user?.name || "User"}</span>, here's
                        what's happening today
                    </p>
                </div>

                {/* Right Section */}
                <div className="flex flex-wrap gap-2">
                    {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                        <button
                            onClick={() => setIsHostelModalOpen(true)}
                            className="px-4 py-2 rounded-md bg-primary text-white font-medium text-sm hover:bg-[#1565B3] transition-colors cursor-pointer"
                        >
                            + Add Hostel
                        </button>
                    )}

                    {user?.role === ROLES.SUPER_ADMIN && (
                        <button
                            onClick={() => setIsOrgModalOpen(true)}
                            className="px-4 py-2 rounded-md bg-primary text-white font-medium text-sm hover:bg-[#1565B3] transition-colors cursor-pointer"
                        >
                            + Add Organization
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">
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
                                className={`bg-white rounded-xl p-5 border border-gray-100 border-t-1 ${borderColors[index]}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xs text-gray-500 font-medium leading-tight">
                                        {c.label}
                                    </span>

                                    <div
                                        className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center text-sm flex-shrink-0`}
                                    >
                                        {c.icon}
                                    </div>
                                </div>

                                <div className="text-[24px] font-semibold tracking-tight">
                                    {c.value}
                                </div>

                                <div className="text-[12px] text-[#9CA3AF]">{c.sub}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Hostel Overview + Quick Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                    {/* Hostel Bar Chart */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-primary">
                                    Hostel Overview
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    View student distribution across hostels.
                                </p>
                            </div>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-500 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                                <option>This Year</option>
                                <option>Last Year</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={hostelData}
                                barSize={18}
                                margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#F0F1F3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 10, fill: "#8898AA" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "#8898AA" }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 300]}
                                    ticks={[0, 50, 100, 150, 200, 250, 300]}
                                />
                                <Tooltip cursor={{ fill: "#F0F4FF" }} />
                                <Bar dataKey="value" fill="#B8CAFF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-[#000000]">Quick Summary</h2>
                        <p className="text-xs text-[#777777] mt-0.5 mb-2">
                            Today at a glance
                        </p>
                        {quickSummary.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 py-3 ${i < quickSummary.length - 1 ? "border-b border-gray-50" : ""}`}
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
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-[20px] font-bold text-black">
                                    Attendance Overview
                                </h2>
                                <p className="text-sm text-[#8F8F8F] mt-1">
                                    Overall attendance percentage across organizations.
                                </p>
                            </div>

                            <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-500 outline-none bg-[#F8F8F8] ">
                                <option>This Year</option>
                                <option>Last Year</option>
                            </select>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3 mb-8">
                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#2D7CC3] font-bold text-sm">91.2%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Avg Rate</div>
                            </div>

                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">95.8%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">Current Month</div>
                            </div>

                            <div className="bg-[#F7F8FA] border border-[#ECEEF2] rounded-xl px-5 py-3 min-w-[90px] text-center">
                                <div className="text-[#0F6E56] font-bold text-sm">+2.3%</div>
                                <div className="text-xs text-[#8F8F8F] mt-1">vs Last</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <ResponsiveContainer width="100%" height={220}>
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

                    {/* Complaint Pie Chart */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-[#000000] mb-5">
                            Complaint Summary
                        </h2>
                        <div className="flex items-center justify-center gap-7 flex-wrap">
                            <PieChart width={190} height={190}>
                                <Pie
                                    data={complaintData}
                                    cx={90}
                                    cy={90}
                                    innerRadius={58}
                                    outerRadius={88}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    labelLine={false}
                                >
                                    {complaintData.map((e, i) => (
                                        <Cell key={i} fill={e.color} />
                                    ))}
                                </Pie>
                                <text
                                    x={90}
                                    y={84}
                                    textAnchor="middle"
                                    fontSize={22}
                                    fontWeight={700}
                                    fill="#1A1F36"
                                >
                                    50
                                </text>
                                <text
                                    x={90}
                                    y={104}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="#000000"
                                >
                                    Total Complaints
                                </text>
                            </PieChart>

                            <div className="flex flex-col gap-2.5">
                                {complaintData.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center gap-2.5 text-xs"
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ background: item.color }}
                                        />
                                        <span className="text-gray-600 w-24">{item.name}</span>
                                        <span className="font-bold text-gray-900 w-8 text-right">
                                            {item.value}%
                                        </span>
                                        <span className="text-gray-300">({item.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h2 className="text-sm font-bold text-[#000000]">
                                Recent Activities
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Latest actions across the system
                            </p>
                        </div>
                        <a
                            href="#"
                            className="text-xs text-[#777777] font-medium hover:underline"
                        >
                            View all
                        </a>
                    </div>

                    {activities.map((a, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between bg-[#F8FAFC] border border-[#EEF2F7] rounded-xl px-4 py-3 mt-3"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                {/* Icon */}
                                <div
                                    className={`w-10 h-10 rounded-lg ${a.iconBg} flex items-center justify-center flex-shrink-0`}
                                >
                                    {a.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <p className="text-[13px] text-[#333333]">
                                            {a.text}
                                        </p>

                                        {a.tag && (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${a.tagClass}`}
                                            >
                                                {a.tag}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-[#9CA3AF] mt-1">
                                        {a.by}
                                    </p>
                                </div>
                            </div>

                            {/* Time */}
                            <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-4">
                                {a.time}
                            </span>
                        </div>
                    ))}
                </div>
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