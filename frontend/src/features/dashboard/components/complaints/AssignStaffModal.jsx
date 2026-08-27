import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import { getMaintenanceStaff } from '@/services/maintenanceStaff.service';
import { getWardens } from '@/services/warden.service';
import ComplaintService from '@/services/complaint.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

export default function AssignStaffModal({ isOpen, onClose, complaint, onAssigned }) {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [assigneeType, setAssigneeType] = useState('maintenance'); // 'maintenance' | 'warden'

    // Only set initial selectedStaff and assigneeType when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedStaff(complaint?.assignedStaff?.id || '');
            // We don't have the explicit role in complaint.assignedStaff usually, 
            // but we default to 'maintenance'. If a user changes the toggle, it will reset selectedStaff.
            setAssigneeType('maintenance');
        }
    }, [isOpen, complaint]);

    useEffect(() => {
        if (isOpen) {
            fetchStaff();
        }
    }, [isOpen, assigneeType]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            if (assigneeType === 'maintenance') {
                const res = await getMaintenanceStaff({ limit: 100, status: 'Active' });
                setStaffList(res.data || []);
            } else {
                if (complaint?.hostelId?.wardens && Array.isArray(complaint.hostelId.wardens)) {
                    // Use populated wardens from the complaint's hostel
                    setStaffList(complaint.hostelId.wardens);
                } else {
                    // Fallback to fetching all and filtering by hostel if hostelId is just a string
                    const res = await getWardens({ limit: 100, status: 'Active' });
                    const allWardens = res.data || [];
                    const hostelIdStr = complaint?.hostelId?.id || complaint?.hostelId;
                    const filteredWardens = hostelIdStr 
                        ? allWardens.filter(w => w.hostelId === hostelIdStr)
                        : allWardens;
                    setStaffList(filteredWardens);
                }
            }
        } catch (error) {
            showErrorToast('Failed to load staff', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedStaff) {
            showErrorToast('Validation Error', `Please select a ${assigneeType === 'warden' ? 'warden' : 'maintenance staff'} member.`);
            return;
        }

        setAssigning(true);
        try {
            const response = await ComplaintService.assignComplaintStaff(complaint.id, selectedStaff);
            showSuccessToast('Assigned Successfully', `${assigneeType === 'warden' ? 'Warden' : 'Maintenance staff'} has been assigned to this complaint.`);
            const assignedUser = staffList.find(s => s.id === selectedStaff);
            onAssigned({ 
                id: assignedUser.id, 
                name: assignedUser.name, 
                phone: assignedUser.phone, 
                specialization: assignedUser.specialization || (assigneeType === 'warden' ? 'Warden' : '') 
            }, response.data);
            onClose();
        } catch (error) {
            showErrorToast('Assignment Failed', error.message || 'Could not assign staff.');
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign ${assigneeType === 'warden' ? 'Warden' : 'Maintenance Staff'}`}
            subtitle={`Select an active ${assigneeType === 'warden' ? 'warden' : 'maintenance staff'} to assign to this complaint.`}
            maxWidth="max-w-md"
        >
            <div className="space-y-4">
                
                {/* Assignee Type Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => { setAssigneeType('maintenance'); setSelectedStaff(''); }}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            assigneeType === 'maintenance' 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Maintenance Staff
                    </button>
                    <button
                        onClick={() => { setAssigneeType('warden'); setSelectedStaff(''); }}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            assigneeType === 'warden' 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        Warden
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        Select {assigneeType === 'warden' ? 'Warden' : 'Staff'} <span className="text-danger">*</span>
                    </label>
                    <Dropdown
                        options={[
                            { value: "", label: `Select ${assigneeType === 'warden' ? 'Warden' : 'Maintenance Staff'}...` },
                            ...staffList.map((staff) => ({
                                value: staff.id,
                                label: `${staff.name} ${staff.specialization ? `(${staff.specialization})` : ''}`
                            }))
                        ]}
                        value={selectedStaff}
                        onChange={(val) => setSelectedStaff(val)}
                        disabled={loading || assigning}
                        triggerClassName="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-left flex justify-between items-center focus:outline-none focus:border-primary disabled:bg-gray-50"
                        menuClassName="w-full"
                    />
                    {loading && (
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading list...
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
                        Assign {assigneeType === 'warden' ? 'Warden' : 'Staff'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
