import React from 'react';
import { User, Building2, Mail, Phone, Pencil, Check, X, Loader2, GraduationCap } from 'lucide-react';

const StudentAcademicCard = ({ user, admissionNumber, organization, contactEmail, contactNumber, editProps }) => {
    const {
        editingField,
        editValue,
        setEditValue,
        isSaving,
        errors,
        setErrors,
        handleEditClick,
        handleCancelEdit,
        handleOpenConfirm
    } = editProps;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary text-sm">Academic Details</h3>
            </div>

            <div className="p-4 flex flex-col gap-5">
                <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Admission Number</p>
                        <p className="text-sm font-medium text-text-primary">{admissionNumber}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Organization</p>
                        <p className="text-sm font-medium text-text-primary">{organization}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 flex justify-between items-center">
                        {editingField === 'email' ? (
                            <div className="flex flex-col gap-1 w-full mt-1">
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="email"
                                        value={editValue}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const cleanVal = val.replace(/\s/g, '');
                                            if (val !== cleanVal) {
                                                setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, email: '' }));
                                            }
                                            setEditValue(cleanVal);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === ' ') {
                                                e.preventDefault();
                                                setErrors(prev => ({ ...prev, email: 'Spaces are not allowed in email' }));
                                            }
                                        }}
                                        className={`w-full border ${errors.email ? 'border-danger' : 'border-gray-300'} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50`}
                                        autoFocus
                                        disabled={isSaving}
                                        placeholder="Enter new email"
                                    />
                                    <button
                                        onClick={() => handleOpenConfirm('email')}
                                        disabled={isSaving || (editValue && editValue.trim() === '')}
                                        className="p-1.5 text-success hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.email && <p className="text-danger text-[10px]">{errors.email}</p>}
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contact Email</p>
                                    <p className="text-sm font-medium text-text-primary">{contactEmail}</p>
                                </div>
                                {user?.role !== 'super_admin' && user?.role !== 'student' && user?.role !== 'parent' && (
                                    <button
                                        onClick={() => handleEditClick('email', user?.email)}
                                        className="p-2 text-primary hover:bg-blue-50 rounded-lg active:scale-95 transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 flex justify-between items-center">
                        {editingField === 'phone' ? (
                            <div className="flex flex-col gap-1 w-full mt-1">
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editValue}
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        title="Please enter exactly 10 digits"
                                        onChange={(e) => {
                                            const originalVal = e.target.value;
                                            const val = originalVal.replace(/\D/g, '');
                                            if (originalVal !== val) {
                                                setErrors(prev => ({ ...prev, phone: 'Only numbers are allowed' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, phone: '' }));
                                            }
                                            if (val.length <= 10) {
                                                setEditValue(val);
                                            }
                                        }}
                                        className={`w-full border ${errors.phone ? 'border-danger' : 'border-gray-300'} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50`}
                                        autoFocus
                                        disabled={isSaving}
                                        placeholder="Enter 10 digit number"
                                    />
                                    <button
                                        onClick={() => handleOpenConfirm('phone')}
                                        disabled={isSaving}
                                        className="p-1.5 text-success hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                        className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.phone && <p className="text-danger text-[10px]">{errors.phone}</p>}
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contact Number</p>
                                    <p className="text-sm font-medium text-text-primary">{contactNumber}</p>
                                </div>
                                <button
                                    onClick={() => handleEditClick('phone', user?.phone)}
                                    className="p-2 text-primary hover:bg-blue-50 rounded-lg active:scale-95 transition-all"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAcademicCard;
