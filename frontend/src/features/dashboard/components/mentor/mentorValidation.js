import { ROLES } from "@/constants/roles";

export const validateMentorForm = (formData, { isEdit, role, orgId }) => {
    const errors = {};

    if (!formData.name?.trim()) {
        errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name)) {
        errors.name = "Name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (!isEdit && !formData.email?.trim()) {
        errors.email = "Email is required";
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Invalid email format";
    }

    if (!formData.phone?.trim()) {
        errors.phone = "Phone is required";
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone)) {
        errors.phone = "Phone must contain 10 digits";
    }

    if (role === ROLES.SUPER_ADMIN && !isEdit && !orgId && !formData.organizationId) {
        errors.organizationId = "Organization is required";
    }

    return errors;
};
