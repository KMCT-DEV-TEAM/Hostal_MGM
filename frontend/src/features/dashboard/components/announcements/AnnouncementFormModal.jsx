import React, { useState, useEffect } from 'react';
import { X, Loader2, Building, Building2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import AnnouncementService from '@/services/announcement.service';
import OrganizationService from '@/services/organization.service';
import HostelService from '@/services/hostel.service';
import Dropdown from '@/components/ui/Dropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const AnnouncementFormModal = ({ isOpen, onClose, onSuccess, announcementToEdit = null }) => {
    const { user } = useAuthStore();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('general');
    const [targetOrganization, setTargetOrganization] = useState('');
    const [targetHostel, setTargetHostel] = useState('');
    const [sendOption, setSendOption] = useState('instant');
    const [scheduledAt, setScheduledAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
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
                setTargetOrganization(announcementToEdit.targetOrganizations?.[0]?._id || announcementToEdit.targetOrganizations?.[0] || '');
                setTargetHostel(announcementToEdit.targetHostels?.[0]?._id || announcementToEdit.targetHostels?.[0] || '');
                
                if (announcementToEdit.status === 'scheduled') {
                    setSendOption('schedule');
                    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
                    if (announcementToEdit.scheduledAt) {
                        const d = new Date(announcementToEdit.scheduledAt);
                        setScheduledAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16));
                    }
                } else {
                    setSendOption('instant');
                }

                if (announcementToEdit.expiresAt) {
                    const d = new Date(announcementToEdit.expiresAt);
                    setExpiresAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16));
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
        setScheduledAt('');
        setExpiresAt('');
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

        if (sendOption === 'schedule' && !scheduledAt) {
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

            if (sendOption === 'schedule' && scheduledAt) {
                payload.scheduledAt = new Date(scheduledAt).toISOString();
            }
            if (expiresAt) {
                payload.expiresAt = new Date(expiresAt).toISOString();
            }

            if (isSuperAdmin) {
                if (targetType === 'selected') {
                    if (targetOrganization) {
                        payload.targetType = 'organization';
                        payload.targetOrganizations = [targetOrganization];
                    } else if (targetHostel) {
                        payload.targetType = 'hostel';
                        payload.targetHostels = [targetHostel];
                    }
                } else {
                    payload.targetType = 'general';
                }
            } else if (user?.role === 'admin') {
                payload.targetType = 'organization';
            } else if (user?.role === 'warden') {
                payload.targetType = 'hostel';
            }

            if (announcementToEdit) {
                await AnnouncementService.updateAnnouncement(announcementToEdit._id, payload);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up sm:animate-none">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">{announcementToEdit ? 'Edit Announcement' : 'Create Announcement'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="announcement-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Enter title"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                placeholder="Write the announcement message..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Send Option</label>
                            <div className="flex flex-wrap gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={sendOption === 'instant'}
                                        onChange={() => {
                                            setSendOption('instant');
                                            setScheduledAt('');
                                        }}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">Send Instantly</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={sendOption === 'schedule'}
                                        onChange={() => setSendOption('schedule')}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">Schedule</span>
                                </label>
                            </div>

                            {sendOption === 'schedule' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required={sendOption === 'schedule'}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date & Time (Optional)</label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                min={scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">After this time, the announcement will move to history.</p>
                        </div>

                        {isSuperAdmin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={targetType === 'general'}
                                                onChange={() => setTargetType('general')}
                                                className="text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-700">General (All Users)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={targetType === 'selected'}
                                                onChange={() => setTargetType('selected')}
                                                className="text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-700">Selected targets</span>
                                        </label>
                                    </div>
                                </div>

                                {targetType === 'selected' && (
                                    <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-2">Select either organizations OR hostels to target.</p>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-gray-400" /> Organizations
                                            </label>
                                            <Dropdown
                                                options={organizations.map(org => ({ label: org.name, value: org._id }))}
                                                value={targetOrganization}
                                                onChange={(val) => {
                                                    setTargetOrganization(val);
                                                    if (val) setTargetHostel('');
                                                }}
                                                placeholder="Select an organization..."
                                                className="w-full"
                                            />
                                        </div>

                                        <div className="text-center text-sm text-gray-400 font-medium my-2">OR</div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <Building className="w-4 h-4 text-gray-400" /> Hostels
                                            </label>
                                            <Dropdown
                                                options={hostels.map(h => ({ label: h.name, value: h._id }))}
                                                value={targetHostel}
                                                onChange={(val) => {
                                                    setTargetHostel(val);
                                                    if (val) setTargetOrganization('');
                                                }}
                                                placeholder="Select a hostel..."
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </form>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="announcement-form"
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            announcementToEdit 
                                ? (sendOption === 'schedule' ? 'Update Schedule' : 'Update Announcement') 
                                : (sendOption === 'schedule' ? 'Schedule Announcement' : 'Send Announcement')
                        )}
                    </button>
                </div>
            </div>

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
        </div>
    );
};

export default AnnouncementFormModal;
