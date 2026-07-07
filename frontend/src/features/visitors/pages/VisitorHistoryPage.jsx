import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import VisitorStats from '../components/VisitorStats';
import VisitorDetailedView from '../components/VisitorDetailedView';
import VisitorAggregatedView from '../components/VisitorAggregatedView';
import { visitorApi } from '../api/visitorApi';

const VisitorHistoryPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [visitors, setVisitors] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedHostel, setSelectedHostel] = useState(null);

    const isSuperAdmin = user?.role === 'super_admin';
    const showAggregatedView = isSuperAdmin && !selectedHostel;

    const fetchVisitors = useCallback(async () => {
        try {
            setLoading(true);
            const res = showAggregatedView 
                ? await visitorApi.getAggregatedVisitors() 
                : await visitorApi.getVisitors({ hostel: selectedHostel });
            
            setVisitors(res.data.data.visitors);
            setStats(res.data.data.stats);
        } catch (error) {
            console.error("Failed to fetch visitors", error);
        } finally {
            setLoading(false);
        }
    }, [showAggregatedView, selectedHostel]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const handleSearch = (searchTerm) => {
        // Implement search logic (frontend filter for mock, or API call)
        console.log("Searching for:", searchTerm);
    };

    const handleFilter = (filters) => {
        // Implement filter logic
        console.log("Filtering by:", filters);
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
                    onSearch={handleSearch}
                    onHostelFilter={(hostel) => handleFilter({ hostel })}
                    onRowClick={(hostel) => setSelectedHostel(hostel)}
                />
            ) : (
                <VisitorDetailedView 
                    visitors={visitors} 
                    loading={loading} 
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onRefresh={fetchVisitors}
                />
            )}
        </div>
    );
};

export default VisitorHistoryPage;
