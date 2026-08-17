import dotenv from "dotenv";
import { connectDB, disConnectDB } from "./config/prisma.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

import http from "http";
import { initSocket } from "./config/socket.js";

const bootstrap = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await disConnectDB();
          console.log("Database disconnected");
          console.log("Server stopped");
          process.exit(0);
        } catch (error) {
          console.error("Shutdown error:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

bootstrap();