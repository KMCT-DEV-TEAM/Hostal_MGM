import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import DateInput from '@/components/ui/DateInput';
import PasswordConfirmModal from '@/components/ui/PasswordConfirmModal';
import authService from '@/services/auth.service';
import { showErrorToast } from '@/utils/toast';

export default function ExportFilterModal({ 
    isOpen, 
    onClose, 
    onExport, 
    isExporting,
    title = "Export Data",
    subtitle = "Select filters to apply before downloading",
    fields = [
        {
            name: "isActive",
            label: "Account Status",
            options: [
                { label: 'All Status', value: '' },
                { label: 'Active Only', value: 'true' },
                { label: 'Inactive Only', value: 'false' },
            ]
        }
    ]
}) {
    const [filters, setFilters] = useState({});
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const initial = {};
            fields.forEach(f => {
                initial[f.name] = '';
            });
            setFilters(initial);
        }
    }, [isOpen, fields]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        setIsVerifyingPassword(true);
        try {
            await authService.verifyPassword({ password });
            setIsVerifyingPassword(false);
            setIsPasswordModalOpen(false);
            onExport(filters);
        } catch (error) {
            showErrorToast('Export Failed', 'Incorrect password');
            setIsVerifyingPassword(false);
        }
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            maxWidth="max-w-md"
            overflowClass="overflow-visible"
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                        disabled={isExporting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isExporting}
                        className="px-5 py-2 bg-[#0A437A] text-white rounded-md text-xs font-medium hover:bg-[#083663] disabled:opacity-50 flex items-center justify-center min-w-[120px] cursor-pointer"
                    >
                        {isExporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Export to Excel'}
                    </button>
                </div>
            }
        >
            <div className={`grid grid-cols-1 ${fields.length > 1 ? 'sm:grid-cols-2' : ''} gap-5`}>
                {fields.map((field, index) => (
                    <div key={field.name} className="relative" style={{ zIndex: 20 - index }}>
                        <label className="block mb-1.5 text-xs font-medium text-gray-700">{field.label}</label>
                        {field.type === 'date' ? (
                            <DateInput
                                value={filters[field.name] || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder="Select Date"
                                className="w-full"
                            />
                        ) : (
                            <Dropdown
                                options={field.options}
                                value={filters[field.name] || ''}
                                onChange={(val) => setFilters(prev => ({ ...prev, [field.name]: val }))}
                                className="w-full"
                            />
                        )}
                    </div>
                ))}
            </div>
        </Modal>
        
        <PasswordConfirmModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onConfirm={handlePasswordConfirm}
            title="Verify Password to Export"
            message="Please enter your password to securely export the data."
            confirmText={isVerifyingPassword ? "Verifying..." : "Verify & Export"}
            isVerifying={isVerifyingPassword}
        />
        </>
    );
}
