import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, ToggleRight, Pencil, Hash, MapPin, Calendar, Loader2 } from 'lucide-react';
import InfoRow from '@/components/ui/InfoRow';
import Modal from '@/components/ui/Modal';
import organizationService from '@/services/organization.service';

const AdminDetailView = ({ selectedAdminDetail, setView, openChangeEmailModal }) => {
    const [orgDetails, setOrgDetails] = useState(null);
    const [loadingOrg, setLoadingOrg] = useState(false);

    useEffect(() => {
        if (selectedAdminDetail && selectedAdminDetail.organization) {
            const orgId = typeof selectedAdminDetail.organization === 'object' ? selectedAdminDetail.organization._id : selectedAdminDetail.organization;
            if (orgId) {
                const fetchOrg = async () => {
                    setLoadingOrg(true);
                    try {
                        const res = await organizationService.getOrganizationById(orgId);
                        if (res && res.data) setOrgDetails(res.data);
                    } catch (err) {
                        console.error('Failed to fetch organization details for admin:', err);
                    } finally {
                        setLoadingOrg(false);
                    }
                };
                fetchOrg();
            }
        }
    }, [selectedAdminDetail]);
    return (
        <Modal bottomSheetOnMobile={true}
            isOpen={true}
            onClose={() => setView('list')}
            maxWidth="max-w-5xl"
            title={selectedAdminDetail?.name || 'Admin'}
            subtitle="Administrator Details"
            icon={<User size={24} />}
        >
            {loadingOrg ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-pulse">
                    <div className="md:col-span-7 space-y-4 md:space-y-6">
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="h-4 bg-gray-200 rounded-md w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded-md w-1/2 mb-6"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                        <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                        <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="h-4 bg-gray-200 rounded-md w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded-md w-1/2 mb-6"></div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                        <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                        <div className="h-4 bg-gray-200 rounded-md w-48"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                    <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Main Content Area */}
                    <div className="md:col-span-7 space-y-4 md:space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Basic Info</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Basic contact information of the Administrator</p>
                            <div className="space-y-1">
                                <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedAdminDetail?.name}</InfoRow>
                                <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>
                                    <span className="flex items-center justify-between w-full">
                                        <span className="flex-1 break-all pr-2">{selectedAdminDetail?.email || 'N/A'}</span>
                                        <button
                                            onClick={() => openChangeEmailModal && openChangeEmailModal(selectedAdminDetail)}
                                            className="text-[#0A437A] text-xs font-semibold hover:underline cursor-pointer shrink-0"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </span>
                                </InfoRow>
                                <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedAdminDetail?.phone ? `+91 ${selectedAdminDetail.phone}` : 'N/A'}</InfoRow>
                            </div>
                        </div>

                        {/* Organization Details Section */}
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-[#0A437A] mb-1">Organization Details</h3>
                            <p className="text-[11px] text-text-secondary mb-4">Details of assigned organization</p>
                            <div className="space-y-1">
                                <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400 shrink-0" /> Organization</>}>{selectedAdminDetail?.organization?.name || selectedAdminDetail?.organization || 'N/A'}</InfoRow>

                                {orgDetails ? (
                                    <>
                                        <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{orgDetails.code || 'N/A'}</InfoRow>
                                        <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Number</>}>{orgDetails.organisationNumber || 'N/A'}</InfoRow>
                                        <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{orgDetails.email || 'N/A'}</InfoRow>
                                        <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{orgDetails.phone ? `+91 ${orgDetails.phone}` : 'N/A'}</InfoRow>
                                        <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Address</>}>{orgDetails.address || 'N/A'}</InfoRow>
                                        <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                            <span className="flex items-center">
                                                <span className={`w-2 h-2 rounded-full ${orgDetails.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                                {orgDetails.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </InfoRow>
                                        <InfoRow label={<><Calendar className="w-4 h-4 text-gray-400" /> Created</>}>{orgDetails.createdAt ? new Date(orgDetails.createdAt).toLocaleDateString() : 'N/A'}</InfoRow>
                                    </>
                                ) : (
                                    typeof selectedAdminDetail?.organization === 'object' && selectedAdminDetail?.organization !== null && (
                                        <>
                                            <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Code</>}>{selectedAdminDetail.organization.code || 'N/A'}</InfoRow>
                                            <InfoRow label={<><Hash className="w-4 h-4 text-gray-400" /> Number</>}>{selectedAdminDetail.organization.organisationNumber || 'N/A'}</InfoRow>
                                            <InfoRow label={<><Mail className="w-4 h-4 text-gray-400" /> Email</>}>{selectedAdminDetail.organization.email || 'N/A'}</InfoRow>
                                            <InfoRow label={<><Phone className="w-4 h-4 text-gray-400" /> Phone</>}>{selectedAdminDetail.organization.phone ? `+91 ${selectedAdminDetail.organization.phone}` : 'N/A'}</InfoRow>
                                            <InfoRow label={<><MapPin className="w-4 h-4 text-gray-400" /> Address</>}>{selectedAdminDetail.organization.address || 'N/A'}</InfoRow>
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-5 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h3 className="text-sm font-semibold text-[#0A437A] mb-3 md:mb-4">Admin Summary</h3>
                        <div className="space-y-1">
                            <InfoRow label={<><User className="w-4 h-4 text-gray-400" /> Name</>}>{selectedAdminDetail?.name}</InfoRow>
                            <InfoRow label={<><Building2 className="w-4 h-4 text-gray-400 shrink-0" /> Organization</>}>{selectedAdminDetail?.organization?.name || selectedAdminDetail?.organization || 'N/A'}</InfoRow>
                            <InfoRow label={<><ToggleRight className="w-4 h-4 text-gray-400" /> Status</>}>
                                <span className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full ${selectedAdminDetail?.isActive ? 'bg-green-500' : 'bg-danger'} mr-2`}></span>
                                    {selectedAdminDetail?.isActive ? "Active" : "Inactive"}
                                </span>
                            </InfoRow>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AdminDetailView;
