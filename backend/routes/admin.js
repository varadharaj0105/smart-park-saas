import express from "express";
import { pool } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin/super_admin role
router.use(authMiddleware);
router.use(requireRole(["company_admin", "super_admin"]));

// Get slots for the current tenant
router.get("/slots", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM slots WHERE tenant_id = ?", [
      req.user.tenant_id,
    ]);
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
    return res
      .status(400)
      .json({ success: false, message: "slot_number, floor and type are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO slots (tenant_id, slot_number, floor, type, status) VALUES (?, ?, ?, ?, 'available')",
      [req.user.tenant_id, slot_number, floor, type],
    );
    return res.json({ success: true, slot_id: result.insertId });
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
      "UPDATE slots SET status = COALESCE(?, status), slot_number = COALESCE(?, slot_number) WHERE id = ? AND tenant_id = ?",
      [status || null, slot_number || null, id, req.user.tenant_id],
    );
    return res.json({ success: true, message: "Slot updated" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update slot error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update slot" });
  }
});

// Delete a slot for this tenant
router.delete("/slots/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM slots WHERE id = ? AND tenant_id = ?", [
      id,
      req.user.tenant_id,
    ]);
    return res.json({ success: true, message: "Slot deleted" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete slot error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete slot" });
  }
});

// Basic dashboard stats for the tenant (slots, active bookings, revenue)
router.get("/dashboard/stats", async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const [[slotRow]] = await pool.query(
      "SELECT COUNT(*) AS totalSlots, SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS availableSlots FROM slots WHERE tenant_id = ?",
      [tenantId],
    );

    const [[bookingRow]] = await pool.query(
      "SELECT COUNT(*) AS totalBookings FROM bookings WHERE tenant_id = ?",
      [tenantId],
    );

    const [[revenueRow]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM payments WHERE tenant_id = ?",
      [tenantId],
    );

    return res.json({
      success: true,
      data: {
        totalSlots: slotRow.totalSlots || 0,
        availableSlots: slotRow.availableSlots || 0,
        totalBookings: bookingRow.totalBookings || 0,
        totalRevenue: Number(revenueRow.totalRevenue || 0),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Dashboard stats error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
});

export default router;

