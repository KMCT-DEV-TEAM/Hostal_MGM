import User from "./user.model.js";

const findExistingUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const createUserDb = async (data, role) => {
  return await User.create({
    ...data,
    role,
  });
};

const getAllUsersByRoleDb = async (role) => {
  return await User.find(
    { role },
    {
      name: 1,
      email: 1,
      role: 1,
      isActive: 1,
      createdAt: 1,
      organization: 1,
      specialization: 1,
      assignedTask: 1,
    }
  ).populate("organization", "name code organisationNumber email phone");
};

const getPaginatedUsersByRoleDb = async (role, page = 1, limit = 10, status, search, additionalQuery = {}) => {
  const skip = (page - 1) * limit;

  let query = { role, ...additionalQuery };

  if (status && status !== 'All') {
    query.isActive = status === 'Active';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, totalCount] = await Promise.all([
    User.find(
      query,
      {
        name: 1,
        email: 1,
        role: 1,
        isActive: 1,
        phone: 1,
        createdAt: 1,
        organization: 1,
        specialization: 1,
        assignedTask: 1,
      }
    )
      .populate("organization", "name code organisationNumber email phone")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return { users, totalCount };
};

const getUserByIdAndRoleDb = async (id, role, additionalQuery = {}) => {
  return await User.findOne({
    _id: id,
    role,
    ...additionalQuery
  }).select("-password");
};

const getUserByIdDb = async (id) => {
  return await User.findById(id).select("-password");
};

const getUserWithPasswordByIdDb = async (id) => {
  return await User.findById(id);
};

const updateUserByRoleDb = async (id, role, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.email) updateData.email = data.email;
  if (data.specialization !== undefined) updateData.specialization = data.specialization;
  if (data.assignedTask !== undefined) updateData.assignedTask = data.assignedTask;

  const user = await User.findOneAndUpdate(
    { _id: id, role },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  return user;
};

const updateUserDb = async (id, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.email) updateData.email = data.email;
  if (data.specialization !== undefined) updateData.specialization = data.specialization;
  if (data.assignedTask !== undefined) updateData.assignedTask = data.assignedTask;

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  return user;
};

const toggleUserActiveStatusByRoleDb = async (id, role) => {
  const user = await User.findOne({ _id: id, role });
  if (!user) return null;

  return await User.findOneAndUpdate(
    { _id: id, role },
    { $set: { isActive: !user.isActive } },
    { new: true, runValidators: true }
  );
};

const bulkToggleUserStatusByRoleDb = async (ids, role, isActive) => {
  return await User.updateMany(
    { _id: { $in: ids }, role },
    { $set: { isActive } }
  );
};

export {
  findExistingUserByEmail,
  createUserDb,
  getAllUsersByRoleDb,
  getPaginatedUsersByRoleDb,
  getUserByIdAndRoleDb,
  getUserByIdDb,
  getUserWithPasswordByIdDb,
  updateUserByRoleDb,
  updateUserDb,
  toggleUserActiveStatusByRoleDb,
  bulkToggleUserStatusByRoleDb
}
