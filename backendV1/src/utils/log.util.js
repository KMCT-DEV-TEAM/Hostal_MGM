/**
 * Global Logging Utility — createLog & createAuditLog
 *
 * Implements strict role- and module-based priority resolution:
 *
 * ┌───────────────────────────┬──────────────────────────────────────────────────────────────────────┐
 * │ Actor Role                │ Priority Rules                                                       │
 * ├───────────────────────────┼──────────────────────────────────────────────────────────────────────┤
 * │ Super Admin & Admin       │ HIGH   → User & Identity Mgmt, Student Mgmt                          │
 * │                           │ MEDIUM → Org Mgmt, Hostel Mgmt, Academic Struct, Parent Mgmt, etc.   │
 * ├───────────────────────────┼──────────────────────────────────────────────────────────────────────┤
 * │ Warden & Assistant Warden │ HIGH   → Pass Processing, Visitor Actions, Attendance Correction     │
 * │                           │ MEDIUM → Warden Assign/Removal, Student Hostel Ops, Complaints, etc. │
 * ├───────────────────────────┼──────────────────────────────────────────────────────────────────────┤
 * │ Maintenance Staff         │ MEDIUM (all activities)                                              │
 * ├───────────────────────────┼──────────────────────────────────────────────────────────────────────┤
 * │ Mentor                    │ HIGH   → Pass Management                                             │
 * │                           │ MEDIUM → Complaint Management, Attendance Management, others         │
 * ├───────────────────────────┼──────────────────────────────────────────────────────────────────────┤
 * │ Student                   │ HIGH   → Pass Request / Cancellation / Changes, Profile Activities   │
 * │                           │ MEDIUM → Complaint Creation / Updates, Other Student Activities      │
 * ├───────────────────────────┼──────────────────────────────────────────────────────────────────────┤
 * │ Parent                    │ LOW    (all activities)                                              │
 * └───────────────────────────┴──────────────────────────────────────────────────────────────────────┘
 */

import { prisma } from '../config/prisma.js';

/**
 * Normalises an entity type token for lookup.
 */
const normaliseEntity = (entityType) =>
  (entityType || '').toLowerCase().replace(/[^a-z]/g, '');

const PRIORITY_MATRIX = {
  // Super Admin & Admin
  super_admin: {
    high: new Set(['user', 'auth', 'password', 'passwordrequest', 'identity', 'role', 'student', 'studentmanagement']),
    default: 'MEDIUM',
  },
  admin: {
    high: new Set(['user', 'auth', 'password', 'passwordrequest', 'identity', 'role', 'student', 'studentmanagement']),
    default: 'MEDIUM',
  },
  // Warden & Assistant Warden
  warden: {
    high: new Set([
      'pass', 'passapproval', 'passgatelog', 'leave',
      'visitor', 'visit', 'visitrequest', 'visitorvisit', 'visitorchangelog',
      'attendancecorrection', 'attendancerecord', 'attendance',
    ]),
    default: 'MEDIUM',
  },
  assistant_warden: {
    high: new Set([
      'pass', 'passapproval', 'passgatelog', 'leave',
      'visitor', 'visit', 'visitrequest', 'visitorvisit', 'visitorchangelog',
      'attendancecorrection', 'attendancerecord', 'attendance',
    ]),
    default: 'MEDIUM',
  },
  // Maintenance Staff
  maintenance_staff: {
    high: new Set(),
    default: 'MEDIUM',
  },
  // Mentor
  mentor: {
    high: new Set(['pass', 'leave']),
    default: 'MEDIUM',
  },
  // Student
  student: {
    high: new Set(['pass', 'leave', 'profile', 'user', 'studentprofile']),
    default: 'MEDIUM',
  },
  // Parent
  parent: {
    high: new Set(),
    default: 'LOW',
  },
};

const ROLE_ALIASES = {
  superadmin: 'super_admin',
  super_admin: 'super_admin',
  admin: 'admin',
  warden: 'warden',
  assistantwarden: 'assistant_warden',
  assistant_warden: 'assistant_warden',
  maintenancestaff: 'maintenance_staff',
  maintenance_staff: 'maintenance_staff',
  maintenance: 'maintenance_staff',
  mentor: 'mentor',
  student: 'student',
  parent: 'parent',
};

/**
 * Resolves the LogPriority ('HIGH' | 'MEDIUM' | 'LOW') given the role and entityType.
 */
export const resolvePriority = (role, entityType) => {
  const normRole = (role || '').toLowerCase().replace(/[^a-z_]/g, '');
  const canonicalRole = ROLE_ALIASES[normRole] || normRole;
  const config = PRIORITY_MATRIX[canonicalRole];

  if (!config) {
    return 'MEDIUM';
  }

  const normEntity = normaliseEntity(entityType);
  if (config.high.has(normEntity)) {
    return 'HIGH';
  }

  return config.default;
};

/**
 * Extracts context (userId, userRole, organizationId, ipAddress) from req or user object.
 */
const resolveUserContext = (reqOrUser) => {
  if (!reqOrUser) {
    return { userId: null, userRole: null, organizationId: null, ipAddress: null };
  }

  // Express Request object
  if (reqOrUser.user || reqOrUser.headers || reqOrUser.ip) {
    const user = reqOrUser.user || {};
    const ipAddress =
      reqOrUser.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      reqOrUser.socket?.remoteAddress ||
      reqOrUser.ip ||
      null;

    const userAgent = reqOrUser.headers?.['user-agent'] || null;

    const orgId =
      user.organizationId ||
      user.organization?.id ||
      user.organization ||
      reqOrUser.headers?.['x-organization-id'] ||
      reqOrUser.body?.organizationId ||
      reqOrUser.params?.organizationId ||
      null;

    return {
      userId: user.id || null,
      userRole: user.role || null,
      organizationId: orgId,
      ipAddress,
      userAgent,
    };
  }

  // Plain user object
  return {
    userId: reqOrUser.id || reqOrUser.userId || null,
    userRole: reqOrUser.role || reqOrUser.userRole || null,
    organizationId: reqOrUser.organizationId || reqOrUser.organization?.id || reqOrUser.organization || null,
    ipAddress: reqOrUser.ipAddress || null,
    userAgent: reqOrUser.userAgent || null,
  };
};

/**
 * Global createLog function
 *
 * @param {object} reqOrUser - Express req or user context object
 * @param {string} action - Action name (e.g. "Created Admin", "Approved Pass")
 * @param {string} entityType - Entity module (e.g. "User", "Pass", "AttendanceRecord")
 * @param {string|null} [entityId] - Target entity UUID
 * @param {string} [details] - Detailed log description
 * @param {string} [status] - "success" | "error" | "warning"
 * @param {object} [tx] - Optional Prisma transaction
 * @param {object} [extraOptions] - Additional options: { oldData, newData, organizationId, ipAddress, priority }
 */
export const createLog = async (
  reqOrUser,
  action,
  entityType,
  entityId = null,
  details = '',
  status = 'success',
  tx = null,
  extraOptions = {}
) => {
  try {
    const db = tx || prisma;
    const { userId, userRole, organizationId, ipAddress, userAgent } = resolveUserContext(reqOrUser);

    const normalizedStatus =
      status?.toLowerCase() === 'error' ? 'ERROR' :
      status?.toLowerCase() === 'warning' ? 'WARNING' :
      'SUCCESS';

    const priority = extraOptions.priority || resolvePriority(userRole, entityType);
    const resolvedOrgId = extraOptions.organizationId || organizationId || null;

    // Check if user is a staff User model (User table) for relational integrity
    const canonicalRole = userRole ? (ROLE_ALIASES[userRole.toLowerCase().replace(/[^a-z_]/g, '')] ?? userRole) : '';
    const isStaffUser = ['super_admin', 'admin', 'warden', 'assistant_warden', 'maintenance_staff', 'mentor'].includes(canonicalRole);
    const validUserId = isStaffUser ? userId : null;

    // Merge system info into newData for deeper tracking
    let mergedNewData = extraOptions.newData ? { ...extraOptions.newData } : null;
    if (userAgent) {
      if (!mergedNewData || typeof mergedNewData !== 'object' || Array.isArray(mergedNewData)) {
        mergedNewData = { _originalData: mergedNewData };
      }
      mergedNewData._systemInfo = { userAgent };
    }

    // 1. AuditLog
    try {
      await db.auditLog.create({
        data: {
          action: action || 'Action',
          module: entityType || 'System',
          entityId: entityId || null,
          userId: validUserId,
          organizationId: resolvedOrgId,
          oldData: extraOptions.oldData || null,
          newData: mergedNewData,
          ipAddress: extraOptions.ipAddress || ipAddress || null,
          priority,
        },
      });
    } catch (auditErr) {
      console.error('[createLog] AuditLog write error:', auditErr.message);
    }

    // 2. ActivityLog (if userId is valid user)
    if (validUserId) {
      try {
        await db.activityLog.create({
          data: {
            action: action || 'Action',
            entityType: entityType || 'System',
            entityId: entityId || null,
            userId: validUserId,
            userRole: userRole || 'unknown',
            details: details || action || '',
            status: normalizedStatus,
            priority,
            ipAddress: extraOptions.ipAddress || ipAddress || null,
            userAgent: userAgent || null,
          },
        });
      } catch (actErr) {
        console.error('[createLog] ActivityLog write error:', actErr.message);
      }
    }
  } catch (err) {
    // Never allow logging failures to break HTTP responses
    console.error('[createLog] Unexpected error:', err.message);
  }
};

/**
 * Convenience wrapper for audit logs with oldData/newData
 */
export const createAuditLog = async (
  reqOrUser,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  details = '',
  tx = null
) => {
  return createLog(
    reqOrUser,
    action,
    entityType,
    entityId,
    details || `${action} — data updated`,
    'success',
    tx,
    { oldData, newData }
  );
};
