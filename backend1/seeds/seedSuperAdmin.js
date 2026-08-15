import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import User from "../src/modules/users/user.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({
      role: "super_admin",
    });

    if (existing) {
      console.log("Super Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      "Admin@123",
      10
    );

    await User.create({
      name: "Super Admin",
      email: "superadmin@gmail.com",
      password: hashedPassword,
      role: "super_admin",
    });

    console.log("Super Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedSuperAdmin();