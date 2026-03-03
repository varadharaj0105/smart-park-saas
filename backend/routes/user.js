import express from "express";
import { pool } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Customers and admins can access user routes
router.use(authMiddleware);
router.use(requireRole(["customer", "company_admin", "super_admin"]));

// Get company locations and their global slot availability
router.get("/locations", async (req, res) => {
  try {
    let query = `
      SELECT 
        c.id, c.name, c.latitude, c.longitude,
        COUNT(s.id) as total_slots,
        SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_slots
      FROM companies c
      LEFT JOIN slots s ON c.id = s.tenant_id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      GROUP BY c.id
    `;
    let params = [];

    if (req.user.role === "company_admin") {
      query = `
        SELECT 
          c.id, c.name, c.latitude, c.longitude,
          COUNT(s.id) as total_slots,
          SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_slots
        FROM companies c
        LEFT JOIN slots s ON c.id = s.tenant_id
        WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND c.id = ?
        GROUP BY c.id
      `;
      params = [req.user.tenant_id];
    }

    const [rows] = await pool.query(query, params);
    // Parse counts correctly from DB strings if needed
    const data = rows.map((r) => ({
      ...r,
      total_slots: Number(r.total_slots || 0),
      available_slots: Number(r.available_slots || 0)
    }));

    return res.json({ success: true, data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get locations error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
});

// Get slots (Customers see all slots, Admins see only their own)
router.get("/slots", async (req, res) => {
  try {
    let query = "SELECT s.*, c.name as company_name FROM slots s LEFT JOIN companies c ON s.tenant_id = c.id WHERE s.tenant_id = ?";
    let params = [req.user.tenant_id];

    if (req.user.role === "customer") {
      query = "SELECT s.*, c.name as company_name FROM slots s LEFT JOIN companies c ON s.tenant_id = c.id";
      params = [];
    }

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get slots error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch slots" });
  }
});

// Get bookings for current user (or tenant if admin)
router.get("/bookings", async (req, res) => {
  try {
    let query = `
      SELECT b.*, c.name as company_name 
      FROM bookings b 
      LEFT JOIN companies c ON b.tenant_id = c.id 
      WHERE b.tenant_id = ? 
      ORDER BY b.start_time DESC`;
    let params = [req.user.tenant_id];

    if (req.user.role === "customer") {
      query = `
        SELECT b.*, c.name as company_name 
        FROM bookings b 
        LEFT JOIN companies c ON b.tenant_id = c.id 
        WHERE b.user_id = ? 
        ORDER BY b.start_time DESC`;
      params = [req.user.id];
    }

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get bookings error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
});

// Create a new booking for current user
router.post("/bookings", async (req, res) => {
  const { slot_id, vehicle_number, start_time, duration } = req.body;

  if (!slot_id || !vehicle_number || !start_time || !duration) {
    return res.status(400).json({
      success: false,
      message: "slot_id, vehicle_number, start_time and duration are required",
    });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get the true tenant_id of the slot being booked
      const [slotRows] = await connection.query("SELECT tenant_id FROM slots WHERE id = ?", [slot_id]);
      if (slotRows.length === 0) {
        throw new Error("Slot not found");
      }
      const actualTenantId = slotRows[0].tenant_id;

      const [result] = await connection.query(
        "INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
        [actualTenantId, req.user.id, slot_id, vehicle_number, start_time, duration],
      );

      // Mark slot as occupied for this tenant
      await connection.query(
        "UPDATE slots SET status = 'occupied' WHERE id = ? AND tenant_id = ?",
        [slot_id, actualTenantId],
      );

      await connection.commit();
      connection.release();

      return res.json({ success: true, booking_id: result.insertId });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Create booking error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create booking" });
  }
});

// Cancel a booking (soft delete)
router.delete("/bookings/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Customers can cancel their own bookings, admins can cancel tenant bookings
      let findQuery = "SELECT slot_id, tenant_id FROM bookings WHERE id = ? AND tenant_id = ?";
      let findParams = [id, req.user.tenant_id];
      if (req.user.role === "customer") {
        findQuery = "SELECT slot_id, tenant_id FROM bookings WHERE id = ? AND user_id = ?";
        findParams = [id, req.user.id];
      }

      const [rows] = await connection.query(findQuery, findParams);
      if (rows.length === 0) {
        throw new Error("Booking not found");
      }

      let updateBookingQuery = "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND tenant_id = ?";
      if (req.user.role === "customer") {
        updateBookingQuery = "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ?";
      }
      await connection.query(updateBookingQuery, findParams);

      if (rows.length > 0) {
        const { slot_id, tenant_id } = rows[0];
        await connection.query(
          "UPDATE slots SET status = 'available' WHERE id = ? AND tenant_id = ?",
          [slot_id, tenant_id],
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    return res.json({ success: true, message: "Booking cancelled" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Cancel booking error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to cancel booking" });
  }
});

// Exit + payment flow
router.post("/bookings/:id/exit", async (req, res) => {
  const { id } = req.params;
  const exitTime = new Date();

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let queryStr = `SELECT b.id, b.start_time, b.slot_id, b.tenant_id, s.price_per_hour
         FROM bookings b
         JOIN slots s ON b.slot_id = s.id
         WHERE b.id = ?`;
      let params = [id];

      if (req.user.role === "customer") {
        queryStr += " AND b.user_id = ?";
        params.push(req.user.id);
      } else if (req.user.role === "company_admin") {
        queryStr += " AND b.tenant_id = ?";
        params.push(req.user.tenant_id);
      } // super_admin can do anyone

      // Get booking and slot price
      const [rows] = await connection.query(queryStr, params);

      if (rows.length === 0) {
        throw new Error("Booking not found or not authorized.");
      }

      const booking = rows[0];
      const startTime = new Date(booking.start_time);
      const diffMs = exitTime.getTime() - startTime.getTime();
      const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      const amount = hours * Number(booking.price_per_hour);

      // Insert payment
      const method = req.body.method || "card";
      await connection.query(
        "INSERT INTO payments (tenant_id, booking_id, amount, method, status, created_at) VALUES (?, ?, ?, ?, 'paid', NOW())",
        [booking.tenant_id, booking.id, amount, method],
      );

      // Update booking as completed
      await connection.query(
        "UPDATE bookings SET status = 'completed', end_time = ?, total_amount = ? WHERE id = ?",
        [exitTime, amount, booking.id],
      );

      // Free up the slot
      await connection.query(
        "UPDATE slots SET status = 'available' WHERE id = ?",
        [booking.slot_id],
      );

      await connection.commit();
      connection.release();

      return res.json({
        success: true,
        message: "Booking completed and payment recorded",
        data: { booking_id: booking.id, hours, amount },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Exit booking error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to complete booking" });
  }
});

// Get payments for current user (or tenant if admin)
router.get("/payments", async (req, res) => {
  try {
    let queryStr = `SELECT p.* 
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE p.tenant_id = ?
       ORDER BY p.created_at DESC`;
    let params = [req.user.tenant_id];

    if (req.user.role === "customer") {
      queryStr = `SELECT p.* 
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         WHERE b.user_id = ?
         ORDER BY p.created_at DESC`;
      params = [req.user.id];
    }

    const [rows] = await pool.query(queryStr, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get payments error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
});
// Basic dashboard stats for the user (total bookings, active bookings, total spent)
router.get("/dashboard/stats", async (req, res) => {
  try {
    const userId = req.user.id;

    // Customers and admins can both technically hit this, but it focuses on their personal bookings
    const [[bookingRow]] = await pool.query(
      "SELECT COUNT(*) AS totalBookings, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeBookings FROM bookings WHERE user_id = ?",
      [userId],
    );

    const [[revenueRow]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS totalSpent FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.user_id = ?",
      [userId],
    );

    return res.json({
      success: true,
      data: {
        totalBookings: Number(bookingRow.totalBookings || 0),
        activeBookings: Number(bookingRow.activeBookings || 0),
        totalSpent: Number(revenueRow.totalSpent || 0),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("User Dashboard stats error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load dashboard stats" });
  }
});

export default router;
