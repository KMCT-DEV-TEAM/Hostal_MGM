import React, { useState, useEffect } from 'react';
import { User, Activity, Building, Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import mentorService from '@/services/mentor.service';
import { formatDateReadable } from '@/utils/formatters';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityLog from '@/components/ui/ActivityLog';
import DetailsSkeletonLoader from '@/components/ui/DetailsSkeletonLoader';

export default function MentorDetailsModal({
    mentor: initialMentor,
    onClose,
    onEdit,
    zIndex
}) {
    const role = useAuthStore(s => s.user?.role);
    const [mentor, setMentor] = useState(initialMentor);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        if (!initialMentor?._id || !role) return;

        let isMounted = true;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const response = await mentorService.getMentorById(role, initialMentor._id);
                if (isMounted && response?.data) {
                    setMentor(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch mentor details", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [initialMentor?._id, role]);

    if (!mentor) return null;

    const isActive = mentor.isActive === true || mentor.isActive === 'true';

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Mentor Details"
            subtitle="Detailed view of the mentor's profile"
            maxWidth="max-w-5xl"
            bottomSheetOnMobile={true}
            zIndex={zIndex || 50}
        >
            {loading ? (
                <DetailsSkeletonLoader />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mt-4">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">

                        {/* Mentor Information */}
                        <DetailCard title="Mentor Information" subtitle="Details about mentor">
                            <div className="space-y-1">
                                <DetailRow label="Name" value={mentor.name} />
                                <DetailRow label="Email Address" value={mentor.email || '-----'} />
                                <DetailRow label="Phone Number" value={mentor.phone || '-----'} />
                            </div>
                        </DetailCard>

                        {/* Professional Details */}
                        <DetailCard title="Professional Details" subtitle="Details about the mentor's profession">
                            <div className="space-y-1">
                                <DetailRow label="Role" value={<span className="capitalize">{mentor.role || 'Mentor'}</span>} />
                                <DetailRow label="Specialization" value={mentor.specialization || 'Not Specified'} />
                                {role === ROLES.SUPER_ADMIN && (
                                    <DetailRow label="Organization" value={mentor.organization?.name || 'Unassigned'} />
                                )}
                            </div>
                        </DetailCard>

                        {/* Recent Activity */}
                        <DetailCard title="Recent Assignments" subtitle="Recent assignments of the mentor">
                            <div className="flex items-center gap-6 border-b border-gray-200 mb-4">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'active' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'history' ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    History
                                </button>
                            </div>

                            <ActivityLog
                                timeline={activeTab === 'active'
                                    ? (mentor.activeAssignments || []).map(t => ({
                                        action: `Assigned to ${t.batchId?.name || 'Batch'}`,
                                        remarks: t.remarks ? `Assigned: ${t.remarks}` : `Assigned to ${t.batchId?.name || 'Batch'}`,
                                        timestamp: t.assignedAt,
                                        actorRole: t.assignedBy?.name || 'Admin',
                                        meta: { label: 'Batch', value: t.batchId?.name || 'Unknown' }
                                    }))
                                    : (mentor.historyAssignments || []).map(t => ({
                                        action: t.status,
                                        remarks: t.remarks ? `${t.status}: ${t.remarks}` : t.status,
                                        timestamp: t.endedAt || t.assignedAt,
                                        actorRole: t.assignedBy?.name || 'Admin',
                                        meta: { label: 'Batch', value: t.batchId?.name || 'Unknown' }
                                    }))
                                }
                                defaultText={`No ${activeTab} assignments found.`}
                            />
                        </DetailCard>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">

                        {/* Quick Summary */}
                        <DetailCard title="Quick Summary" subtitle="Quick Summary about the mentor">
                            <div className="space-y-1">
                                <DetailRow
                                    label="Mentor"
                                    value={mentor.name || '--'}
                                    icon={<User className="w-4 h-4 text-text-secondary" />}
                                />
                                <DetailRow
                                    label="Status"
                                    value={<StatusBadge status={isActive ? 'Active' : 'Inactive'} />}
                                    icon={<Activity className="w-4 h-4 text-text-secondary" />}
                                />
                                {role === ROLES.SUPER_ADMIN && (
                                    <DetailRow
                                        label="Org Code"
                                        value={mentor.organization?.code || '-----'}
                                        icon={<Building className="w-4 h-4 text-text-secondary" />}
                                    />
                                )}
                                <DetailRow
                                    label="Joined Date"
                                    value={formatDateReadable(mentor.createdAt)}
                                    icon={<Calendar className="w-4 h-4 text-text-secondary" />}
                                />
                            </div>
                        </DetailCard>

                    </div>
                </div>
            )}
        </Modal>
    );
}
