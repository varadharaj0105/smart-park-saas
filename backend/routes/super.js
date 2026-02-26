import express from "express";
import { pool } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Super admin only routes
router.use(authMiddleware);
router.use(requireRole(["super_admin"]));

// List companies (tenants)
router.get("/companies", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM companies ORDER BY id DESC");
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get companies error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch companies" });
  }
});

// List users across tenants
router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, tenant_id FROM users ORDER BY id DESC",
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get users error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

export default router;

