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
import LeavesMobileView from '../views/LeavesMobileView';

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

            let res;
            let passesArray = [];

            if (!isMobile) {
                // Desktop: Old API (/my-passes)
                payload.passType = isHomePass ? 'home_pass' : 'out_pass';
                res = await leaveService.getMyLeaves(payload);
                passesArray = res.data || res.passes || [];
            } else {
                // Mobile: New Unified API (/passes)
                payload.mode = isRequestsTab ? 'requests' : 'history';

                // If the user has explicitly selected a status filter, it overrides mode in the API.
                // We don't need to manually string together "pending_parent,pending_warden" anymore.
                // The backend handles mode=requests and mode=history perfectly!
                if (filters.status) {
                    payload.status = filters.status.toLowerCase();
                }

                res = await leaveService.getUnifiedPasses(payload);
                passesArray = res?.data || [];
            }

            if (isMobile && page > 1) {
                setRequests(prev => [...prev, ...passesArray]);
            } else {
                setRequests(passesArray);
            }

            const pagination = res.pagination || res.data?.pagination || {};
            setTotalItems(pagination.totalRecords || pagination.total || 0);
            setTotalPages(pagination.totalPages || 1);

            setStatsData({
                total: res.summary?.total ?? 0,
                approved: res.summary?.approved ?? 0,
                pending: res.summary?.pending ?? 0,
                completed: res.summary?.completed ?? 0,
                rejected: res.summary?.rejected ?? 0,
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
    }, [passType, isHomePass]);

    useEffect(() => {
        fetchLeaves();
    }, [page, passType, isHomePass, filters.status, filters.category, filters.fromDate, filters.toDate]);

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
        onFilterClick: () => setIsFilterModalOpen(true),
        isFilterApplied: !!(filters.status || filters.category || filters.fromDate || filters.toDate),
        onAddClick: () => {
            setEditData(null);
            setIsApplyModalOpen(true);
        }
    };

    return (
        <>
            {isMobile ? (
                <LeavesMobileView {...viewProps} />
            ) : (
                <StudentLeavesDesktopView {...viewProps} />
            )}

            <ApplyLeaveModal
                isOpen={isApplyModalOpen}
                onClose={() => { setIsApplyModalOpen(false); setEditData(null); }}
                onSuccess={() => { setPage(1); fetchLeaves(); }}
                initialPassType={isHomePass ? 'Home Pass' : 'Out Pass'}
                editData={editData}
                allowTypeSelection={isMobile}
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
