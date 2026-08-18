import dotenv from "dotenv";
import { connectDB } from "./config/prisma.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

import http from "http";
import { initSocket } from "./config/socket.js";
import { registerAllTemplates } from "./modules/notification/templates/index.js";

const bootstrap = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    registerAllTemplates();


    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};


bootstrap();