import Hostel from "./hostel.model.js";

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
  return await Hostel.find(query)
    .populate("wardens", "name email")
    .populate("adminId", "name email")
    .populate("organizations", "name code");
};

const getPaginatedHostelsDb = async (organizationId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = organizationId ? { organizations: organizationId } : {};

  const [hostels, totalCount] = await Promise.all([
    Hostel.find(query)
      .populate("wardens", "name email")
      .populate("adminId", "name email")
      .populate("organizations", "name code")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Hostel.countDocuments(query),
  ]);

  return { hostels, totalCount };
};

const getHostelByIdDb = async (id, organizationId) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizations = organizationId;
  }
  return await Hostel.findOne(query)
    .populate("wardens", "name email")
    .populate("adminId", "name email")
    .populate("organizations", "name code");
};

const updateHostelDb = async (id, organizationId, updateData) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizations = organizationId;
  }
  return await Hostel.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
};

const toggleHostelStatusDb = async (id, organizationId) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizations = organizationId;
  }
  
  const hostel = await Hostel.findOne(query);
  if (!hostel) return null;

  hostel.isActive = !hostel.isActive;
  return await hostel.save();
};

export {
  checkExistingHostelCodeDb,
  checkExistingHostelEmailDb,
  createHostelDb,
  getHostelsDb,
  getPaginatedHostelsDb,
  getHostelByIdDb,
  updateHostelDb,
  toggleHostelStatusDb
};
