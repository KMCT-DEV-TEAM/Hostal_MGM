import { ROLES } from '@/constants/roles';

export const STUDENT_ACTION_PERMISSIONS = {
  [ROLES.ADMIN]: { canEdit: true, canDelete: true, canCreate: true },
  [ROLES.SUPER_ADMIN]: { canEdit: true, canDelete: true, canCreate: true },
  [ROLES.WARDEN]: { canEdit: true, canDelete: false, canCreate: false },
};

export function getStudentPermissions(role) {
  return STUDENT_ACTION_PERMISSIONS[role] ?? { canEdit: false, canDelete: false, canCreate: false };
}
