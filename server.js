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

app.use(cors({
  origin: true, // Allow any frontend domain (Vercel) to connect to this API
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

