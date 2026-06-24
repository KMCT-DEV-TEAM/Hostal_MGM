import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar as CalendarIcon, 
    Check, 
    X, 
    Pencil,
    Filter,
    Download,
    ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import ListTable from '@/components/ui/ListTable';
import MobileList from '@/components/ui/MobileList';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Pagination from '@/components/ui/Pagination';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { ROLES } from '@/constants/roles';

// Mock leave/outpass requests with diverse hostel assignments to demonstrate drilldown filtering
const STUDENT_LISTING_MOCK_DATA = [
    {
        id: 'LR001',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Pending',
        returnStatus: '-----'
    },
    {
        id: 'LR002',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR003',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'B223401',
        hostel: 'Hostel B',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Pending',
        returnStatus: '-----'
    },
    {
        id: 'LR004',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Not Returned'
    },
    {
        id: 'LR005',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'C334512',
        hostel: 'Hostel C',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR006',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'B223401',
        hostel: 'Hostel B',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR007',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Approved',
        returnStatus: 'Returned'
    },
    {
        id: 'LR008',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'C334512',
        hostel: 'Hostel C',
        passType: 'Home Pass',
        fromDate: 'june 12',
        toDate: 'june 15',
        duration: '2 days',
        type: 'In House',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        status: 'Pending',
        returnStatus: '-----'
    },
    // Out Pass entries
    {
        id: 'LR009',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Pending',
        returnStatus: '-----',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR010',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Approved',
        returnStatus: 'Returned',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR011',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'B223401',
        hostel: 'Hostel B',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Pending',
        returnStatus: '-----',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR012',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Approved',
        returnStatus: 'Not Returned',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR013',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'C334512',
        hostel: 'Hostel C',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Approved',
        returnStatus: 'Returned',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR014',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'B223401',
        hostel: 'Hostel B',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Approved',
        returnStatus: 'Returned',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR015',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'A112390',
        hostel: 'Hostel A',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Approved',
        returnStatus: 'Returned',
        organization: 'KMCT Engineering College'
    },
    {
        id: 'LR016',
        studentName: 'Nila Mohan',
        rollNo: 'KMCT-2023-014',
        roomNo: 'C334512',
        hostel: 'Hostel C',
        passType: 'Out Pass',
        fromDate: 'june 12',
        toDate: 'june 12',
        duration: '-----',
        appliedDate: 'june 11',
        outTime: '09 : 00 AM',
        returnTime: '10 : 00 AM',
        outPassType: 'In House',
        reason: 'Purchase study materials',
        status: 'Pending',
        returnStatus: '-----',
        organization: 'KMCT Engineering College'
    }
];

const SUPER_ADMIN_AGGREGATE_MOCK_DATA = [
    { id: 'SA001', organization: 'engineering', hostel: 'Hostel A', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA002', organization: 'engineering', hostel: 'Hostel B', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA003', organization: 'engineering', hostel: 'Hostel C', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA004', organization: 'medical', hostel: 'Hostel A', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA005', organization: 'medical', hostel: 'Hostel B', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA006', organization: 'pharmacy', hostel: 'Hostel A', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA007', organization: 'pharmacy', hostel: 'Hostel B', totalRequest: 10, pending: 2, approved: 8, rejected: 8 },
    { id: 'SA008', organization: 'pharmacy', hostel: 'Hostel C', totalRequest: 10, pending: 2, approved: 8, rejected: 8 }
];

export default function Leaves() {
    const { passType, hostelName } = useParams(); // 'home-pass', 'outpass', and optional 'hostelName'
    const navigate = useNavigate();
    const role = useAuthStore((s) => s.user?.role) || ROLES.SUPER_ADMIN;

    const isHomePass = passType === 'home-pass' || !passType;
    const isSuperAdmin = role === ROLES.SUPER_ADMIN;
    const isWarden = role === ROLES.WARDEN;
    const isAdmin = role === ROLES.ADMIN;

    // Data states
    const [studentRequests, setStudentRequests] = useState(STUDENT_LISTING_MOCK_DATA);
    const [aggregateData, setAggregateData] = useState(SUPER_ADMIN_AGGREGATE_MOCK_DATA);

    // Detail view state derived from route
    const selectedHostel = hostelName ? decodeURIComponent(hostelName) : null;

    const [searchQuery, setSearchQuery] = useState('');
    const [orgFilter, setOrgFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 8;

    // Reset pagination, search filters on subroute or hostel changes
    useEffect(() => {
        setSearchQuery('');
        setOrgFilter('All');
        setStatusFilter('');
        setPage(1);
    }, [passType, hostelName]);

    // Role-based Subtitle Configuration
    const pageSubtitle = useMemo(() => {
        if (isSuperAdmin) {
            return "Monitor leave requests and approvals across all hostels.";
        }
        if (isWarden) {
            return isHomePass 
                ? "view and manage student leave applications" 
                : "view and manage student permission applications";
        }
        if (isAdmin) {
            return isHomePass
                ? "View and monitor Leave applications submitted by students across the hostel."
                : "View and monitor Permission applications submitted by students across the hostel.";
        }
        return "Manage student leave and out pass requests";
    }, [isSuperAdmin, isWarden, isAdmin, isHomePass]);

    // Statistics Counts
    const stats = useMemo(() => {
        if (isSuperAdmin) {
            return { total: 40, approved: 30, pending: 10, rejected: 10 };
        }
        const total = 40;
        const approved = 30;
        const pending = 10;
        const rejected = 10;
        return { total, approved, pending, rejected };
    }, [isSuperAdmin]);

    // Filtered lists
    const filteredList = useMemo(() => {
        if (selectedHostel) {
            // Detailed student request list filtered for a specific hostel
            const typeFilter = isHomePass ? 'Home Pass' : 'Out Pass';
            return studentRequests.filter(item => {
                if (item.passType !== typeFilter) return false;
                if (item.hostel.toLowerCase() !== selectedHostel.toLowerCase()) return false;
                if (statusFilter && item.status !== statusFilter) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return item.studentName.toLowerCase().includes(q) || item.roomNo.toLowerCase().includes(q);
                }
                return true;
            });
        }

        if (isSuperAdmin) {
            return aggregateData.filter(item => {
                if (orgFilter !== 'All' && item.organization !== orgFilter.toLowerCase()) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return item.organization.includes(q) || item.hostel.toLowerCase().includes(q);
                }
                return true;
            });
        } else {
            const typeFilter = isHomePass ? 'Home Pass' : 'Out Pass';
            return studentRequests.filter(item => {
                if (item.passType !== typeFilter) return false;
                if (statusFilter && item.status !== statusFilter) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return (
                        item.studentName.toLowerCase().includes(q) ||
                        item.roomNo.toLowerCase().includes(q) ||
                        item.hostel.toLowerCase().includes(q)
                    );
                }
                return true;
            });
        }
    }, [isSuperAdmin, isHomePass, orgFilter, searchQuery, statusFilter, studentRequests, aggregateData, selectedHostel]);

    // Paginated active subset
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredList.slice(start, start + limit);
    }, [filteredList, page]);

    // Update Request status
    const handleUpdateStatus = (id, newStatus) => {
        setStudentRequests(prev => 
            prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
        );
        showSuccessToast('Status updated successfully');
    };

    // Update Return status
    const handleUpdateReturn = (id, newReturn) => {
        setStudentRequests(prev => 
            prev.map(r => r.id === id ? { ...r, returnStatus: newReturn } : r)
        );
        showSuccessToast('Return status updated successfully');
    };

    // Badges render helpers
    const renderStatusBadge = (status) => {
        const bgClass = status === 'Approved' ? 'bg-[#ECFDF5] border border-[#A7F3D0]' : 'bg-[#FFFBEB] border border-[#FDE68A]';
        const textClass = status === 'Approved' ? 'text-[#065F46]' : 'text-[#92400E]';
        return (
            <span className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${bgClass} ${textClass}`}>
                {status}
            </span>
        );
    };

    const renderReturnBadge = (returnStatus) => {
        if (returnStatus === 'Returned') {
            return (
                <span className="px-3.5 py-1.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Returned
                </span>
            );
        }
        if (returnStatus === 'Not Returned') {
            return (
                <span className="px-3.5 py-1.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FEE2E2] rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" /> Not Returned
                </span>
            );
        }
        return <span className="text-gray-400 font-semibold">-----</span>;
    };

    // Dropdown options inside list tables
    const statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
    ];

    const returnOptions = [
        { label: '-----', value: '-----' },
        { label: 'Returned', value: 'Returned' },
        { label: 'Not Returned', value: 'Not Returned' }
    ];

    // Table Headers Configuration based on Role, Subroute, and Drilldown State
    const tableHeaders = useMemo(() => {
        if (selectedHostel) {
            const midCol = "Room No";
            const dateCol = isHomePass ? "Leave Period" : "Date";
            const typeCol = isHomePass ? "Days" : "Type";
            if (isHomePass) {
                return ["Student", midCol, dateCol, typeCol, { label: "Status", align: "start" }, { label: "Return", align: "start" }];
            } else {
                return ["Student", midCol, dateCol, typeCol, "Out", "Out", { label: "Status", align: "start" }, { label: "Return", align: "start" }];
            }
        }

        if (isSuperAdmin) {
            return isHomePass
                ? ["Organization", "Hostel", "Total Request", "Pending", "Approved"]
                : ["Organization", "Hostel", "Total Request", "Pending", "Approved", "Rejected"];
        }
        
        // Warden and Admin views
        const midCol = isWarden ? "Room No" : "Hostel";
        const dateCol = isHomePass ? "Leave Period" : "Date";
        const typeCol = isHomePass ? "Days" : "Type";
        
        if (isHomePass) {
            return ["Student", midCol, dateCol, typeCol, { label: "Status", align: "start" }, { label: "Return", align: "start" }];
        } else {
            return ["Student", midCol, dateCol, typeCol, "Out", "Out", { label: "Status", align: "start" }, { label: "Return", align: "start" }];
        }
    }, [isSuperAdmin, isHomePass, isWarden, selectedHostel]);

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 flex flex-col">
            
            {/* Header section with dynamic back button drilldown indicator */}
            <div className="mb-6 shrink-0 flex items-center gap-3">
                {selectedHostel && (
                    <button
                        type="button"
                        onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}`)}
                        className="p-2 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                        title="Back to List"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                )}
                <PageHeader
                    title={selectedHostel ? `${selectedHostel} - ${isHomePass ? "Home Pass" : "Out Pass"}` : (isHomePass ? "Home Pass" : "Out Pass")}
                    subtitle={selectedHostel ? `Monitoring student leave records for ${selectedHostel}` : pageSubtitle}
                />
            </div>

            {/* 4 Stats Cards aligned side-by-side with top border colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
                <StatsCard 
                    label="TOTAL REQUESTS" 
                    value={stats.total} 
                    icon={<CalendarIcon className="w-4 h-4 text-blue-500" />} 
                    iconBg="bg-blue-50/50" 
                    borderColor="border-t-2 border-t-blue-500 border-gray-100 shadow-sm" 
                />
                <StatsCard 
                    label="APPROVED REQUESTS" 
                    value={stats.approved} 
                    icon={<CalendarIcon className="w-4 h-4 text-green-500" />} 
                    iconBg="bg-green-50/50" 
                    borderColor="border-t-2 border-t-green-500 border-gray-100 shadow-sm" 
                />
                <StatsCard 
                    label="PENDING REQUESTS" 
                    value={stats.pending} 
                    icon={<CalendarIcon className="w-4 h-4 text-amber-500" />} 
                    iconBg="bg-amber-50/50" 
                    borderColor="border-t-2 border-t-amber-500 border-gray-100 shadow-sm" 
                />
                <StatsCard 
                    label="REJECTED REQUESTS" 
                    value={stats.rejected} 
                    icon={<CalendarIcon className="w-4 h-4 text-danger" />} 
                    iconBg="bg-rose-50/50" 
                    borderColor="border-t-2 border-t-rose-500 border-gray-100 shadow-sm" 
                />
            </div>

            {/* List Table Panel */}
            <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-gray-100 md:overflow-hidden md:shadow-sm flex-1 flex flex-col min-h-0">
                
                {/* Search & Toolbar section */}
                <div className="p-4 flex flex-row items-center justify-between gap-4 md:border-b md:border-gray-50 shrink-0">
                    <div className="relative w-full max-w-sm">
                        <input
                            className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none placeholder-gray-400 font-medium text-gray-700"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {isSuperAdmin && !selectedHostel ? (
                            <>
                                <Dropdown
                                    options={[
                                        { label: 'All', value: 'All' },
                                        { label: 'Engineering', value: 'Engineering' },
                                        { label: 'Medical', value: 'Medical' },
                                        { label: 'Pharmacy', value: 'Pharmacy' }
                                    ]}
                                    value={orgFilter}
                                    onChange={(val) => setOrgFilter(val)}
                                    placeholder="All"
                                    triggerClassName="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 flex justify-between items-center"
                                />
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter(prev => prev ? '' : 'Pending')}
                                    className={`p-3 bg-white border rounded-xl transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center ${statusFilter ? 'border-[#0A437A] text-[#0A437A]' : 'border-gray-200 text-gray-400 hover:text-gray-600'
                                        }`}
                                    title="Toggle Pending status filter"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* Export Action */}
                        <button
                            type="button"
                            onClick={() => showSuccessToast('Exporting leave data...')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-1 sm:flex-none shadow-sm md:shadow-none cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Desktop Grid Layout */}
                <ListTable
                    headers={tableHeaders}
                    items={paginatedItems}
                    canSelect={false}
                    emptyText="No leave records matching the active filters."
                    renderRow={(r) => {
                        // Display student rows if detailed view is active or user is not a Super Admin
                        if (selectedHostel || !isSuperAdmin) {
                            return (
                                <>
                                    {/* Student initials and full name */}
                                    <td className="p-4 flex items-center gap-3 font-bold text-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                            {r.studentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <span className="text-sm font-semibold">{r.studentName}</span>
                                    </td>

                                    {/* Room No (if drilldown/warden) or Hostel name (if admin) */}
                                    <td className="p-4 text-text-secondary font-medium">
                                        {selectedHostel || isWarden ? r.roomNo : (
                                            <span 
                                                className="text-[#0A437A] font-semibold hover:underline cursor-pointer"
                                                onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostel)}`)}
                                            >
                                                {r.hostel}
                                            </span>
                                        )}
                                    </td>

                                    {/* Period / Date */}
                                    <td className="p-4 text-text-secondary lowercase">
                                        {isHomePass ? `${r.fromDate} - ${r.toDate}` : r.fromDate}
                                    </td>

                                    {/* Days / Type */}
                                    <td className="p-4 text-text-secondary capitalize">
                                        {isHomePass ? r.duration : r.type}
                                    </td>

                                    {/* Times (Out pass only) */}
                                    {!isHomePass && (
                                        <>
                                            <td className="p-4 text-text-secondary">
                                                {r.outTime}
                                            </td>
                                            <td className="p-4 text-text-secondary">
                                                {r.returnTime}
                                            </td>
                                        </>
                                    )}

                                    {/* Inline Status Dropdown */}
                                    <td className="p-4">
                                        <Dropdown
                                            options={statusOptions}
                                            value={r.status}
                                            onChange={(val) => handleUpdateStatus(r.id, val)}
                                            minWidth="w-28"
                                            triggerClassName={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.status === 'Approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#d1fae5]' :
                                                r.status === 'Rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B] hover:bg-[#fee2e2]' :
                                                    'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#fef3c7]'
                                                }`}
                                        />
                                    </td>

                                    {/* Inline Return Dropdown */}
                                    <td className="p-4">
                                        <Dropdown
                                            options={returnOptions}
                                            value={r.returnStatus || '-----'}
                                            onChange={(val) => handleUpdateReturn(r.id, val)}
                                            minWidth="w-32"
                                            triggerClassName={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between gap-1.5 transition-colors ${r.returnStatus === 'Returned' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#d1fae5]' :
                                                r.returnStatus === 'Not Returned' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B] hover:bg-[#fee2e2]' :
                                                    'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                                }`}
                                        />
                                    </td>
                                </>
                            );
                        }

                        // Otherwise render Super Admin aggregates overview
                        return (
                            <>
                                <td className="p-4 text-text-secondary capitalize">
                                    {r.organization}
                                </td>
                                <td 
                                    className="p-4 text-[#0A437A] font-semibold hover:underline cursor-pointer"
                                    onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostel)}`)}
                                >
                                    {r.hostel}
                                </td>
                                <td className="p-4 text-text-secondary text-center sm:text-left">
                                    {r.totalRequest}
                                </td>
                                <td className="p-4 text-text-secondary text-center sm:text-left">
                                    {r.pending}
                                </td>
                                <td className="p-4 text-text-secondary text-center sm:text-left">
                                    {r.approved}
                                </td>
                                {!isHomePass && (
                                    <td className="p-4 text-text-secondary text-center sm:text-left">
                                        {r.rejected}
                                    </td>
                                )}
                            </>
                        );
                    }}
                />

                {/* Mobile View */}
                <MobileList
                    items={paginatedItems}
                    canSelect={false}
                    emptyText="No leave records matching filters."
                    renderItem={(r) => {
                        if (isSuperAdmin && !selectedHostel) {
                            return (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-[#0A437A] capitalize">{r.organization}</span>
                                        <span 
                                            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                                            onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostel)}`)}
                                        >
                                            {r.hostel}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-xs text-text-secondary font-semibold">
                                        <div>Total: {r.totalRequest}</div>
                                        <div>Pending: {r.pending}</div>
                                        <div>Approved: {r.approved}</div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-[#0A437A]/10 text-[#0A437A] flex items-center justify-center font-bold text-[10px]">
                                            {r.studentName.substring(0, 2)}
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">{r.studentName}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {selectedHostel || isWarden ? `Room ${r.roomNo}` : (
                                            <span 
                                                className="text-[#0A437A] font-semibold hover:underline cursor-pointer"
                                                onClick={() => navigate(`/dashboard/leaves/${passType || 'home-pass'}/${encodeURIComponent(r.hostel)}`)}
                                            >
                                                {r.hostel}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <hr className="border-gray-50" />
                                <div className="text-xs text-text-secondary space-y-1.5">
                                    <div>{isHomePass ? `Period: ${r.fromDate} - ${r.toDate} (${r.duration})` : `Outing Time: ${r.outTime} - ${r.returnTime}`}</div>
                                    <div className="flex justify-between items-center gap-2 pt-2">
                                        <span>Status:</span>
                                        <Dropdown
                                            options={statusOptions}
                                            value={r.status}
                                            onChange={(val) => handleUpdateStatus(r.id, val)}
                                            minWidth="w-24"
                                            triggerClassName={`px-2 py-1 rounded border flex items-center justify-between text-[10px] font-bold ${r.status === 'Approved' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                                                r.status === 'Rejected' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]' :
                                                    'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center gap-2 pt-1.5">
                                        <span>Return:</span>
                                        <Dropdown
                                            options={returnOptions}
                                            value={r.returnStatus || '-----'}
                                            onChange={(val) => handleUpdateReturn(r.id, val)}
                                            minWidth="w-28"
                                            triggerClassName={`px-2 py-1 rounded border flex items-center justify-between text-[10px] font-bold ${r.returnStatus === 'Returned' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                                                r.returnStatus === 'Not Returned' ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]' :
                                                    'bg-white border-gray-200 text-gray-400'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />

                {/* Pagination */}
                {filteredList.length > 0 && (
                    <Pagination
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        totalItems={filteredList.length}
                        totalPages={Math.ceil(filteredList.length / limit)}
                    />
                )}
            </div>
        </div>
    );
}
