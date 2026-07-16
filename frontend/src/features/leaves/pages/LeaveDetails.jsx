import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import leaveService from '@/services/leave.service';
import LeaveDetailsMobileView from '../views/LeaveDetailsMobileView';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
import { showErrorToast } from '@/utils/toast';

export default function LeaveDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaveDetails = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const res = await leaveService.getLeaveDetails(user?.role, id);
                setRequest(res.data || res);
            } catch (err) {
                console.error("Failed to fetch leave details:", err);
                showErrorToast("Failed to load details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaveDetails();
    }, [id, user?.role]);

    if (isLoading) {
        return (
            <div className="w-full h-full p-4 overflow-y-auto bg-background-secondary space-y-4">
                <MobileSkeletonLoader rows={3} />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-background-secondary text-text-secondary">
                <p>Leave request not found.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-medium">Go Back</button>
            </div>
        );
    }

    return <LeaveDetailsMobileView request={request} onBack={() => navigate(-1)} />;
}
