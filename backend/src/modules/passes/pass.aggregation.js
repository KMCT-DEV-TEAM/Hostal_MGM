import mongoose from "mongoose";

// --- Filters & Matchers ---

export const buildDateRangeFilter = (filter, field, startDate, endDate) => {
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      filter[field].$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
};

export const buildStatusFilter = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.passType) filter.passType = query.passType;
  if (query.outPassCategory) filter.outPassCategory = query.outPassCategory;
  if (query.returnStatus) filter["returnTracking.returnStatus"] = query.returnStatus;
  return filter;
};

// --- Projection Builders ---

export const buildStudentPassProjection = () => ({
  _id: 1,
  passType: 1,
  outPassCategory: 1,
  status: 1,
  reason: 1,
  fromDate: 1,
  toDate: 1,
  date: 1,
  outTime: 1,
  expectedReturnTime: 1,
  createdAt: 1,
  returnTracking: { returnStatus: 1 },
  studentInfo: {
    _id: "$studentInfo._id",
    name: "$studentInfo.name",
    admissionNo: "$studentInfo.admissionNo",
    roomNo: "$studentInfo.roomNo"
  }
});

// --- Pipeline Builders ---

export const buildPaginationFacet = (skip, limit, projectStage) => ({
  $facet: {
    metadata: [{ $count: "totalRecords" }],
    data: [
      { $skip: skip },
      { $limit: limit },
      { $project: projectStage }
    ]
  }
});

export const buildSearchMatch = (searchStr, fields) => {
  if (!searchStr) return null;
  const searchRegex = new RegExp(searchStr, "i");
  return {
    $match: {
      $or: fields.map(field => ({ [field]: searchRegex }))
    }
  };
};

export const formatPaginationResponse = (stats, page, limit) => {
  const totalRecords = stats[0]?.metadata[0]?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / limit);
  return {
    passes: stats[0]?.data || [],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

// --- Dashboard Builders ---

export const buildDashboardStatsFacet = (startOfToday, endOfToday) => ({
  $facet: {
    totalRequests: [{ $count: "count" }],
    pendingParent: [{ $match: { status: "pending_parent" } }, { $count: "count" }],
    pendingWarden: [{ $match: { status: "pending_warden" } }, { $count: "count" }],
    approved: [{ $match: { status: "approved" } }, { $count: "count" }],
    rejected: [{ $match: { status: "rejected" } }, { $count: "count" }],
    cancelled: [{ $match: { status: "cancelled" } }, { $count: "count" }],
    studentsOutside: [{ $match: { status: "approved", "returnTracking.returnStatus": "left" } }, { $count: "count" }],
    returnedToday: [{ $match: { "returnTracking.returnedAt": { $gte: startOfToday, $lte: endOfToday } } }, { $count: "count" }],
    homePassCount: [{ $match: { passType: "home_pass" } }, { $count: "count" }],
    outPassCount: [{ $match: { passType: "out_pass" } }, { $count: "count" }],
    inHouseCount: [{ $match: { passType: "out_pass", outPassCategory: "in_house" } }, { $count: "count" }],
    outHouseCount: [{ $match: { passType: "out_pass", outPassCategory: "out_house" } }, { $count: "count" }],
  }
});

export const parseDashboardStatsFacet = (facetResult) => {
  const result = facetResult[0];
  return {
    totalRequests: result.totalRequests[0]?.count || 0,
    pendingParent: result.pendingParent[0]?.count || 0,
    pendingWarden: result.pendingWarden[0]?.count || 0,
    approved: result.approved[0]?.count || 0,
    rejected: result.rejected[0]?.count || 0,
    cancelled: result.cancelled[0]?.count || 0,
    studentsOutside: result.studentsOutside[0]?.count || 0,
    returnedToday: result.returnedToday[0]?.count || 0,
    homePassCount: result.homePassCount[0]?.count || 0,
    outPassCount: result.outPassCount[0]?.count || 0,
    inHouseCount: result.inHouseCount[0]?.count || 0,
    outHouseCount: result.outHouseCount[0]?.count || 0,
  };
};
