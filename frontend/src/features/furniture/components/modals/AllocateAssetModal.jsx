import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { getStudents } from '@/services/student.service';
import { useAuthStore } from '@/store/useAuthStore';

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
                    <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={loadingStudents}
                        required
                    >
                        <option value="">{loadingStudents ? "Loading students..." : "Select Student"}</option>
                        {students.map(s => (
                            <option key={s._id} value={s._id}>
                                {s.name} ({s.admissionNo})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !selectedStudentId}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Allocate'}
                </button>
            </div>
        </Modal>
    );
}
