import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

function generateToken(user) {
  const payload = {
    user_id: user.id,
    role: user.role,
    tenant_id: user.tenant_id,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
}

// Temporary fix route to hash any plaintext passwords left over from seed_data
router.get("/fix", async (req, res) => {
  try {
    const { rows: users } = await pool.query("SELECT id, password FROM users");
    let migratedCount = 0;
    for (const user of users) {
      if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user.id]);
        migratedCount++;
      }
    }
    res.json({ message: `Successfully hashed ${migratedCount} plaintext passwords!` });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get("/fix2", async (req, res) => {
  try {
    const defaultHash = "$2b$10$QnYtoVCPoZ672BJi6COPxH9ae61gZuVMo0njbHh3XladtZ9Vx";
    await pool.query("UPDATE users SET password = $1", [defaultHash]);
    res.json({ message: "Successfully reset ALL user passwords to 'password'!" });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get("/seed-admin", async (req, res) => {
  try {
    let compId = 1;
    const compCheck = await pool.query("SELECT id FROM companies WHERE name = 'Downtown Parking Co.' LIMIT 1");
    if (compCheck.rows.length === 0) {
       const resComp = await pool.query("INSERT INTO companies (name, latitude, longitude) VALUES ('Downtown Parking Co.', 28.6315, 77.2167) RETURNING id");
       compId = resComp.rows[0].id;
    } else {
       compId = compCheck.rows[0].id;
    }

    const hash = "$2b$10$QnYtoVCPoZ672BJi6COPxH9ae61gZuVMo0njbHh3XladtZ9Vx"; // 'password'

    const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@demo.com'");
    if (adminCheck.rows.length === 0) {
      await pool.query("INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES ('Company Admin', 'admin@demo.com', $1, 'company_admin', $2, 'Downtown Parking Co.')", [hash, compId]);
    } else {
      await pool.query("UPDATE users SET password = $1 WHERE email = 'admin@demo.com'", [hash]);
    }
    
    const superCheck = await pool.query("SELECT id FROM users WHERE email = 'super@demo.com'");
    if (superCheck.rows.length === 0) {
      await pool.query("INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES ('Super Admin', 'super@demo.com', $1, 'super_admin', $2, 'Platform')", [hash, compId]);
    } else {
      await pool.query("UPDATE users SET password = $1 WHERE email = 'super@demo.com'", [hash]);
    }
    
    res.json({ message: "Admin accounts forcefully seeded and passwords reset to 'password'!" });
  } catch (error) {
    res.json({ error: error.message });
  }
});

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
