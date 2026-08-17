import dotenv from "dotenv";
import { connectDB } from "./config/prisma.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};


bootstrap();