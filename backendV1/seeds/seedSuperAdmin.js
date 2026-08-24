import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import {
  prisma,
  connectDB,
  disConnectDB,
} from "../src/config/prisma.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      10
    );

    await prisma.user.upsert({
      where: {
        email: process.env.SUPER_ADMIN_EMAIL,
      },

      update: {},

      create: {
        name: process.env.SUPER_ADMIN_NAME,
        email: process.env.SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log("Super Admin Ready");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await disConnectDB();
  }
};

seedSuperAdmin();