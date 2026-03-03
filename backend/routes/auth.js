import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

// Helper to generate a JWT for a user
function generateToken(user) {
  const payload = {
    user_id: user.id,
    role: user.role,
    tenant_id: user.tenant_id,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
}

// Basic signup (example – adjust to your schema and validation)
router.post("/signup", async (req, res) => {
  const { name, email, password, role = "customer", company_name } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Name, email and password are required" });
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // For simplicity we are not hashing here – for production always hash passwords
    const tenantRole =
      role === "super_admin" || role === "company_admin" || role === "customer"
        ? role
        : "customer";

    let tenantId = req.body.tenant_id;

    if (!tenantId) {
      if (tenantRole === "company_admin" && company_name) {
        // Create a new company/tenant for this admin
        const [compResult] = await pool.query("INSERT INTO companies (name) VALUES (?)", [company_name]);
        tenantId = compResult.insertId;
      } else {
        // Default to tenant 1 if no tenant provided (e.g. basic customer signup)
        tenantId = 1;
      }
    }

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, password, tenantRole, tenantId, company_name || null],
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role: tenantRole,
      tenant_id: tenantId,
    };

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      role: user.role,
      user_id: user.id,
      tenant_id: user.tenant_id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Signup error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during signup" });
  }
});

// Login – expects email and password and returns token + role + ids
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, password, role, tenant_id FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      role: user.role,
      user_id: user.id,
      tenant_id: user.tenant_id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
});

export default router;

