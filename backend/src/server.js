import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { initSocket } from "./config/socket.js";
import { initCron } from "./cron/index.js";
import { registerAllTemplates } from "./modules/notifications/template.js";

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize Cron Infrastructure
  initCron();

  // Initialize Notification Templates
  registerAllTemplates();
});