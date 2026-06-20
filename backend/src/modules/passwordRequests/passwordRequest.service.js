import PasswordRequest from "./passwordRequest.model.js";
import User from "../users/user.model.js";
import { hashPassword } from "../../utils/hash.js";
import mongoose from "mongoose";

export const verifyEmailExistsDb = async (email) => {
  const user = await User.findOne({ email }).lean();
  return user ? true : false;
};

export const submitPasswordRequestDb = async (email, plainNewPassword) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await hashPassword(plainNewPassword);

  const request = await PasswordRequest.create({
    userId: user._id,
    newPassword: hashedPassword,
    status: "pending",
  });

  return request;
};

export const getPasswordRequestsDb = async (query) => {
  const { page = 1, limit = 10, status = "pending", search = "" } = query;
  
  const matchStage = {};
  if (status && status !== "all") {
    matchStage.status = status;
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id: 1,
        status: 1,
        createdAt: 1,
        user: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          role: "$user.role",
          organization: "$user.organization"
        }
      }
    }
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "user.name": { $regex: search, $options: "i" } },
          { "user.email": { $regex: search, $options: "i" } }
        ]
      }
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const requests = await PasswordRequest.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limitNumber },
  ]);

  const totalResult = await PasswordRequest.aggregate([
    ...pipeline,
    { $count: "total" }
  ]);

  const totalRecords = totalResult[0]?.total || 0;

  return {
    requests,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNumber),
      hasNextPage: pageNumber < Math.ceil(totalRecords / limitNumber),
      hasPreviousPage: pageNumber > 1,
    },
  };
};

export const approvePasswordRequestDb = async (requestId) => {
  const session = await mongoose.startSession();
  let updatedRequest;
  
  try {
    session.startTransaction();

    const request = await PasswordRequest.findById(requestId).session(session);
    if (!request) {
      throw new Error("Password request not found");
    }
    
    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    const user = await User.findById(request.userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    user.password = request.newPassword;
    await user.save({ session });

    request.status = "approved";
    updatedRequest = await request.save({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return updatedRequest;
};

export const rejectPasswordRequestDb = async (requestId) => {
  const request = await PasswordRequest.findByIdAndUpdate(
    requestId,
    { status: "rejected" },
    { new: true }
  );
  if (!request) {
    throw new Error("Password request not found");
  }
  return request;
};
