import User from "../users/user.model.js";
import Parent from "./parent.model.js";

const updateParentDb = async (parentProfileId, data) => {
  const parentProfile = await Parent.findById(parentProfileId);
  if (!parentProfile) return null;

  const user = await User.findById(parentProfile.userId);
  if (!user) return null;

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new Error("Parent email already exists");
    }
    user.email = data.email;
  }

  // Update User fields
  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  await user.save();

  // Update Parent Profile fields
  if (data.relationship !== undefined) parentProfile.relationship = data.relationship;
  if (data.address !== undefined) parentProfile.address = data.address;
  await parentProfile.save();

  return { parentProfile, user };
};

const toggleParentStatusDb = async (parentProfileId) => {
  const parentProfile = await Parent.findById(parentProfileId);
  if (!parentProfile) return null;

  const user = await User.findById(parentProfile.userId);
  if (!user) return null;

  user.isActive = !user.isActive;
  await user.save();

  return { parentProfile, user };
};

export {
  updateParentDb,
  toggleParentStatusDb
};
