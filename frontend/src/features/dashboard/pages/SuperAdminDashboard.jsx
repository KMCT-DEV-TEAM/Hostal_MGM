import { useState } from "react";
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
    Cell,
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
        icon: newStudentIcon,
        iconBg: "bg-indigo-50",
        title: "New Students",
        desc: "2 new students today",
        descClass: "text-indigo-600",
    },
    {
        icon: complaintIcon,
        iconBg: "bg-red-50",
        title: "Complaint Status",
        desc: "5 High Priority",
        descClass: "text-red-600",
    },
    {
        icon: passwordIcon,
        iconBg: "bg-amber-50",
        title: "Password Request",
        desc: "10 New Requests",
        descClass: "text-amber-500",
    },
    {
        icon: organizationIcon,
        iconBg: "bg-[#14B8A614]",
        title: "Inactive Organizations",
        desc: "2 inactive organizations",
        descClass: "text-indigo-600",
    },
];

const statCards = [
    {
        label: "Total Organizations",
        value: "30",
        sub: "+1 Added this month",
        icon: <Building2 size={18} className="text-[#2D7CC3]" />,
        iconBg: "bg-blue-50",
    },
    {
        label: "Total Admins",
        value: "2050",
        sub: "+1 Added this month",
        icon: <ShieldCheck size={18} className="text-[#0A467F]" />,
        iconBg: "bg-indigo-50",
    },
    {
        label: "Total Wardens",
        value: "50",
        sub: "+4 Added this month",
        icon: <Users size={18} className="text-[#9747FF]" />,
        iconBg: "bg-violet-50",
    },
    {
        label: "Total Students",
        value: "3000",
        sub: "+45 This month",
        icon: <GraduationCap size={18} className="text-[#446015]" />,
        iconBg: "bg-green-50",
    },
    {
        label: "Total Hostels",
        value: "15",
        sub: "+1 Added this month",
        icon: <House size={18} className="text-[#14B8A6] " />,
        iconBg: "bg-teal-50",
    },
];

function SuperAdminDashboard() {


    const [period, setPeriod] = useState("This Year");

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-sm text-gray-900">
            {/* Topbar */}
            <div className=" px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-sm text-gray-500">
                    Welcome back{" "}
                    <span className="text-[#0A467F] font-semibold">Arjun</span>, here's
                    what's happening today
                </p>
                <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 rounded-md border bg-[#0A467F] text-[#ffffff] font-medium text-sm hover:bg-[#1565B3] transition-colors">
                        + Add Hostel
                    </button>
                    <button className="px-4 py-2 rounded-md bg-[#0A467F] text-white font-medium text-sm hover:bg-[#1565B3] transition-colors">
                        + Add Organization
                    </button>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statCards.map((c, index) => {
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

                                <div className="text-[34px] font-semibold tracking-tight">
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
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-[#0A467F]">
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
                                <div
                                    className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}
                                >
                                    <img
                                        src={item.icon}
                                        alt={item.title}
                                        className="w-5 h-5 object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#777777]">
                                        {item.title}
                                    </p>
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
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                            <div>
                                <h2 className="text-sm font-bold text-[#777777]">
                                    Attendance Overview
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Overall attendance percentage across organizations.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                {[
                                    ["91.2%", "Avg Rate", "text-[#2D7CC3]"],
                                    ["95.8%", "Current Month", "text-[#0F6E56]"],
                                    ["+2.3%", "vs Last", "text-[#0F6E56]"],
                                ].map(([v, l, cls]) => (
                                    <div key={l} className="text-center">
                                        <div className={`text-sm font-bold ${cls}`}>{v}</div>
                                        <div className="text-xs text-gray-400">{l}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={230}>
                            <AreaChart
                                data={attendanceData}
                                margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4361EE" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
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
                                    domain={[0, 100]}
                                    tickFormatter={(v) => `${v}%`}
                                    ticks={[0, 20, 40, 60, 80, 100]}
                                />
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#4361EE"
                                    strokeWidth={2}
                                    fill="url(#attGrad)"
                                    dot={false}
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
        </div>
    );
}

export default SuperAdminDashboard