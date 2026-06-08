import bcrypt from "bcryptjs";
import User from "./user.model.js";
import mongoose from "mongoose";

export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({
            email,
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
        });

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: admin,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAdmins = async (req, res) => {
    try {
        const admins = await User.find(
            { role: "admin" },
            {
                name: 1,
                email: 1,
                role: 1,
                isActive: 1,
                createdAt: 1,
            }
        );

        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Admin ID",
      });
    }

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Admin ID",
      });
    }

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (email && email !== admin.email) {
      const existingEmail = await User.findOne({ email });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const deactivateAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOneAndUpdate(
      {
        _id: id,
        role: "admin",
      },
      {
        isActive: false,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin deactivated successfully",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activateAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOneAndUpdate(
      {
        _id: id,
        role: "admin",
      },
      {
        isActive: true,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin activated successfully",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};