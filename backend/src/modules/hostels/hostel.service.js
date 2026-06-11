import Hostel from "./hostel.model.js";

const checkExistingHostelCodeDb = async (code) => {
  return await Hostel.findOne({ code });
};

const createHostelDb = async (data) => {
  const hostel = new Hostel(data);
  return await hostel.save();
};

const getHostelsDb = async (organizationId) => {
  const query = organizationId ? { organizationId } : {};
  return await Hostel.find(query).populate("wardenId", "name email");
};

const getHostelByIdDb = async (id, organizationId) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizationId = organizationId;
  }
  return await Hostel.findOne(query).populate("wardenId", "name email");
};

const updateHostelDb = async (id, organizationId, updateData) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizationId = organizationId;
  }
  return await Hostel.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
};

const toggleHostelStatusDb = async (id, organizationId) => {
  const query = { _id: id };
  if (organizationId) {
    query.organizationId = organizationId;
  }
  
  const hostel = await Hostel.findOne(query);
  if (!hostel) return null;

  hostel.isActive = !hostel.isActive;
  return await hostel.save();
};

export {
  checkExistingHostelCodeDb,
  createHostelDb,
  getHostelsDb,
  getHostelByIdDb,
  updateHostelDb,
  toggleHostelStatusDb
};
