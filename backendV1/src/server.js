import "dotenv/config";
import dns from "node:dns";
import { connectDB, disConnectDB } from "./config/prisma.js";
import app from "./app.js";

// Ensure Node defaults to IPv4 over IPv6 to avoid ENETUNREACH in cloud environments
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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