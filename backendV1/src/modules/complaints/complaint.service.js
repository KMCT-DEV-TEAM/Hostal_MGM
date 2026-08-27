import { prisma } from '../../config/prisma.js';

export const STATUS_ENUM_TO_DISPLAY = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  AWAITING: 'Awaiting',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
  INCOMPLETE: 'Incomplete'
};

export const STATUS_DISPLAY_TO_ENUM = {
  Pending: 'PENDING',
  pending: 'PENDING',
  PENDING: 'PENDING',
  'In progress': 'IN_PROGRESS',
  'In Progress': 'IN_PROGRESS',
  in_progress: 'IN_PROGRESS',
  IN_PROGRESS: 'IN_PROGRESS',
  Awaiting: 'AWAITING',
  awaiting: 'AWAITING',
  AWAITING: 'AWAITING',
  Resolved: 'RESOLVED',
  resolved: 'RESOLVED',
  RESOLVED: 'RESOLVED',
  Rejected: 'REJECTED',
  rejected: 'REJECTED',
  REJECTED: 'REJECTED',
  Incomplete: 'INCOMPLETE',
  incomplete: 'INCOMPLETE',
  INCOMPLETE: 'INCOMPLETE'
};

export const PRIORITY_MAP = {
  Low: 'LOW',
  low: 'LOW',
  LOW: 'LOW',
  Medium: 'MEDIUM',
  medium: 'MEDIUM',
  MEDIUM: 'MEDIUM',
  High: 'HIGH',
  high: 'HIGH',
  HIGH: 'HIGH'
};

export const PRIORITY_ENUM_TO_DISPLAY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

export const formatComplaint = (c) => {
  if (!c) return null;

  const status = STATUS_ENUM_TO_DISPLAY[c.status] || c.status;
  const priority = PRIORITY_ENUM_TO_DISPLAY[c.priority] || c.priority;

  const timeline = (c.timelines || []).map(t => ({
    status: STATUS_ENUM_TO_DISPLAY[t.status] || t.status,
    message: t.message,
    by: t.by,
    date: t.createdAt
  }));

  const internalNotes = (c.internalNotes || []).map(n => ({
    note: n.note,
    addedBy: n.addedBy,
    role: n.role,
    date: n.createdAt
  }));

  let studentData = null;
  if (c.student) {
    studentData = {
      _id: c.student.id,
      id: c.student.id,
      name: c.student.name || c.student.fullName,
      studentId: c.student.admissionNo || c.student.studentCode,
      roomNo: c.roomNo
    };
  }

  let hostelData = null;
  if (c.hostel) {
    const wardens = (c.hostel.wardens || c.hostel.hostelWardens || []).map(hw => ({
      _id: hw.user?.id,
      id: hw.user?.id,
      name: hw.user?.name || hw.user?.fullName
    }));

    hostelData = {
      _id: c.hostel.id,
      id: c.hostel.id,
      name: c.hostel.name,
      wardens
    };
  }

  let categoryData = null;
  if (c.category) {
    categoryData = {
      _id: c.category.id,
      id: c.category.id,
      name: c.category.name
    };
  }

  let organizationData = null;
  if (c.organization) {
    organizationData = {
      _id: c.organization.id,
      id: c.organization.id,
      name: c.organization.name
    };
  }

  let assignedStaffData = null;
  if (c.assignedStaff) {
    assignedStaffData = {
      _id: c.assignedStaff.id,
      id: c.assignedStaff.id,
      name: c.assignedStaff.name || c.assignedStaff.fullName,
      phone: c.assignedStaff.phone,
      email: c.assignedStaff.email,
      specialization: c.assignedStaff.settings?.specialization || ''
    };
  }

  return {
    _id: c.id,
    id: c.id,
    studentId: studentData || c.studentId,
    hostelId: hostelData || c.hostelId,
    organizationId: organizationData || c.organizationId,
    category: categoryData || c.categoryId,
    roomNo: c.roomNo,
    subject: c.subject,
    description: c.description || '',
    status,
    priority,
    assignedStaff: assignedStaffData || c.assignedStaffId,
    materialsUsed: c.materialsUsed || '',
    resolutionNotes: c.resolutionNotes || '',
    internalNotes,
    timeline,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
};

export const complaintInclude = {
  category: true,
  student: true,
  hostel: {
    include: {
      wardens: {
        include: {
          user: true
        }
      }
    }
  },
  organization: true,
  assignedStaff: true,
  timelines: {
    orderBy: { createdAt: 'asc' }
  },
  internalNotes: {
    orderBy: { createdAt: 'asc' }
  }
};

// Create a new complaint
export const createComplaintDb = async (complaintData, user) => {
  const student = await prisma.student.findUnique({
    where: { id: user.id },
    include: {
      studentHostels: {
        where: { status: 'active' },
        include: { hostel: true }
      }
    }
  });

  if (!student) {
    throw new Error('Student record not found for the logged-in user.');
  }

  const activeAllocation = student.studentHostels?.[0];
  if (!activeAllocation || !activeAllocation.hostel) {
    throw new Error('Student is not actively assigned to any hostel.');
  }

  const hostelId = activeAllocation.hostel.id;
  const organizationId = student.organizationId || activeAllocation.organizationId || activeAllocation.hostel?.organizationId;
  const roomNo = activeAllocation.roomNumber || student.roomNo || 'N/A';

  const priorityEnum = PRIORITY_MAP[complaintData.priority] || 'MEDIUM';

  const newComplaint = await prisma.$transaction(async (tx) => {
    const created = await tx.complaint.create({
      data: {
        studentId: student.id,
        hostelId,
        organizationId,
        categoryId: complaintData.category,
        roomNo,
        subject: complaintData.subject,
        description: complaintData.description || null,
        status: 'PENDING',
        priority: priorityEnum
      }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId: created.id,
        status: 'PENDING',
        message: `${student.name || student.fullName || 'Student'} registered complaint`,
        by: 'Student'
      }
    });

    return created;
  });

  const fullComplaint = await prisma.complaint.findUnique({
    where: { id: newComplaint.id },
    include: complaintInclude
  });

  return formatComplaint(fullComplaint);
};

// Get complaints for a specific student
export const getStudentComplaintsDb = async (userId, type = 'all', pagination = null) => {
  const student = await prisma.student.findUnique({ where: { id: userId } });
  if (!student) throw new Error('Student not found.');

  const where = {
    studentId: student.id,
    deletedAt: null
  };

  if (type === 'history') {
    where.status = { in: ['RESOLVED', 'REJECTED', 'INCOMPLETE'] };
  } else if (type === 'current' || type === 'active') {
    where.status = { notIn: ['RESOLVED', 'REJECTED', 'INCOMPLETE'] };
  }

  const [total, resolved, pending] = await Promise.all([
    prisma.complaint.count({ where: { studentId: student.id, deletedAt: null } }),
    prisma.complaint.count({
      where: {
        studentId: student.id,
        status: { in: ['RESOLVED', 'REJECTED'] },
        deletedAt: null
      }
    }),
    prisma.complaint.count({
      where: {
        studentId: student.id,
        status: { notIn: ['RESOLVED', 'REJECTED'] },
        deletedAt: null
      }
    })
  ]);

  const stats = { total, resolved, pending };

  const queryArgs = {
    where,
    include: complaintInclude,
    orderBy: { createdAt: 'desc' }
  };

  if (pagination) {
    queryArgs.skip = pagination.skip;
    queryArgs.take = pagination.limit;
  }

  const rawComplaints = await prisma.complaint.findMany(queryArgs);
  const complaints = rawComplaints.map(formatComplaint);

  if (pagination) {
    const totalCount = await prisma.complaint.count({ where });
    return {
      complaints,
      stats,
      pagination: {
        total: totalCount,
        page: pagination.page,
        totalPages: Math.ceil(totalCount / pagination.limit),
        hasMore: pagination.skip + complaints.length < totalCount
      }
    };
  }

  return { complaints, stats };
};

// Update complaint
export const updateComplaintDb = async (complaintId, user, updateData) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { student: true }
  });

  if (!complaint || complaint.deletedAt) {
    throw new Error('Complaint not found.');
  }

  if (user.role === 'student') {
    if (complaint.studentId !== user.id) {
      throw new Error('You do not have permission to update this complaint.');
    }
    if (complaint.status !== 'PENDING') {
      throw new Error('You can only edit pending complaints.');
    }
  } else if (!['admin', 'warden', 'super_admin'].includes(user.role.toLowerCase())) {
    throw new Error('You do not have permission to update this complaint.');
  }

  const dataToUpdate = {};
  if (updateData.category) dataToUpdate.categoryId = updateData.category;
  if (updateData.roomNo) dataToUpdate.roomNo = updateData.roomNo;
  if (updateData.subject) dataToUpdate.subject = updateData.subject;
  if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
  if (updateData.priority) {
    dataToUpdate.priority = PRIORITY_MAP[updateData.priority] || 'MEDIUM';
  }

  let updaterName = 'User';
  if (user.role === 'student') {
    const s = await prisma.student.findUnique({ where: { id: user.id } });
    if (s) updaterName = s.name || s.fullName || 'Student';
  } else {
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (u) updaterName = u.name || u.fullName || 'User';
  }

  const byRole = user.role === 'student' ? 'Student' : (user.role.toLowerCase() === 'warden' ? 'Warden' : 'Admin');

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: dataToUpdate
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: complaint.status,
        message: `Complaint details updated by ${updaterName}`,
        by: byRole
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Delete complaint
export const deleteComplaintDb = async (complaintId, studentId) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId }
  });

  if (!complaint || complaint.deletedAt) {
    throw new Error('Complaint not found.');
  }

  if (complaint.studentId !== studentId) {
    throw new Error('You do not have permission to delete this complaint.');
  }

  if (complaint.status !== 'PENDING') {
    throw new Error('You can only withdraw pending complaints.');
  }

  return await prisma.complaint.delete({
    where: { id: complaintId }
  });
};

// Get all complaints for admins/wardens
export const getAllComplaintsDb = async (query = {}, pagination = null) => {
  const where = { deletedAt: null };

  if (query.organizationId) where.organizationId = query.organizationId;
  if (query.hostelId) {
    if (query.hostelId.$in) {
      where.hostelId = { in: query.hostelId.$in };
    } else {
      where.hostelId = query.hostelId;
    }
  }

  if (query.status) {
    if (typeof query.status === 'string') {
      if (query.status.includes(',')) {
        const statuses = query.status.split(',').map(s => STATUS_DISPLAY_TO_ENUM[s.trim()] || s.trim().toUpperCase());
        where.status = { in: statuses };
      } else {
        const enumStatus = STATUS_DISPLAY_TO_ENUM[query.status] || query.status.toUpperCase();
        where.status = enumStatus;
      }
    } else if (Array.isArray(query.status)) {
      const statuses = query.status.map(s => STATUS_DISPLAY_TO_ENUM[s] || s.toUpperCase());
      where.status = { in: statuses };
    }
  }

  if (query.assignedStaff) where.assignedStaffId = query.assignedStaff;
  if (query._id !== undefined) {
    if (query._id === null) {
      return pagination ? { data: [], pagination: { total: 0, page: 1, totalPages: 0, hasMore: false } } : [];
    }
    where.id = query._id;
  }

  const queryArgs = {
    where,
    include: complaintInclude,
    orderBy: { createdAt: 'desc' }
  };

  if (pagination) {
    queryArgs.skip = pagination.skip;
    queryArgs.take = pagination.limit;
  }

  const [rawComplaints, totalCount] = await Promise.all([
    prisma.complaint.findMany(queryArgs),
    prisma.complaint.count({ where })
  ]);

  const data = rawComplaints.map(formatComplaint);

  if (pagination) {
    return {
      data,
      pagination: {
        total: totalCount,
        page: pagination.page,
        totalPages: Math.ceil(totalCount / pagination.limit),
        hasMore: pagination.skip + data.length < totalCount
      }
    };
  }

  return data;
};

// Get complaint summary by category and status
export const getComplaintSummaryDb = async (query = {}) => {
  const where = { deletedAt: null };
  if (query.organizationId) where.organizationId = query.organizationId;
  if (query.hostelId) {
    if (query.hostelId.$in) {
      where.hostelId = { in: query.hostelId.$in };
    } else {
      where.hostelId = query.hostelId;
    }
  }

  const [totalCount, categoriesGroup, statusGroup, allCategories] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.groupBy({
      by: ['categoryId'],
      where,
      _count: { id: true }
    }),
    prisma.complaint.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    }),
    prisma.complaintCategory.findMany({
      where: { deletedAt: null }
    })
  ]);

  const categoryNameMap = {};
  allCategories.forEach(c => {
    categoryNameMap[c.id] = c.name;
  });

  const categories = categoriesGroup
    .map(g => ({
      name: categoryNameMap[g.categoryId] || 'Unknown',
      count: g._count.id
    }))
    .sort((a, b) => b.count - a.count);

  const allStatuses = ['Pending', 'In progress', 'Awaiting', 'Resolved', 'Rejected', 'Incomplete'];
  const statusCountMap = {};
  statusGroup.forEach(g => {
    const displayStatus = STATUS_ENUM_TO_DISPLAY[g.status] || g.status;
    statusCountMap[displayStatus] = g._count.id;
  });

  const statuses = allStatuses.map(status => ({
    name: status,
    count: statusCountMap[status] || 0
  })).sort((a, b) => b.count - a.count);

  return {
    total: totalCount,
    categories,
    statuses
  };
};

// Update complaint status
export const updateComplaintStatusDb = async (complaintId, newStatusDisplay, userRole, message) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId }
  });

  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  const statusEnum = STATUS_DISPLAY_TO_ENUM[newStatusDisplay] || newStatusDisplay.toUpperCase();

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: { status: statusEnum }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: statusEnum,
        message: message || `Status updated to ${newStatusDisplay}`,
        by: userRole || 'Admin'
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Assign staff to complaint
export const assignStaffToComplaintDb = async (complaintId, staffId, userRole) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  const staff = await prisma.user.findUnique({ where: { id: staffId } });
  if (!staff) throw new Error('Staff member not found.');

  const roleName = staff.role === 'WARDEN' ? 'Warden' : 'maintenance user';

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        assignedStaffId: staffId,
        status: 'IN_PROGRESS'
      }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: 'IN_PROGRESS',
        message: `Admin assigned to this ${roleName} ${staff.name || staff.fullName || 'Staff'}`,
        by: userRole || 'Admin'
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Maintenance staff or Warden submits resolution
export const submitComplaintResolutionDb = async (complaintId, staffId, materialsUsed, resolutionNotes) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  if (complaint.assignedStaffId !== staffId) {
    throw new Error('You are not assigned to this complaint.');
  }

  const staff = await prisma.user.findUnique({ where: { id: staffId } });
  const isWarden = staff?.role === 'WARDEN';

  const newStatus = isWarden ? 'RESOLVED' : 'AWAITING';

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: newStatus,
        materialsUsed: materialsUsed || null,
        resolutionNotes: resolutionNotes || null
      }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: newStatus,
        message: isWarden
          ? 'Warden submitted resolution and resolved the complaint directly.'
          : 'Maintenance staff submitted resolution and is awaiting approval.',
        by: isWarden ? 'Warden' : 'Maintenance Staff'
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Warden approves resolution
export const approveComplaintResolutionDb = async (complaintId, userRole) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  if (complaint.status !== 'AWAITING') {
    throw new Error('Complaint is not awaiting approval.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: { status: 'RESOLVED' }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: 'RESOLVED',
        message: 'Resolution approved and complaint marked as resolved.',
        by: userRole || 'Warden'
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Warden rejects resolution
export const rejectComplaintResolutionDb = async (complaintId, userRole, rejectNote) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  if (complaint.status !== 'AWAITING') {
    throw new Error('Complaint is not awaiting approval.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: { status: 'IN_PROGRESS' }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: 'IN_PROGRESS',
        message: `Resolution rejected. Note: ${rejectNote || ''}`,
        by: userRole || 'Warden'
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Assigned staff rejects the task
export const rejectAssignedTaskDb = async (complaintId, staffId, rejectNote) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  if (complaint.assignedStaffId !== staffId) {
    throw new Error('You are not assigned to this complaint.');
  }

  const staff = await prisma.user.findUnique({ where: { id: staffId } });
  const isWarden = staff?.role === 'WARDEN';

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: { status: 'REJECTED' }
    });

    await tx.complaintTimeline.create({
      data: {
        complaintId,
        status: 'REJECTED',
        message: `Assigned task rejected by ${isWarden ? 'Warden' : 'maintenance staff'}. Note: ${rejectNote || ''}`,
        by: isWarden ? 'Warden' : 'Maintenance Staff'
      }
    });
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

// Add internal note to a complaint
export const addInternalNoteDb = async (complaintId, userRole, addedBy, noteText) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.deletedAt) throw new Error('Complaint not found.');

  await prisma.complaintInternalNote.create({
    data: {
      complaintId,
      note: noteText,
      addedBy,
      role: userRole
    }
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude
  });

  return formatComplaint(updated);
};

const _addContextToComplaints = async (studentId, allocationId, actor, actionType) => {
  const marker = `[Allocation: ${allocationId}]`;
  const noteText = actionType === 'transferred'
    ? `${marker} Student transferred to another hostel. Complaint remains associated with the original room for maintenance follow-up.`
    : `${marker} Student vacated the hostel. Complaint remains associated with the original room for maintenance follow-up.`;

  const activeComplaints = await prisma.complaint.findMany({
    where: {
      studentId,
      status: { in: ['PENDING', 'IN_PROGRESS', 'AWAITING'] },
      deletedAt: null
    }
  });

  for (const comp of activeComplaints) {
    const existingNote = await prisma.complaintInternalNote.findFirst({
      where: {
        complaintId: comp.id,
        note: { contains: marker }
      }
    });

    if (!existingNote) {
      await prisma.complaintInternalNote.create({
        data: {
          complaintId: comp.id,
          note: noteText,
          addedBy: actor.name || actor.email || actor.id || 'System',
          role: actor.role || 'system'
        }
      });
    }
  }
};

export const addHostelTransferContextToComplaints = async (studentId, allocationId, actor) => {
  return _addContextToComplaints(studentId, allocationId, actor, 'transferred');
};

export const addHostelVacateContextToComplaints = async (studentId, allocationId, actor) => {
  return _addContextToComplaints(studentId, allocationId, actor, 'vacated');
};
