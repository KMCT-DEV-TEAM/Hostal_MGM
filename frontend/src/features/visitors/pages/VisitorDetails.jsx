import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getVisitorDetails, getVisitDetails, getVisitorDetailsParent } from '@/services/visitor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import VisitorDetailsMobileView from '../views/VisitorDetailsMobileView';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
import { showErrorToast } from '@/utils/toast';

export default function VisitorDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { activeStudentId } = useActiveStudent();

    const isHistory = location.state?.isHistory;

    const [visitorData, setVisitorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                if (isHistory === true) {
                    // We know it's a history item (visitId), so fetch visit details directly
                    const res = await getVisitDetails(id);
                    setVisitorData(res.data || res);
                } else if (isHistory === false) {
                    // We know it's a regular visitor item (visitorId), fetch profile directly
                    let res;
                    if (user?.role === 'parent') {
                        res = await getVisitorDetailsParent(id, activeStudentId);
                    } else {
                        res = await getVisitorDetails(id);
                    }
                    setVisitorData(res.data || res);
                } else {
                    // Fallback for direct navigation (e.g. page refresh) without state
                    try {
                        let res;
                        if (user?.role === 'parent') {
                            res = await getVisitorDetailsParent(id, activeStudentId);
                        } else {
                            res = await getVisitorDetails(id);
                        }
                        setVisitorData(res.data || res);
                    } catch (err) {
                        const res = await getVisitDetails(id);
                        setVisitorData(res.data || res);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch visitor details:", err);
                showErrorToast("Failed to load details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (isLoading) {
        return (
            <div className="w-full h-full p-4 overflow-y-auto bg-gray-50/50 space-y-4">
                <MobileSkeletonLoader />
                <MobileSkeletonLoader lines={3} />
            </div>
        );
    }

    // Since this route is mobile-only conceptually, we render the mobile view directly.
    return (
        <VisitorDetailsMobileView
            data={visitorData}
            onBack={() => navigate(-1)}
        />
    );
}
