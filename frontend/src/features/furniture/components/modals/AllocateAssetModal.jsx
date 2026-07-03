import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { getStudents } from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';
import Dropdown from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';

export default function AllocateAssetModal({ isOpen, onClose, onAllocate, asset }) {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const role = useAuthStore(s => s.user?.role);

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        try {
            setLoadingStudents(true);
            const res = await getStudents(role, { limit: 1000, isActive: true });
            setStudents(res.data?.students || res.students || []);
        } catch (error) {
            console.error("Failed to load students", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return;
        
        setIsSubmitting(true);
        try {
            await onAllocate(selectedStudentId, asset._id);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Allocate Asset: ${asset?.furnitureId || ''}`}
            subtitle="Select a student to allocate this asset to."
            maxWidth="max-w-sm"
            asForm
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student <span className="text-red-500">*</span></label>
                    <Dropdown
                        options={students.map(s => ({ label: `${s.name} (${s.admissionNo})`, value: s._id }))}
                        value={selectedStudentId}
                        onChange={(val) => setSelectedStudentId(val)}
                        placeholder={loadingStudents ? "Loading students..." : "Select Student"}
                        searchable
                        triggerClassName="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors flex items-center justify-between"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <Button
                    variant="primary"
                    fullWidth={false}
                    size="md"
                    type="submit"
                    disabled={isSubmitting || !selectedStudentId}
                    className="min-w-[120px] order-2 bg-[#0a3a6a] hover:bg-[#0a3a6a]/90 capitalize"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'allocate'}
                </Button>
                <Button
                    variant="outline"
                    fullWidth={false}
                    size="md"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="min-w-[120px] order-1 text-[#0a3a6a] border-[#0a3a6a] hover:bg-gray-50"
                >
                    Cancel
                </Button>
            </div>
        </Modal>
    );
}
