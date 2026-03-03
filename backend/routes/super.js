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
    const query = `
      SELECT 
        c.*,
        u.id AS admin_id,
        u.name AS admin_name,
        u.email AS admin_email
      FROM companies c
      LEFT JOIN users u ON c.id = u.tenant_id AND u.role = 'company_admin'
      ORDER BY c.id DESC
    `;
    const [rows] = await pool.query(query);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get companies error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch companies" });
  }
});

// Get detailed company analytics and info by ID
router.get("/companies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();

    try {
      // 1. Company info
      const [companyRows] = await connection.query(`
        SELECT 
          c.*,
          u.id AS admin_id,
          u.name AS admin_name,
          u.email AS admin_email
        FROM companies c
        LEFT JOIN users u ON c.id = u.tenant_id AND u.role = 'company_admin'
        WHERE c.id = ?
      `, [id]);

      if (companyRows.length === 0) {
        connection.release();
        return res.status(404).json({ success: false, message: "Company not found" });
      }

      const company = companyRows[0];

      // 2. Stats: slots, bookings
      const [slotStats] = await connection.query(`
        SELECT 
          COUNT(*) as total_slots,
          SUM(IF(status = 'available', 1, 0)) as available_slots
        FROM slots WHERE tenant_id = ?
      `, [id]);

      const [bookingStats] = await connection.query(`
        SELECT COUNT(*) as active_bookings 
        FROM bookings 
        WHERE tenant_id = ? AND status = 'active'
      `, [id]);

      // 3. Total revenue
      const [revenueStats] = await connection.query(`
        SELECT SUM(p.amount) as total_revenue
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE b.tenant_id = ?
      `, [id]);

      // 4. Recent payments
      const [recentPayments] = await connection.query(`
        SELECT p.*, b.status as booking_status, b.user_id 
        FROM payments p 
        JOIN bookings b ON p.booking_id = b.id 
        WHERE b.tenant_id = ? 
        ORDER BY p.created_at DESC 
        LIMIT 10
      `, [id]);

      connection.release();

      return res.json({
        success: true,
        data: {
          company,
          stats: {
            total_slots: slotStats[0].total_slots || 0,
            available_slots: slotStats[0].available_slots || 0,
            active_bookings: bookingStats[0].active_bookings || 0,
            total_revenue: revenueStats[0].total_revenue || 0,
          },
          payments: recentPayments
        }
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error("Get company details error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch company details" });
  }
});

// Create a new Company and Admin via Super Admin Map click
router.post("/companies", async (req, res) => {
  const { company_name, latitude, longitude, admin_name, admin_email, admin_password } = req.body;

  if (!company_name || !latitude || !longitude || !admin_name || !admin_email || !admin_password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if email is already in use
      const [existingUser] = await connection.query("SELECT id FROM users WHERE email = ? LIMIT 1", [admin_email]);
      if (existingUser.length > 0) {
        throw new Error("Email already registered");
      }

      // Create company
      const [compResult] = await connection.query(
        "INSERT INTO companies (name, latitude, longitude) VALUES (?, ?, ?)",
        [company_name, latitude, longitude]
      );
      const tenantId = compResult.insertId;

      // Create admin user for that company
      await connection.query(
        "INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES (?, ?, ?, 'company_admin', ?, ?)",
        [admin_name, admin_email, admin_password, tenantId, company_name]
      );

      await connection.commit();
      connection.release();

      return res.json({ success: true, message: "Company and Admin created successfully!" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Create company error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to create company" });
  }
});

// Update an existing Company and its Admin
router.put("/companies/:id", async (req, res) => {
  const { id } = req.params;
  const { company_name, latitude, longitude, admin_name, admin_email, admin_password } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update company
      if (company_name || latitude || longitude) {
        await connection.query(
          "UPDATE companies SET name = COALESCE(?, name), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude) WHERE id = ?",
          [company_name, latitude, longitude, id]
        );
      }

      // Find the company_admin user for this tenant
      const [adminRows] = await connection.query(
        "SELECT id FROM users WHERE tenant_id = ? AND role = 'company_admin' LIMIT 1",
        [id]
      );

      if (adminRows.length > 0) {
        const adminId = adminRows[0].id;
        // Optionally update password if provided
        if (admin_password) {
          await connection.query(
            "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), password = ?, company_name = COALESCE(?, company_name) WHERE id = ?",
            [admin_name, admin_email, admin_password, company_name, adminId]
          );
        } else {
          await connection.query(
            "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), company_name = COALESCE(?, company_name) WHERE id = ?",
            [admin_name, admin_email, company_name, adminId]
          );
        }
      }

      await connection.commit();
      connection.release();

      return res.json({ success: true, message: "Company updated successfully!" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update company error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to update company" });
  }
});

// Delete a Company
router.delete("/companies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete payments for bookings of this tenant
      await connection.query(
        "DELETE p FROM payments p INNER JOIN bookings b ON p.booking_id = b.id WHERE b.tenant_id = ?",
        [id]
      );

      // Delete bookings
      await connection.query("DELETE FROM bookings WHERE tenant_id = ?", [id]);

      // Delete slots
      await connection.query("DELETE FROM slots WHERE tenant_id = ?", [id]);

      // Delete users (including the company admin)
      await connection.query("DELETE FROM users WHERE tenant_id = ?", [id]);

      // Delete the company
      await connection.query("DELETE FROM companies WHERE id = ?", [id]);

      await connection.commit();
      connection.release();

      return res.json({ success: true, message: "Company and all associated data deleted successfully!" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete company error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete company" });
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

// Fetch ALL payments globally for Super Admin
router.get("/payments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.*, b.status as booking_status, b.user_id, c.name as company_name FROM payments p JOIN bookings b ON p.booking_id = b.id LEFT JOIN companies c ON p.tenant_id = c.id ORDER BY p.created_at DESC"
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get super payments error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch all payments" });
  }
});

export default router;
