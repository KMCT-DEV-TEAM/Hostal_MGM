import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import leaveService from '@/services/leave.service';
import LeaveDetailsMobileView from '../views/LeaveDetailsMobileView';
import MobileSkeletonLoader from '@/components/ui/MobileSkeletonLoader';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import LeaveActionModal from '../components/modals/LeaveActionModal';

export default function LeaveDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { activeStudentId } = useActiveStudent();

    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionModalConfig, setActionModalConfig] = useState({ isOpen: false, actionType: '' });
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    const fetchLeaveDetails = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const res = await leaveService.getLeaveDetails(user?.role, id, activeStudentId);
            setRequest(res.data || res);
        } catch (err) {
            console.error("Failed to fetch leave details:", err);
            showErrorToast("Failed to load details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveDetails();
    }, [id, user?.role, activeStudentId]);

    const handleActionClick = (actionType) => {
        setActionModalConfig({ isOpen: true, actionType });
    };

    const handleConfirmAction = async (remarks) => {
        if (!request) return;

        try {
            setIsActionSubmitting(true);
            const { actionType } = actionModalConfig;
            const payload = {
                remarks: remarks,
                revision: request.revision ?? request.__v ?? 0,
                studentId: activeStudentId
            };

            if (actionType === 'approved') {
                await leaveService.approveLeaveByParent(request.id ?? request._id, payload);
            } else if (actionType === 'rejected') {
                await leaveService.rejectLeaveByParent(request.id ?? request._id, payload);
            }

            showSuccessToast(`Pass ${actionType} successfully`);
            setActionModalConfig({ isOpen: false, actionType: '' });
            fetchLeaveDetails(); // Refresh details to show new status
        } catch (err) {
            showErrorToast(err.message || `Failed to ${actionModalConfig.actionType} pass`);
        } finally {
            setIsActionSubmitting(false);
        }
    };

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

    return (
        <>
            <LeaveDetailsMobileView 
                request={request} 
                onBack={() => navigate(-1)} 
                userRole={user?.role}
                onActionClick={handleActionClick}
            />
            
            <LeaveActionModal
                isOpen={actionModalConfig.isOpen}
                onClose={() => setActionModalConfig({ isOpen: false, actionType: '' })}
                actionType={actionModalConfig.actionType}
                onSubmit={handleConfirmAction}
                isSubmitting={isActionSubmitting}
            />
        </>
    );
}
