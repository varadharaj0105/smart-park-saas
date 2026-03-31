import express from "express";
import { pool } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(["company_admin", "super_admin"]));

// Get slots for the current tenant
router.get("/slots", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM slots WHERE tenant_id = $1",
      [req.user.tenant_id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get slots error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch slots" });
  }
});

// Create a new slot for the current tenant
router.post("/slots", async (req, res) => {
  const { slot_number, floor, type } = req.body;

  if (!slot_number || !floor || !type) {
    return res.status(400).json({ success: false, message: "slot_number, floor and type are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO slots (tenant_id, slot_number, floor, type, status) VALUES ($1, $2, $3, $4, 'available') RETURNING id",
      [req.user.tenant_id, slot_number, floor, type]
    );
    return res.json({ success: true, slot_id: result.rows[0].id });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Create slot error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create slot" });
  }
});

// Update a slot (status or number)
router.put("/slots/:id", async (req, res) => {
  const { id } = req.params;
  const { status, slot_number } = req.body;

  try {
    await pool.query(
      "UPDATE slots SET status = COALESCE($1, status), slot_number = COALESCE($2, slot_number) WHERE id = $3 AND tenant_id = $4",
      [status || null, slot_number || null, id, req.user.tenant_id]
    );
    return res.json({ success: true, message: "Slot updated" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update slot error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update slot" });
  }
});

// Delete a slot
router.delete("/slots/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM slots WHERE id = $1 AND tenant_id = $2", [id, req.user.tenant_id]);
    return res.json({ success: true, message: "Slot deleted" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete slot error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete slot" });
  }
});

// Dashboard stats for this tenant
router.get("/dashboard/stats", async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    // 1. Basic totals
    const slotRes = await pool.query(
      `SELECT COUNT(*) AS "totalSlots",
               SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS "availableSlots"
        FROM slots WHERE tenant_id = $1`,
      [tenantId]
    );

    const bookingRes = await pool.query(
      `SELECT COUNT(*) AS "totalBookings" FROM bookings WHERE tenant_id = $1`,
      [tenantId]
    );

    // 2. Revenue Breakdown (Daily, Weekly, Monthly)
    
    // DAILY (Last 24 hours, grouped by hour)
    const dailyRevenueRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'HH24:00') AS name,
         SUM(amount) AS revenue,
         MIN(created_at) as sort_val
       FROM payments 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY TO_CHAR(created_at, 'HH24:00')
       ORDER BY sort_val ASC`,
      [tenantId]
    );

    // WEEKLY (Last 7 days, grouped by day)
    const weeklyRevenueRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'Dy') AS name,
         SUM(amount) AS revenue,
         MIN(created_at) as sort_val
       FROM payments 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
       ORDER BY sort_val ASC`,
      [tenantId]
    );

    // MONTHLY (Last 30 days, grouped by day)
    const monthlyRevenueRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'DD Mon') AS name,
         SUM(amount) AS revenue,
         MIN(created_at) as sort_val
       FROM payments 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE(created_at)
       ORDER BY sort_val ASC`,
      [tenantId]
    );

    // Totals for summary cards
    const dailyTotal = dailyRevenueRes.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
    const weeklyTotal = weeklyRevenueRes.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
    const monthlyTotal = monthlyRevenueRes.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
    const totalRevenueAllTime = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE tenant_id = $1`,
      [tenantId]
    );

    return res.json({
      success: true,
      data: {
        totalSlots: Number(slotRes.rows[0].totalSlots || 0),
        availableSlots: Number(slotRes.rows[0].availableSlots || 0),
        totalBookings: Number(bookingRes.rows[0].totalBookings || 0),
        totalRevenue: Number(totalRevenueAllTime.rows[0].total || 0),
        dailyRevenue: {
          total: dailyTotal,
          chart: dailyRevenueRes.rows.map(r => ({ name: r.name, revenue: Number(r.revenue) }))
        },
        weeklyRevenue: {
          total: weeklyTotal,
          chart: weeklyRevenueRes.rows.map(r => ({ name: r.name, revenue: Number(r.revenue) }))
        },
        monthlyRevenue: {
          total: monthlyTotal,
          chart: monthlyRevenueRes.rows.map(r => ({ name: r.name, revenue: Number(r.revenue) }))
        }
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Dashboard stats error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
});

export default router;
