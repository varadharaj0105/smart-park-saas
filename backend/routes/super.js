import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(["super_admin"]));

// List all companies with admin info
router.get("/companies", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
             u.id AS admin_id,
             u.name AS admin_name,
             u.email AS admin_email
      FROM companies c
      LEFT JOIN users u ON c.id = u.tenant_id AND u.role = 'company_admin'
      ORDER BY c.id DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get companies error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch companies" });
  }
});

// Get detailed company info + stats + recent payments
router.get("/companies/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const companyRes = await client.query(`
      SELECT c.*, u.id AS admin_id, u.name AS admin_name, u.email AS admin_email
      FROM companies c
      LEFT JOIN users u ON c.id = u.tenant_id AND u.role = 'company_admin'
      WHERE c.id = $1
    `, [id]);

    if (companyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const slotStats = await client.query(
      `SELECT COUNT(*) AS total_slots,
              SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_slots
       FROM slots WHERE tenant_id = $1`,
      [id]
    );

    const bookingStats = await client.query(
      `SELECT COUNT(*) AS total_bookings,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_bookings
       FROM bookings WHERE tenant_id = $1`,
      [id]
    );

    const revenueStats = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE tenant_id = $1`,
      [id]
    );

    const recentPayments = await client.query(
      `SELECT p.*, b.user_id FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE p.tenant_id = $1
       ORDER BY p.created_at DESC LIMIT 10`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        company: companyRes.rows[0],
        stats: {
          total_slots: Number(slotStats.rows[0].total_slots || 0),
          available_slots: Number(slotStats.rows[0].available_slots || 0),
          total_bookings: Number(bookingStats.rows[0].total_bookings || 0),
          active_bookings: Number(bookingStats.rows[0].active_bookings || 0),
          total_revenue: Number(revenueStats.rows[0].total_revenue || 0),
        },
        payments: recentPayments.rows,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get company details error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch company details" });
  } finally {
    client.release();
  }
});

// Create a new Company + Admin user (transaction)
router.post("/companies", async (req, res) => {
  const { company_name, latitude, longitude, admin_name, admin_email, admin_password } = req.body;

  if (!company_name || !latitude || !longitude || !admin_name || !admin_email || !admin_password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingUser = await client.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [admin_email]);
    if (existingUser.rows.length > 0) throw new Error("Email already registered");

    const compResult = await client.query(
      "INSERT INTO companies (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id",
      [company_name, latitude, longitude]
    );
    const tenantId = compResult.rows[0].id;

    const hashedPassword = await bcrypt.hash(admin_password, 10);

    await client.query(
      "INSERT INTO users (name, email, password, role, tenant_id, company_name) VALUES ($1, $2, $3, 'company_admin', $4, $5)",
      [admin_name, admin_email, hashedPassword, tenantId, company_name]
    );

    await client.query("COMMIT");
    return res.json({ success: true, message: "Company and Admin created successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Create company error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to create company" });
  } finally {
    client.release();
  }
});

// Update Company + Admin (transaction)
router.put("/companies/:id", async (req, res) => {
  const { id } = req.params;
  const { company_name, latitude, longitude, admin_name, admin_email, admin_password } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (company_name || latitude || longitude) {
      await client.query(
        "UPDATE companies SET name = COALESCE($1, name), latitude = COALESCE($2, latitude), longitude = COALESCE($3, longitude) WHERE id = $4",
        [company_name || null, latitude || null, longitude || null, id]
      );
    }

    const adminRes = await client.query(
      "SELECT id FROM users WHERE tenant_id = $1 AND role = 'company_admin' LIMIT 1",
      [id]
    );

    if (adminRes.rows.length > 0) {
      const adminId = adminRes.rows[0].id;
      if (admin_password) {
        const hashedPassword = await bcrypt.hash(admin_password, 10);
        await client.query(
          "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), password = $3, company_name = COALESCE($4, company_name) WHERE id = $5",
          [admin_name || null, admin_email || null, hashedPassword, company_name || null, adminId]
        );
      } else {
        await client.query(
          "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), company_name = COALESCE($3, company_name) WHERE id = $4",
          [admin_name || null, admin_email || null, company_name || null, adminId]
        );
      }
    }

    await client.query("COMMIT");
    return res.json({ success: true, message: "Company updated successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Update company error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to update company" });
  } finally {
    client.release();
  }
});

// Delete Company + cascade all data (transaction)
router.delete("/companies/:id", async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete payments for bookings of this tenant
    await client.query(
      "DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE tenant_id = $1)",
      [id]
    );
    await client.query("DELETE FROM bookings WHERE tenant_id = $1", [id]);
    await client.query("DELETE FROM slots WHERE tenant_id = $1", [id]);
    await client.query("DELETE FROM users WHERE tenant_id = $1", [id]);
    await client.query("DELETE FROM companies WHERE id = $1", [id]);

    await client.query("COMMIT");
    return res.json({ success: true, message: "Company and all associated data deleted successfully!" });
  } catch (error) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Delete company error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete company" });
  } finally {
    client.release();
  }
});

// List all users
router.get("/users", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, role, tenant_id FROM users ORDER BY id DESC"
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get users error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// All payments globally
router.get("/payments", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, b.status as booking_status, b.user_id, c.name as company_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN companies c ON p.tenant_id = c.id
       ORDER BY p.created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get super payments error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch all payments" });
  }
});

// Global Dashboard stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    // 1. Basic Platform Totals
    const companyRes = await pool.query("SELECT COUNT(*) AS count FROM companies");
    const userRes = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'");
    const bookingRes = await pool.query("SELECT COUNT(*) AS count FROM bookings");
    const totalRevRes = await pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments");

    // 2. Platform Revenue Breakdown
    
    // DAILY (Grouped by hour)
    const dailyRevenueRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'HH24:00') AS name,
         SUM(amount) AS revenue,
         MIN(created_at) as sort_val
       FROM payments 
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY TO_CHAR(created_at, 'HH24:00')
       ORDER BY sort_val ASC`
    );

    // WEEKLY (Grouped by day)
    const weeklyRevenueRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'Dy') AS name,
         SUM(amount) AS revenue,
         MIN(created_at) as sort_val
       FROM payments 
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
       ORDER BY sort_val ASC`
    );

    // MONTHLY (Grouped by day)
    const monthlyRevenueRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'DD Mon') AS name,
         SUM(amount) AS revenue,
         MIN(created_at) as sort_val
       FROM payments 
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE(created_at)
       ORDER BY sort_val ASC`
    );

    // Company Comparison (Top 10)
    const companyComparisonRes = await pool.query(
      `SELECT c.name, SUM(p.amount) as revenue
       FROM payments p
       JOIN companies c ON p.tenant_id = c.id
       GROUP BY c.name
       ORDER BY revenue DESC
       LIMIT 10`
    );

    return res.json({
      success: true,
      data: {
        totalCompanies: Number(companyRes.rows[0].count),
        totalUsers: Number(userRes.rows[0].count),
        totalBookings: Number(bookingRes.rows[0].count),
        totalRevenue: Number(totalRevRes.rows[0].total),
        dailyRevenue: {
          chart: dailyRevenueRes.rows.map(r => ({ name: r.name, revenue: Number(r.revenue) }))
        },
        weeklyRevenue: {
          chart: weeklyRevenueRes.rows.map(r => ({ name: r.name, revenue: Number(r.revenue) }))
        },
        monthlyRevenue: {
          chart: monthlyRevenueRes.rows.map(r => ({ name: r.name, revenue: Number(r.revenue) }))
        },
        companyComparison: companyComparisonRes.rows.map(r => ({
           name: r.name.split(' ')[0], // Short name for chart
           revenue: Number(r.revenue)
        }))
      }
    });
  } catch (error) {
    console.error("Super dashboard stats error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load platform stats" });
  }
});

export default router;
