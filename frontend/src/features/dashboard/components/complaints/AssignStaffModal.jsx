import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { getMaintenanceStaff } from '@/services/maintenanceStaff.service';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

export default function AssignStaffModal({ isOpen, onClose, complaint, onAssigned }) {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchStaff();
            setSelectedStaff(complaint?.assignedStaff?._id || '');
        }
    }, [isOpen, complaint]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await getMaintenanceStaff({ limit: 100, status: 'Active' });
            setStaffList(res.data || []);
        } catch (error) {
            showErrorToast('Failed to load staff', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedStaff) {
            showErrorToast('Validation Error', 'Please select a maintenance staff member.');
            return;
        }

        setAssigning(true);
        try {
            await ComplaintService.assignComplaintStaff(complaint.id, selectedStaff);
            showSuccessToast('Assigned Successfully', 'Maintenance staff has been assigned to this complaint.');
            const assignedUser = staffList.find(s => s._id === selectedStaff);
            onAssigned({ _id: assignedUser._id, name: assignedUser.name, phone: assignedUser.phone });
            onClose();
        } catch (error) {
            showErrorToast('Assignment Failed', error.message || 'Could not assign staff.');
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Maintenance Staff"
            subtitle="Select an active maintenance staff to assign to this complaint."
            maxWidth="max-w-md"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Select Staff <span className="text-danger">*</span>
                    </label>
                    <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        disabled={loading || assigning}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary disabled:bg-gray-50"
                    >
                        <option value="">Select Maintenance Staff...</option>
                        {staffList.map((staff) => (
                            <option key={staff._id} value={staff._id}>
                                {staff.name} {staff.specialization ? `(${staff.specialization})` : ''}
                            </option>
                        ))}
                    </select>
                    {loading && (
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading staff list...
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        disabled={assigning}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAssign}
                        disabled={assigning || !selectedStaff}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                        Assign Staff
                    </button>
                </div>
            </div>
        </Modal>
    );
}
