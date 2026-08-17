import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(express.json());
app.use(cors(corsOptions));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Basic health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running smoothly" });
});

export default app;
