import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLES } from '@/constants/roles';
import mentorService from '@/services/mentor.service';
import { formatDateReadable } from '@/utils/formatters';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import StatusBadge from '@/components/ui/StatusBadge';
import ActivityLog from '@/components/ui/ActivityLog';

export default function MentorDetailsModal({
    mentor: initialMentor,
    onClose,
    onEdit
}) {
    const role = useAuthStore(s => s.user?.role);
    const [mentor, setMentor] = useState(initialMentor);
    const [loading, setLoading] = useState(false);

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
        >
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4 animate-pulse">
                    {/* LEFT COLUMN SKELETON */}
                    <div className="space-y-6">
                        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/4 mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/4 mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN SKELETON */}
                    <div className="space-y-6">
                        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/3 mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-3 bg-gray-100 rounded w-full"></div>
                                <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                            </div>
                        </div>
                        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/3 mb-6"></div>
                            <div className="space-y-3">
                                <div className="h-14 bg-gray-100 rounded w-full"></div>
                                <div className="h-14 bg-gray-100 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">
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

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">

                        {/* Quick Summary */}
                        <DetailCard title="Quick Summary" subtitle="Quick Summary about the mentor">
                            <div className="space-y-1">
                                <DetailRow
                                    label="Mentor"
                                    value={mentor.name || '--'}
                                    icon={<svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                                />
                                <DetailRow
                                    label="Status"
                                    value={<StatusBadge status={isActive ? 'Active' : 'Inactive'} />}
                                    icon={<svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                                />
                                {role === ROLES.SUPER_ADMIN && (
                                    <DetailRow
                                        label="Org Code"
                                        value={mentor.organization?.code || '-----'}
                                        icon={<svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>}
                                    />
                                )}
                                <DetailRow
                                    label="Joined Date"
                                    value={formatDateReadable(mentor.createdAt)}
                                    icon={<svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                                />
                            </div>
                        </DetailCard>

                        {/* Recent Activity */}
                        <DetailCard title="Recent Activity" subtitle="Recent assignment activity for the mentor">
                            <ActivityLog
                                timeline={mentor.assignments?.map(t => ({
                                    action: `Assigned to ${t.batchId?.name || 'Batch'}`,
                                    timestamp: t.assignedAt || t.createdAt,
                                    actorRole: t.assignedBy?.name || 'Admin'
                                }))}
                                defaultText="No activity recorded yet."
                            />
                        </DetailCard>

                    </div>
                </div>
            )}
        </Modal>
    );
}
