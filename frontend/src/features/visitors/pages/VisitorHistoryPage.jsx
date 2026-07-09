import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useDebounce } from '@/hooks/useDebounce';
import VisitorStats from '../components/VisitorStats';
import VisitorDetailedView from '../components/VisitorDetailedView';
import VisitorAggregatedView from '../components/VisitorAggregatedView';
import { getSuperAdminHostelVisits, listVisitorVisits } from '@/services/visitor.service';

const VisitorHistoryPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ status: '', fromDate: '', toDate: '' });
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const isSuperAdmin = user?.role === 'super_admin';
    const showAggregatedView = isSuperAdmin && !selectedHostel;

    const fetchVisitors = useCallback(async () => {
        try {
            setLoading(true);
            let res;
            const params = { page: 1, limit: 10 };
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;
            if (filters.status) params.status = filters.status;
            if (filters.fromDate) params.startDate = filters.fromDate;
            if (filters.toDate) params.endDate = filters.toDate;

            if (showAggregatedView) {
                res = await getSuperAdminHostelVisits(params);
            } else {
                if (selectedHostel) params.hostel = selectedHostel;
                res = await listVisitorVisits(params);
            }

            setVisitors(res.data || []);
            // TODO: Fetch real stats from dashboard-summary if needed
            setStats(null);
        } catch (error) {
            console.error("Failed to fetch visitors", error);
        } finally {
            setLoading(false);
        }
    }, [showAggregatedView, selectedHostel, debouncedSearchQuery, filters]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleSearch = (searchTerm) => {
        setSearchQuery(searchTerm);
    };

    const handleFilter = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <div className="w-full h-[calc(100vh-82px)] overflow-hidden p-4 md:p-6 bg-background-secondary flex flex-col">
            <div className="mb-6 shrink-0 flex items-center gap-4">
                {selectedHostel && isSuperAdmin && (
                    <button
                        onClick={() => setSelectedHostel(null)}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <PageHeader
                    title={selectedHostel ? `Visitors History - ${selectedHostel}` : "Visitors History"}
                    subtitle={showAggregatedView ? "Overview of past visitors across all hostels" : "View historical visitors"}
                />
            </div>

            {/* Shared Stats Component */}
            <div className="shrink-0">
                <VisitorStats stats={stats} />
            </div>

            {/* Role-Based Rendering */}
            {showAggregatedView ? (
                <VisitorAggregatedView
                    visitors={visitors}
                    loading={loading}
                    searchQuery={searchQuery}
                    filters={filters}
                    onSearch={handleSearch}
                    onHostelFilter={(hostel) => handleFilter({ hostel })}
                    onRowClick={(hostel) => setSelectedHostel(hostel)}
                />
            ) : (
                <VisitorDetailedView
                    visitors={visitors}
                    loading={loading}
                    searchQuery={searchQuery}
                    filters={filters}
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onRefresh={fetchVisitors}
                />
            )}
        </div>
    );
};

export default VisitorHistoryPage;
