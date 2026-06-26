import mongoose from "mongoose";
import Hostel from "./hostel.model.js";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";

const checkExistingHostelCodeDb = async (code) => {
  return await Hostel.findOne({ code });
};

const checkExistingHostelEmailDb = async (email) => {
  return await Hostel.findOne({ email });
};

const createHostelDb = async (data) => {
  const hostel = new Hostel(data);
  return await hostel.save();
};

const getHostelsDb = async (organizationId) => {
  const query = organizationId ? { organizations: organizationId } : {};
  const hostels = await Hostel.find(query)
    .populate("wardens", "name email")
    .populate("adminId", "name email")
    .populate("organizations", "name code")
    .lean({ virtuals: true });

  const hostelsWithCounts = await Promise.all(
    hostels.map(async (hostel) => {
      const studentsCount = await Student.countDocuments({ hostelId: hostel._id });
      return { ...hostel, studentsCount };
    })
  );

  return hostelsWithCounts;
};

const getPaginatedHostelsDb = async (page = 1, limit = 10, search = "", status = "") => {
  const skip = (page - 1) * limit;
  const query = {};

  if (status && status !== "All") {
    query.isActive = status === "Active";
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const [hostels, totalCount] = await Promise.all([
    Hostel.find(query)
      .populate("wardens", "name email")
      .populate("adminId", "name email")
      .populate("organizations", "name code")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean({ virtuals: true }),
    Hostel.countDocuments(query),
  ]);

  const hostelsWithCounts = await Promise.all(
    hostels.map(async (hostel) => {
      const studentsCount = await Student.countDocuments({ hostelId: hostel._id });
      return { ...hostel, studentsCount };
    })
  );

  return { hostels: hostelsWithCounts, totalCount };
};

const getHostelByIdDb = async (id, organizationId) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizations = organizationId;
  }
  const hostel = await Hostel.findOne(query)
    .populate("wardens", "name email")
    .populate("adminId", "name email")
    .populate("organizations", "name code")
    .lean({ virtuals: true });

  if (hostel) {
    hostel.studentsCount = await Student.countDocuments({ hostelId: hostel._id });
  }

  return hostel;
};

const updateHostelDb = async (id, organizationId, updateData) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizations = organizationId;
  }
  return await Hostel.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
};

const syncHostelStatus = async (hostelIds, isActive) => {
  const hostels = await Hostel.find({ _id: { $in: hostelIds } }).select("wardens");
  let wardenIds = [];
  hostels.forEach((h) => {
    if (h.wardens && h.wardens.length > 0) {
      wardenIds.push(...h.wardens);
    }
  });

  if (wardenIds.length > 0) {
    await User.updateMany({ _id: { $in: wardenIds } }, { isActive });
  }
};

const toggleHostelStatusDb = async (id, organizationId) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizations = organizationId;
  }

  const hostel = await Hostel.findOne(query);
  if (!hostel) return null;

  hostel.isActive = !hostel.isActive;
  await hostel.save();

  await syncHostelStatus([hostel._id], hostel.isActive);

  return hostel;
};

const bulkUpdateHostelStatusDb = async (ids, isActive, organizationId) => {
  try {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const query = { _id: { $in: objectIds } };
    if (organizationId) {
      query.organizations = organizationId;
    }
    const result = await Hostel.updateMany(query, { $set: { isActive } });

    // Find the affected hostels to sync wardens
    const affectedHostels = await Hostel.find(query).select("_id");
    const affectedIds = affectedHostels.map(h => h._id);
    if (affectedIds.length > 0) {
      await syncHostelStatus(affectedIds, isActive);
    }

    console.log("bulkUpdateHostelStatusDb inside service result:", result);
    return result;
  } catch (error) {
    console.error("bulkUpdateHostelStatusDb error:", error);
    throw error;
  }
};

export {
  checkExistingHostelCodeDb,
  checkExistingHostelEmailDb,
  createHostelDb,
  getHostelsDb,
  getPaginatedHostelsDb,
  getHostelByIdDb,
  updateHostelDb,
  toggleHostelStatusDb,
  bulkUpdateHostelStatusDb
};
