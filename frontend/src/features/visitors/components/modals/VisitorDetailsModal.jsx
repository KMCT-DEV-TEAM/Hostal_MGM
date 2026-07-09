import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { getVisitorDetails } from '@/services/visitor.service';
import { useAuthStore } from '@/store/useAuthStore';

import Button from '@/components/ui/Button';
import CheckInModal from './CheckInModal';

export default function VisitorDetailsModal({ isOpen, onClose, visitorId }) {
    const [visitor, setVisitor] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchDetails = async () => {
            if (!isOpen || !visitorId) {
                setVisitor(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const res = await getVisitorDetails(visitorId);
                setVisitor(res.data || res);
            } catch (err) {
                console.error("Failed to fetch visitor details:", err);
                setError("Failed to load details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, visitorId]);

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Loading Details..." maxWidth="max-w-3xl">
                <div className="h-64 bg-gray-100 animate-pulse rounded-xl mt-4"></div>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Error" maxWidth="max-w-md">
                <div className="p-4 text-center text-red-500 font-medium">{error}</div>
            </Modal>
        );
    }

    if (!visitor) return null;

    const visitorName = visitor.visitorName || visitor.name;
    const studentName = visitor.students && visitor.students.length > 0 ? visitor.students[0].name : '';
    const subtitle = `Visitor${studentName ? ` - ${studentName}` : ''}`;

    const renderRow = (label, value) => (
        <div className="flex mb-5 last:mb-0">
            <div className="w-32 text-gray-500 text-sm font-medium">{label}</div>
            <div className="w-8 text-gray-400 text-sm font-medium">:</div>
            <div className="flex-1 font-medium text-gray-900 text-sm capitalize">{value || '--'}</div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={visitorName}
            subtitle={subtitle}
            avatar={visitorName}
            maxWidth="max-w-3xl"
        >
            <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="border border-gray-200/60 rounded-2xl p-6 md:p-8 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-primary font-semibold text-sm mb-1.5">Visitor information</h3>
                            <p className="text-[11px] text-gray-400">Basic Details about the Visitor</p>
                        </div>
                        {visitor.status === 'Approved' && user?.role === 'warden' && (
                            <Button
                                size="sm"
                                fullWidth={false}
                                onClick={() => setIsCheckInOpen(true)}
                            >
                                Check In
                            </Button>
                        )}
                    </div>
                    <hr className="border-gray-100 mb-8" />

                    <div className="space-y-1">
                        {renderRow('Full Name', visitorName)}
                        {renderRow('Phone No', visitor.phone)}
                        {renderRow('Relation', visitor.relationship)}
                        {renderRow('ID Proof Type', visitor.idProofType)}
                        {renderRow('ID Number', visitor.idProofNumber)}
                        {renderRow('Address', visitor.address)}
                    </div>
                </div>
            </div>
            <CheckInModal
                isOpen={isCheckInOpen}
                onClose={() => setIsCheckInOpen(false)}
                onSuccess={() => {
                    setIsCheckInOpen(false);
                    onClose();
                }}
                prefilledVisitor={visitor}
            />
        </Modal>
    );
}
