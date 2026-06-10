import User from "../users/user.model.js";
import { comparePassword } from "../../utils/hash.js";

const findUserForLoginDb = async (email) => {
  return await User.findOne({ email });
};

const verifyPassword = async (inputPassword, userPassword) => {
  return await comparePassword(inputPassword, userPassword);
};

const findUserByIdForRefreshDb = async (id) => {
  return await User.findById(id);
};

export {
  findUserForLoginDb,
  verifyPassword,
  findUserByIdForRefreshDb,
}
