import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import leaveService from '@/services/leave.service';

// Modular imports
import ApplyLeaveModal from '../components/modals/ApplyLeaveModal';
import FilterLeavesModal from '../components/modals/FilterLeavesModal';
import LeaveDetailsModal from '../components/modals/LeaveDetailsModal';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import StudentLeavesDesktopView from '../views/StudentLeavesDesktopView';
import StudentLeavesMobileView from '../views/StudentLeavesMobileView';

export default function StudentLeaves() {
    const { passType } = useParams();
    const { isMobile } = useBreakpoint();

    // Desktop logic
    const isHomePass = passType === 'home-pass' || (!passType && !isMobile);
    const pageTitle = isHomePass ? 'Home Pass' : 'Out Pass';
    const pageSubtitle = isHomePass ? 'Manage your leave applications' : 'Manage your permissions requests';

    // Mobile logic
    const isRequestsTab = passType === 'requests' || !passType;
    const isHistoryTab = passType === 'history';

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statsData, setStatsData] = useState({ total: 0, approved: 0, pending: 0 });

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [viewId, setViewId] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const openEditModal = (r) => {
        setEditData(r);
        setIsApplyModalOpen(true);
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: '', category: '', fromDate: '', toDate: '' });
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const payload = {
                page,
                limit,
                ...(filters.status && { status: filters.status.toLowerCase() }),
                ...(filters.category && !isHomePass && { outPassCategory: filters.category }),
                ...(filters.fromDate && { startDate: filters.fromDate }),
                ...(filters.toDate && { endDate: filters.toDate })
            };

            if (!isMobile) {
                payload.passType = isHomePass ? 'home_pass' : 'out_pass';
            } else {
                if (!filters.status) {
                    if (isRequestsTab) payload.status = 'pending_parent,pending_warden';
                    if (isHistoryTab) payload.status = 'approved,rejected,completed,cancelled';
                }
            }

            const res = await leaveService.getMyLeaves(payload);

            const passesArray = res.data || res.passes || [];

            if (isMobile && page > 1) {
                setRequests(prev => [...prev, ...passesArray]);
            } else {
                setRequests(passesArray);
            }

            setTotalItems(res.pagination?.totalRecords || res.pagination?.total || 0);
            setTotalPages(res.pagination?.totalPages || 1);

            setStatsData({
                total: res.pagination?.totalRecords || res.pagination?.total || 0,
                approved: passesArray.filter(r => r.status === 'approved').length,
                pending: passesArray.filter(r => r.status.includes('pending')).length
            });
        } catch (err) {
            console.error(err);
            showErrorToast('Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearchQuery('');
        setPage(1);
    }, [isHomePass]);

    useEffect(() => {
        fetchLeaves();
    }, [page, isHomePass, filters.status, filters.category, filters.fromDate, filters.toDate]);

    const viewProps = {
        pageTitle,
        pageSubtitle,
        isHomePass,
        statsData,
        requests,
        loading,
        totalItems,
        totalPages,
        page,
        setPage,
        filters,
        setIsFilterModalOpen,
        openEditModal,
        setViewId,
        searchQuery,
        setSearchQuery,
        hasMore: page < totalPages,
        onLoadMore: () => setPage(p => p + 1),
        onFilterClick: () => setIsFilterModalOpen(true)
    };

    return (
        <>
            {isMobile ? (
                <StudentLeavesMobileView {...viewProps} />
            ) : (
                <StudentLeavesDesktopView {...viewProps} />
            )}

            <ApplyLeaveModal
                isOpen={isApplyModalOpen}
                onClose={() => { setIsApplyModalOpen(false); setEditData(null); }}
                onSuccess={() => { setPage(1); fetchLeaves(); }}
                initialPassType={isHomePass ? 'Home Pass' : 'Out Pass'}
                editData={editData}
            />

            <FilterLeavesModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                pageTitle={pageTitle}
                isOutPass={!isHomePass}
                isStudent={true}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
                onReset={() => {
                    setFilters({ status: '', category: '', fromDate: '', toDate: '' });
                    setPage(1);
                    setIsFilterModalOpen(false);
                }}
            />

            <LeaveDetailsModal
                isOpen={!!viewId}
                onClose={() => setViewId(null)}
                leaveId={viewId}
            />
        </>
    );
}
