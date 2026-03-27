import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

function generateToken(user) {
  const payload = {
    user_id: user.id,
    role: user.role,
    tenant_id: user.tenant_id,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
}


// Signup — always creates a customer account from the public form
router.post("/signup", async (req, res) => {
  const { name, email, password, role = "customer", company_name } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const tenantRole =
      role === "super_admin" || role === "company_admin" || role === "customer" ? role : "customer";

    const hashedPassword = await bcrypt.hash(password, 10);

    let tenantId = req.body.tenant_id;

    if (!tenantId) {
      if (tenantRole === "company_admin" && company_name) {
        const compResult = await pool.query(
          "INSERT INTO companies (name) VALUES ($1) RETURNING id",
          [company_name]
        );
        tenantId = compResult.rows[0].id;
      } else {
        // Default to first company for basic customer signup
        const firstCompany = await pool.query("SELECT id FROM companies ORDER BY id LIMIT 1");
        tenantId = firstCompany.rows[0]?.id || 1;
      }
    }

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [name, email, hashedPassword, tenantRole, tenantId, company_name || null]
    );

    const user = { id: result.rows[0].id, name, email, role: tenantRole, tenant_id: tenantId };
    const token = generateToken(user);

    return res.json({
      success: true, token,
      role: user.role, user_id: user.id, tenant_id: user.tenant_id,
      name: user.name, email: user.email,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Signup error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during signup" });
  }
});

// Google Login/Signup - Universal for all users
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: "Credential token missing" });
  }

  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email not provided by Google" });
    }

    // Check if user exists in DB
    let userResult = await pool.query("SELECT id, name, email, role, tenant_id FROM users WHERE email = $1 LIMIT 1", [email]);
    
    let user;
    if (userResult.rows.length === 0) {
      // Auto-create new user as 'customer'
      // Default to first company for basic customer signup if no tenant otherwise
      const firstCompany = await pool.query("SELECT id FROM companies ORDER BY id LIMIT 1");
      const tenantId = firstCompany.rows[0]?.id || 1;

      const insertResult = await pool.query(
        "INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES ($1, $2, 'OAUTH_USER', 'customer', $3, 'Platform Customer') RETURNING id, name, email, role, tenant_id",
        [name || "Google User", email, tenantId]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
      
      // SPECIAL CASE: Fixed Super Admins
      const superEmails = ["varadharaj2005rock@gmail.com", "23i369@psgtech.ac.in", "super@demo.com"];
      if (superEmails.includes(email) && user.role !== "super_admin") {
         await pool.query("UPDATE users SET role = 'super_admin' WHERE id = $1", [user.id]);
         user.role = "super_admin";
      }
    }

    const token = generateToken(user);

    return res.json({
      success: true, token,
      role: user.role, user_id: user.id, tenant_id: user.tenant_id,
      name: user.name, email: user.email,
      picture
    });
  } catch (error) {
    console.error("Google verify error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to verify Google token" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password, role, tenant_id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      success: true, token,
      role: user.role, user_id: user.id, tenant_id: user.tenant_id,
      name: user.name, email: user.email,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
});

export default router;
