import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Pencil, Check, X, Loader2, Building, GraduationCap, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import DetailCard from '@/components/ui/DetailCard';
import DetailRow from '@/components/ui/DetailRow';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useActiveStudent } from '@/hooks/useActiveStudent';
import { useParentStore } from '@/store/useParentStore';
import { ROLES } from '@/constants/roles';

const ProfileDesktopView = ({
    user,
    formatRole,
    editingField,
    editValue,
    setEditValue,
    isSaving,
    errors,
    setErrors,
    handleEditClick,
    handleCancelEdit,
    handleOpenConfirm
}) => {
    const { t } = useTranslation();
    const [studentToSwitch, setStudentToSwitch] = useState(null);
    const { activeStudentId } = useActiveStudent();
    const { setActiveStudent } = useParentStore();

    const selectedStudent = user?.role === ROLES.PARENT 
        ? (user?.students?.find(s => s.id === activeStudentId) || user?.students?.[0])
        : null;

    return (
        <div className="p-4 md:p-8 w-full animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t('my_profile')}</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your personal informations and security</p>
            </div>

            {/* Main Top Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6 w-full">
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-primary text-3xl font-bold shadow-sm">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        {user?.isActive !== false && (
                            <div className="absolute bottom-1 right-2 w-4 h-4 bg-[#2ECC71] border-2 border-white rounded-full"></div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 w-full max-w-xl">
                        {/* Name */}
                        <div className="flex items-center gap-2 group h-8">
                            {editingField === 'name' ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => {
                                            const originalVal = e.target.value;
                                            const cleanVal = originalVal.replace(/[^a-zA-Z\s]/g, '');
                                            if (originalVal !== cleanVal) {
                                                setErrors(prev => ({ ...prev, name: 'Only letters are allowed' }));
                                            } else {
                                                setErrors(prev => ({ ...prev, name: '' }));
                                            }
                                            setEditValue(cleanVal);
                                        }}
                                        className={`flex-1 border ${errors.name ? 'border-danger' : 'border-gray-300'} rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary`}
                                        autoFocus
                                        disabled={isSaving}
                                    />
                                    <button onClick={() => handleOpenConfirm('name')} disabled={isSaving || !editValue?.trim()} className="p-1.5 text-success hover:bg-green-50 rounded-md">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button onClick={handleCancelEdit} disabled={isSaving} className="p-1.5 text-danger hover:bg-red-50 rounded-md">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-gray-900">{user?.name || user?.parentName}</h2>
                                    <button onClick={() => handleEditClick('name', user?.name || user?.parentName)} className="opacity-0 group-hover:opacity-100 p-1 text-primary hover:bg-blue-50 rounded transition-all">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                        {errors.name && <p className="text-danger text-[10px] m-0 leading-none">{errors.name}</p>}

                        {/* Email */}
                        <div className="flex items-center gap-2 group h-7 mt-1 text-sm text-gray-500">
                            {editingField === 'email' ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="email"
                                        value={editValue}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\s/g, '');
                                            setEditValue(val);
                                            setErrors(prev => ({ ...prev, email: '' }));
                                        }}
                                        className={`flex-1 border ${errors.email ? 'border-danger' : 'border-gray-300'} rounded-md px-3 py-1 text-sm focus:outline-none focus:border-primary`}
                                        autoFocus
                                        disabled={isSaving}
                                    />
                                    <button onClick={() => handleOpenConfirm('email')} disabled={isSaving || !editValue?.trim()} className="p-1 text-success hover:bg-green-50 rounded-md">
                                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={handleCancelEdit} disabled={isSaving} className="p-1 text-danger hover:bg-red-50 rounded-md">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span>{user?.email || t('not_provided')}</span>
                                    {user?.role !== ROLES.SUPER_ADMIN && user?.role !== ROLES.STUDENT && user?.role !== ROLES.PARENT && (
                                        <button onClick={() => handleEditClick('email', user?.email)} className="opacity-0 group-hover:opacity-100 p-1 text-primary hover:bg-blue-50 rounded transition-all">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        {errors.email && <p className="text-danger text-[10px] m-0 leading-none">{errors.email}</p>}

                        {/* Phone */}
                        <div className="flex items-center gap-2 group h-7 text-sm text-gray-500">
                            {editingField === 'phone' ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editValue}
                                        maxLength={10}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setEditValue(val);
                                            setErrors(prev => ({ ...prev, phone: '' }));
                                        }}
                                        className={`flex-1 border ${errors.phone ? 'border-danger' : 'border-gray-300'} rounded-md px-3 py-1 text-sm focus:outline-none focus:border-primary`}
                                        autoFocus
                                        disabled={isSaving}
                                    />
                                    <button onClick={() => handleOpenConfirm('phone')} disabled={isSaving} className="p-1 text-success hover:bg-green-50 rounded-md">
                                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={handleCancelEdit} disabled={isSaving} className="p-1 text-danger hover:bg-red-50 rounded-md">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span>{user?.phone || t('not_provided')}</span>
                                    <button onClick={() => handleEditClick('phone', user?.phone)} className="opacity-0 group-hover:opacity-100 p-1 text-primary hover:bg-blue-50 rounded transition-all">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                        {errors.phone && <p className="text-danger text-[10px] m-0 leading-none">{errors.phone}</p>}

                    </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                    <span className={`px-6 py-1.5 rounded-full text-[11px] tracking-wide font-semibold ${user?.isActive !== false ? 'bg-[#E5F5E9] text-[#2ECC71] border border-[#2ECC71]/30' : 'bg-red-50 text-danger border border-red-200'}`}>
                        {user?.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>
            </div>

            {/* Role Specific Sections */}
            {user?.role === ROLES.PARENT && (
                <>
                    {/* Students List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-primary">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-primary text-lg">Students</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {user?.students?.map(student => {
                                const isActive = student.id === activeStudentId;
                                return (
                                <div
                                    key={student.id}
                                    onClick={() => {
                                        if (!isActive) {
                                            setStudentToSwitch(student);
                                        }
                                    }}
                                    className={`p-4 border ${isActive ? 'border-success shadow-sm ring-1 ring-success/10 bg-success/5' : 'border-[#EAEAEA] bg-white'} rounded-xl flex items-center justify-between cursor-pointer hover:border-success/50 transition-all duration-200`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center text-primary text-sm font-bold shadow-sm">
                                                {student.profileImage ? (
                                                    <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    student.name ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full"></div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-[15px]">{student.name}</h4>
                                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">ROOM {student.roomNo || student.room || 'N/A'} • {student.academicYear || student.currentYear || 'N/A'} YEAR</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Student Details (Bottom Section) */}
                    {selectedStudent && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                                <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-primary">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-primary text-lg">Student Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DetailCard title="Personal Informations" subtitle="Basic Details about the Student" className="!shadow-none !border-gray-100">
                                    <div className="space-y-1">
                                        <DetailRow label="Full Name" value={selectedStudent.name} />
                                        <DetailRow label="Phone No" value={selectedStudent.phone || 'N/A'} />
                                        <DetailRow label="Email" value={selectedStudent.email || 'N/A'} />
                                    </div>
                                </DetailCard>

                                <DetailCard title="Academic Information" subtitle="Academic course details" className="!shadow-none !border-gray-100">
                                    <div className="space-y-1">
                                        <DetailRow label="Batch" value={selectedStudent.batch || 'N/A'} />
                                        <DetailRow label="Course" value={selectedStudent.course || 'N/A'} />
                                        <DetailRow label="Department" value={selectedStudent.department || 'N/A'} />
                                    </div>
                                </DetailCard>

                                <DetailCard title="Hostel Details" subtitle="Hostel allocation details" className="!shadow-none !border-gray-100">
                                    <div className="space-y-1">
                                        <DetailRow label="Hostel" value={selectedStudent.hostel?.name || 'N/A'} />
                                        <DetailRow label="Warden" value={selectedStudent.warden?.name || 'N/A'} />
                                        <DetailRow label="Contact" value={selectedStudent.warden?.phone || selectedStudent.hostel?.contact || 'N/A'} />
                                    </div>
                                </DetailCard>

                                <DetailCard title="Mentor Details" subtitle="Assigned batch mentor details" className="!shadow-none !border-gray-100">
                                    <div className="space-y-1">
                                        <DetailRow label="Mentor Name" value={selectedStudent.mentor?.name || 'N/A'} />
                                        <DetailRow label="Contact" value={selectedStudent.mentor?.phone || 'N/A'} />
                                        <DetailRow label="Email" value={selectedStudent.mentor?.email || 'N/A'} />
                                    </div>
                                </DetailCard>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* If not a parent, we can just show their own details in the DetailCards using a similar style */}
            {user?.role !== ROLES.PARENT && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                        <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-primary">
                            <User className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-primary text-lg">Account Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailCard title="Role Information" subtitle="System role and permissions" className="!shadow-none !border-gray-100">
                            <DetailRow label="Role" value={
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-primary border border-blue-100 text-xs font-bold tracking-wide">
                                    <Shield className="w-3 h-3" />
                                    {formatRole(user?.role)}
                                </span>
                            } />
                            {(user?.role === ROLES.WARDEN || user?.role === ROLES.STUDENT) && (
                                <DetailRow label="Hostel" value={
                                    <div className="flex flex-wrap items-center gap-2">
                                        {user?.assignedHostels && user.assignedHostels.length > 0 ? (
                                            user.assignedHostels.map((hostel, index) => (
                                                <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-semibold tracking-wide">
                                                    <Building className="w-3 h-3" />
                                                    {hostel.name} {hostel.code ? `(${hostel.code})` : ''}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Not assigned to any hostel</span>
                                        )}
                                    </div>
                                } />
                            )}
                        </DetailCard>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!studentToSwitch}
                onClose={() => setStudentToSwitch(null)}
                onConfirm={() => {
                    setActiveStudent(studentToSwitch.id);
                    setStudentToSwitch(null);
                }}
                title="Switch Student"
                message={`Are you sure you want to view the dashboard for ${studentToSwitch?.name}?`}
                confirmText="Switch"
                confirmButtonClass="bg-primary text-white hover:bg-primary/90"
            />
        </div>
    );
};

export default ProfileDesktopView;
