import { ROLES } from '@/constants/roles';

export const PARENT_ACTION_PERMISSIONS = {
  [ROLES.ADMIN]: { canEdit: true, canDelete: true, canCreate: true },
  [ROLES.SUPER_ADMIN]: { canEdit: true, canDelete: true, canCreate: true },
  [ROLES.WARDEN]: { canEdit: false, canDelete: false, canCreate: false },
  [ROLES.ASSISTANT_WARDEN]: { canEdit: false, canDelete: false, canCreate: false },
};

export function getParentPermissions(role) {
  return PARENT_ACTION_PERMISSIONS[role] ?? { canEdit: false, canDelete: false, canCreate: false };
}
