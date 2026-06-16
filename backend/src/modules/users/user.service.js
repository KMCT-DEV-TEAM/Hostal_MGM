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
    }
  ).populate("organization", "name code organisationNumber email phone");
};

const getUserByIdAndRoleDb = async (id, role) => {
  return await User.findOne({
    _id: id,
    role,
  }).select("-password");
};

const getUserByIdDb = async (id) => {
  return await User.findById(id).select("-password");
};

const updateUserByRoleDb = async (id, role, data) => {
  const user = await User.findOne({
    _id: id,
    role,
  });

  if (!user) return null;

  if (data.name) user.name = data.name;
  if (data.phone) user.phone = data.phone;
  if (data.email) user.email = data.email;

  await user.save();
  return user;
};

const updateUserDb = async (id, data) => {
  const user = await User.findById(id);

  if (!user) return null;

  if (data.name) user.name = data.name;
  if (data.phone) user.phone = data.phone;
  if (data.email) user.email = data.email;

  await user.save();
  return user;
};

const toggleUserActiveStatusByRoleDb = async (id, role) => {
  const user = await User.findOne({
    _id: id,
    role,
  });

  if (!user) return null;

  user.isActive = !user.isActive;
  await user.save();
  
  return user;
};

export {
  findExistingUserByEmail,
  createUserDb,
  getAllUsersByRoleDb,
  getUserByIdAndRoleDb,
  getUserByIdDb,
  updateUserByRoleDb,
  updateUserDb,
  toggleUserActiveStatusByRoleDb
}
