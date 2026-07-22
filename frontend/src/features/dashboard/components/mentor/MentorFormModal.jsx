import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import { getOrganizations } from "@/services/organization.service";

export default function MentorFormModal({
  editingMentor,
  onClose,
  onSave,
}) {
  const isEdit = !!editingMentor;
  const role = useAuthStore((s) => s.user?.role);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    organizationId: ""
  });

  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingMentor) {
      setFormData({
        name: editingMentor.name || "",
        email: editingMentor.email || "",
        phone: editingMentor.phone || "",
        specialization: editingMentor.specialization || "",
        organizationId: editingMentor.organization?._id || editingMentor.organization || ""
      });
    }
  }, [editingMentor]);

  useEffect(() => {
    if (role === ROLES.SUPER_ADMIN) {
      setLoadingOrgs(true);
      getOrganizations({ limit: 100, status: 'Active' })
        .then(res => setOrganizations(res.data || []))
        .catch(err => console.error("Failed to load organizations", err))
        .finally(() => setLoadingOrgs(false));
    }
  }, [role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!isEdit && !formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (role === ROLES.SUPER_ADMIN && !isEdit && !formData.organizationId) {
        newErrors.organizationId = "Organization is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
       // Error is handled by parent, we just stop spinning
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium animate-in fade-in">{error}</p>;
  };

  return (
    <Modal
      bottomSheetOnMobile={true}
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit Mentor" : "Add New Mentor"}
      titleSize="text-lg"
      subtitle={isEdit ? "Edit the details of mentor" : "Fill in the details to add a new mentor"}
      maxWidth="max-w-xl"
      asForm
      onSubmit={handleSubmit}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#0A437A] text-white rounded-md text-xs font-medium hover:bg-[#0A437A]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isEdit ? "Save Changes" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full px-3 py-2 bg-gray-50/50 border rounded-lg text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A]'}`}
            />
            <ErrorMessage error={errors.name} />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email {isEdit ? "" : <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              className={`w-full px-3 py-2 bg-gray-50/50 border rounded-lg text-sm focus:outline-none transition-colors ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A]'}`}
            />
            {isEdit && <p className="text-[10px] text-gray-500 mt-1">Leave empty to keep existing email.</p>}
            <ErrorMessage error={errors.email} />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className={`w-full px-3 py-2 bg-gray-50/50 border rounded-lg text-sm focus:outline-none transition-colors ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A]'}`}
            />
            <ErrorMessage error={errors.phone} />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A] transition-colors"
            />
            <ErrorMessage error={errors.specialization} />
          </div>

          {!isEdit && role === ROLES.SUPER_ADMIN && (
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Organization <span className="text-red-500">*</span>
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                disabled={loadingOrgs}
                className={`w-full px-3 py-2 bg-gray-50/50 border rounded-lg text-sm focus:outline-none transition-colors ${errors.organizationId ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0A437A] focus:ring-1 focus:ring-[#0A437A]'}`}
              >
                <option value="">{loadingOrgs ? 'Loading...' : 'Select Organization'}</option>
                {organizations.map(org => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
              </select>
              <ErrorMessage error={errors.organizationId} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
