import React, { useState, useEffect } from 'react';
import { Loader2, Building, Building2, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AnnouncementService from '@/services/announcement.service';
import OrganizationService from '@/services/organization.service';
import HostelService from '@/services/hostel.service';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import DateInput from '@/components/ui/DateInput';
import TimeInput from '@/components/ui/TimeInput';

const AnnouncementFormModal = ({ isOpen, onClose, onSuccess, announcementToEdit = null }) => {
    const { user } = useAuthStore();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('general');
    const [targetOrganization, setTargetOrganization] = useState('');
    const [targetHostel, setTargetHostel] = useState('');
    const [sendOption, setSendOption] = useState('instant');
    
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [expiresDate, setExpiresDate] = useState('');
    const [expiresTime, setExpiresTime] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Data for Super Admin selection
    const [organizations, setOrganizations] = useState([]);
    const [hostels, setHostels] = useState([]);

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        if (isOpen) {
            if (isSuperAdmin) {
                fetchOptions();
            }
            if (announcementToEdit) {
                setTitle(announcementToEdit.title || '');
                setMessage(announcementToEdit.message || '');
                setTargetType(announcementToEdit.targetType || 'general');
                setTargetOrganization(announcementToEdit.targetOrganizations?.[0]?.id || announcementToEdit.targetOrganizations?.[0] || '');
                setTargetHostel(announcementToEdit.targetHostels?.[0]?.id || announcementToEdit.targetHostels?.[0] || '');
                
                if (announcementToEdit.status === 'scheduled' || announcementToEdit.status === 'SCHEDULED') {
                    setSendOption('schedule');
                    if (announcementToEdit.scheduledAt) {
                        const d = new Date(announcementToEdit.scheduledAt);
                        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
                        setScheduledDate(iso.slice(0, 10));
                        setScheduledTime(iso.slice(11, 16));
                    }
                } else {
                    setSendOption('instant');
                }

                if (announcementToEdit.expiresAt) {
                    const d = new Date(announcementToEdit.expiresAt);
                    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
                    setExpiresDate(iso.slice(0, 10));
                    setExpiresTime(iso.slice(11, 16));
                }
            } else {
                resetForm();
            }
        }
    }, [isOpen, isSuperAdmin, announcementToEdit]);

    const fetchOptions = async () => {
        try {
            const orgs = await OrganizationService.getOrganizations({ limit: 0 });
            if (orgs?.data) setOrganizations(orgs.data);

            const hstls = await HostelService.getHostels({ limit: 0 });
            if (hstls?.data) setHostels(hstls.data);
        } catch (error) {
            console.error("Failed to fetch options for super admin", error);
        }
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setTargetType('general');
        setTargetOrganization('');
        setTargetHostel('');
        setSendOption('instant');
        setScheduledDate('');
        setScheduledTime('');
        setExpiresDate('');
        setExpiresTime('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            showErrorToast("Title and message are required");
            return;
        }

        if (isSuperAdmin && targetType === 'selected') {
            if (!targetOrganization && !targetHostel) {
                showErrorToast("Please select at least one Organization or Hostel");
                return;
            }
        }

        if (sendOption === 'schedule' && (!scheduledDate || !scheduledTime)) {
            showErrorToast("Please select a date and time to schedule the announcement");
            return;
        }

        setIsConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        setIsConfirmOpen(false);
        setIsSubmitting(true);
        try {
            const payload = { title, message };

            if (sendOption === 'schedule' && scheduledDate && scheduledTime) {
                payload.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
            }
            
            if (expiresDate && expiresTime) {
                payload.expiresAt = new Date(`${expiresDate}T${expiresTime}:00`).toISOString();
            } else if (expiresDate && !expiresTime) {
                 payload.expiresAt = new Date(`${expiresDate}T23:59:59`).toISOString();
            }

            if (isSuperAdmin) {
                if (targetType === 'selected') {
                    if (targetOrganization) {
                        payload.targetType = 'ORGANIZATION';
                        payload.targetOrganizations = [targetOrganization];
                    } else if (targetHostel) {
                        payload.targetType = 'HOSTEL';
                        payload.targetHostels = [targetHostel];
                    }
                } else {
                    payload.targetType = 'GENERAL';
                }
            } else if (user?.role === 'admin') {
                payload.targetType = 'ORGANIZATION';
            } else if (user?.role === 'warden' || user?.role === 'assistant_warden') {
                payload.targetType = 'HOSTEL';
            }

            if (announcementToEdit) {
                await AnnouncementService.updateAnnouncement(announcementToEdit.id || announcementToEdit.id, payload);
                showSuccessToast('Announcement Updated', 'Announcement has been updated successfully');
            } else {
                await AnnouncementService.createAnnouncement(payload);
                showSuccessToast('Announcement Sent', 'Announcement has been sent successfully');
            }
            resetForm();
            onSuccess();
        } catch (error) {
            console.error(announcementToEdit ? "Failed to update announcement" : "Failed to send announcement", error);
            showErrorToast(announcementToEdit ? 'Failed to update announcement' : 'Failed to send announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={announcementToEdit ? 'Edit Announcement' : 'Create Announcement'}
                subtitle={announcementToEdit ? 'Modify the details of your announcement' : 'Broadcast a message to your users'}
                icon={<Bell size={24} />}
                asForm={true}
                onSubmit={handleSubmit}
                maxWidth="max-w-xl"
                bottomSheetOnMobile={true}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center justify-center min-w-[140px] px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 size={14} className="animate-spin mx-auto" />
                            ) : (
                                announcementToEdit 
                                    ? (sendOption === 'schedule' ? 'Update Schedule' : 'Update Announcement') 
                                    : (sendOption === 'schedule' ? 'Schedule Announcement' : 'Send Announcement')
                            )}
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <section>
                        <h3 className="text-xs font-semibold text-[#0A437A] mb-1">Message Details</h3>
                        <h5 className="text-xs text-[#777777] mb-4">Provide the main content for the announcement</h5>
                        <div className="border-b border-gray-100 mb-4" />
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-medium text-black mb-1">Announcement Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A]"
                                    placeholder="Enter title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-medium text-black mb-1">Message <span className="text-red-500">*</span></label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#0A437A] resize-none"
                                    placeholder="Write the announcement message..."
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-semibold text-[#0A437A] mb-1">Timing Options</h3>
                        <h5 className="text-xs text-[#777777] mb-4">Choose when the announcement will be sent and expire</h5>
                        <div className="border-b border-gray-100 mb-4" />

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-medium text-black mb-2">Send Option</label>
                                <div className="flex flex-wrap gap-4 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={sendOption === 'instant'}
                                            onChange={() => {
                                                setSendOption('instant');
                                                setScheduledDate('');
                                                setScheduledTime('');
                                            }}
                                            className="text-[#0A437A] focus:ring-[#0A437A]"
                                        />
                                        <span className="text-[10px] text-gray-700">Send Instantly</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={sendOption === 'schedule'}
                                            onChange={() => setSendOption('schedule')}
                                            className="text-[#0A437A] focus:ring-[#0A437A]"
                                        />
                                        <span className="text-[10px] text-gray-700">Schedule</span>
                                    </label>
                                </div>
                            </div>

                            {sendOption === 'schedule' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <DateInput
                                        label="Schedule Date"
                                        required
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                    />
                                    <TimeInput
                                        label="Schedule Time"
                                        required
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        labelClassName="block mb-1.5 text-xs font-medium text-text-primary"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <DateInput
                                    label="Expiry Date (Optional)"
                                    value={expiresDate}
                                    onChange={(e) => setExpiresDate(e.target.value)}
                                    min={scheduledDate || new Date().toISOString().slice(0, 10)}
                                />
                                <TimeInput
                                    label="Expiry Time (Optional)"
                                    value={expiresTime}
                                    onChange={(e) => setExpiresTime(e.target.value)}
                                    labelClassName="block mb-1.5 text-xs font-medium text-text-primary"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 leading-tight">After the expiry date, the announcement will move to history.</p>
                        </div>
                    </section>

                    {isSuperAdmin && (
                        <section>
                            <h3 className="text-xs font-semibold text-[#0A437A] mb-1">Target Audience</h3>
                            <h5 className="text-xs text-[#777777] mb-4">Select who will receive this announcement</h5>
                            <div className="border-b border-gray-100 mb-4" />

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={targetType === 'general' || targetType === 'GENERAL'}
                                            onChange={() => setTargetType('general')}
                                            className="text-[#0A437A] focus:ring-[#0A437A]"
                                        />
                                        <span className="text-[10px] text-gray-700">General (All Users)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={targetType === 'selected' || targetType === 'ORGANIZATION' || targetType === 'HOSTEL'}
                                            onChange={() => setTargetType('selected')}
                                            className="text-[#0A437A] focus:ring-[#0A437A]"
                                        />
                                        <span className="text-[10px] text-gray-700">Selected targets</span>
                                    </label>
                                </div>

                                {(targetType === 'selected' || targetType === 'ORGANIZATION' || targetType === 'HOSTEL') && (
                                    <div className="p-4 bg-gray-50/50 rounded-lg space-y-4 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 mb-2">Select either organizations OR hostels to target.</p>

                                        <div>
                                            <label className="block text-[10px] font-medium text-black mb-1 flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" /> Organizations
                                            </label>
                                            <Dropdown
                                                options={organizations.map(org => ({ label: org.name, value: org.id || org.id }))}
                                                value={targetOrganization}
                                                onChange={(val) => {
                                                    setTargetOrganization(val);
                                                    if (val) setTargetHostel('');
                                                }}
                                                placeholder="Select an organization..."
                                                minWidth="w-full"
                                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-[#777777] focus:border-[#0A437A]"
                                            />
                                        </div>

                                        <div className="text-center text-[10px] text-gray-400 font-medium">OR</div>

                                        <div>
                                            <label className="block text-[10px] font-medium text-black mb-1 flex items-center gap-1.5">
                                                <Building className="w-3.5 h-3.5 text-gray-400" /> Hostels
                                            </label>
                                            <Dropdown
                                                options={hostels.map(h => ({ label: h.name, value: h.id || h.id }))}
                                                value={targetHostel}
                                                onChange={(val) => {
                                                    setTargetHostel(val);
                                                    if (val) setTargetOrganization('');
                                                }}
                                                placeholder="Select a hostel..."
                                                minWidth="w-full"
                                                triggerClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-[#777777] focus:border-[#0A437A]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmSubmit}
                title={announcementToEdit ? "Update Announcement" : "Create Announcement"}
                message={announcementToEdit ? "Are you sure you want to save these changes?" : "Are you sure you want to publish this announcement?"}
                confirmText={announcementToEdit ? "Update" : "Publish"}
                cancelText="Cancel"
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default AnnouncementFormModal;
