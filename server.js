import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./backend/routes/auth.js";
import adminRoutes from "./backend/routes/admin.js";
import userRoutes from "./backend/routes/user.js";
import superRoutes from "./backend/routes/super.js";
import { testConnection } from "./backend/db.js";

dotenv.config();

const app = express();

// Global middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8082",
  "http://localhost:8082",
  "http://localhost:5173",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Route prefixes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/super", superRoutes);

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "OK" });
});

const PORT = process.env.PORT || 3000;

// Start server only after DB connection check passes
testConnection().then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});

