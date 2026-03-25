import express from "express";
import { pool } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(["customer", "company_admin", "super_admin"]));

// Get company locations and slot availability
router.get("/locations", async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === "company_admin") {
      query = `
        SELECT c.id, c.name, c.latitude, c.longitude,
               COUNT(s.id) as total_slots,
               SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_slots
        FROM companies c
        LEFT JOIN slots s ON c.id = s.tenant_id
        WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND c.id = $1
        GROUP BY c.id
      `;
      params = [req.user.tenant_id];
    } else {
      query = `
        SELECT c.id, c.name, c.latitude, c.longitude,
               COUNT(s.id) as total_slots,
               SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_slots
        FROM companies c
        LEFT JOIN slots s ON c.id = s.tenant_id
        WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
        GROUP BY c.id
      `;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    const data = rows.map((r) => ({
      ...r,
      total_slots: Number(r.total_slots || 0),
      available_slots: Number(r.available_slots || 0),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get locations error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch locations" });
  }
});

// Get slots
router.get("/slots", async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === "customer") {
      query = "SELECT s.*, c.name as company_name FROM slots s LEFT JOIN companies c ON s.tenant_id = c.id";
      params = [];
    } else {
      query = "SELECT s.*, c.name as company_name FROM slots s LEFT JOIN companies c ON s.tenant_id = c.id WHERE s.tenant_id = $1";
      params = [req.user.tenant_id];
    }

    const { rows } = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get slots error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch slots" });
  }
});

// Get bookings
router.get("/bookings", async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === "customer") {
      query = `
        SELECT b.*, c.name as company_name
        FROM bookings b
        LEFT JOIN companies c ON b.tenant_id = c.id
        WHERE b.user_id = $1
        ORDER BY b.start_time DESC`;
      params = [req.user.id];
    } else {
      query = `
        SELECT b.*, c.name as company_name
        FROM bookings b
        LEFT JOIN companies c ON b.tenant_id = c.id
        WHERE b.tenant_id = $1
        ORDER BY b.start_time DESC`;
      params = [req.user.tenant_id];
    }

    const { rows } = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get bookings error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
});

// Create a new booking (transaction)
router.post("/bookings", async (req, res) => {
  const { slot_id, vehicle_number, start_time, duration } = req.body;

  if (!slot_id || !vehicle_number || !start_time || !duration) {
    return res.status(400).json({
      success: false,
      message: "slot_id, vehicle_number, start_time and duration are required",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const slotRes = await client.query("SELECT tenant_id FROM slots WHERE id = $1", [slot_id]);
    if (slotRes.rows.length === 0) throw new Error("Slot not found");
    const actualTenantId = slotRes.rows[0].tenant_id;

    const result = await client.query(
      "INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status) VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id",
      [actualTenantId, req.user.id, slot_id, vehicle_number, start_time, duration]
    );

    await client.query(
      "UPDATE slots SET status = 'occupied' WHERE id = $1 AND tenant_id = $2",
      [slot_id, actualTenantId]
    );

    await client.query("COMMIT");
    return res.json({ success: true, booking_id: result.rows[0].id });
  } catch (error) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Create booking error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create booking" });
  } finally {
    client.release();
  }
});

// Cancel a booking (transaction)
router.delete("/bookings/:id", async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let findQuery;
    let findParams;
    if (req.user.role === "customer") {
      findQuery = "SELECT slot_id, tenant_id FROM bookings WHERE id = $1 AND user_id = $2";
      findParams = [id, req.user.id];
    } else {
      findQuery = "SELECT slot_id, tenant_id FROM bookings WHERE id = $1 AND tenant_id = $2";
      findParams = [id, req.user.tenant_id];
    }

    const bookingRes = await client.query(findQuery, findParams);
    if (bookingRes.rows.length === 0) throw new Error("Booking not found");

    let updateQuery;
    if (req.user.role === "customer") {
      updateQuery = "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2";
    } else {
      updateQuery = "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND tenant_id = $2";
    }
    await client.query(updateQuery, findParams);

    const { slot_id, tenant_id } = bookingRes.rows[0];
    await client.query(
      "UPDATE slots SET status = 'available' WHERE id = $1 AND tenant_id = $2",
      [slot_id, tenant_id]
    );

    await client.query("COMMIT");
    return res.json({ success: true, message: "Booking cancelled" });
  } catch (error) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Cancel booking error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to cancel booking" });
  } finally {
    client.release();
  }
});

// Exit + payment (transaction)
router.post("/bookings/:id/exit", async (req, res) => {
  const { id } = req.params;
  const exitTime = new Date();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let queryStr = `
      SELECT b.id, b.start_time, b.slot_id, b.tenant_id, s.price_per_hour
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      WHERE b.id = $1`;
    const params = [id];

    if (req.user.role === "customer") {
      queryStr += ` AND b.user_id = $2`;
      params.push(req.user.id);
    } else if (req.user.role === "company_admin") {
      queryStr += ` AND b.tenant_id = $2`;
      params.push(req.user.tenant_id);
    }

    const bookingRes = await client.query(queryStr, params);
    if (bookingRes.rows.length === 0) throw new Error("Booking not found or not authorized.");

    const booking = bookingRes.rows[0];
    const startTime = new Date(booking.start_time);
    const diffMs = exitTime.getTime() - startTime.getTime();
    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    const amount = hours * Number(booking.price_per_hour);
    const method = req.body.method || "card";

    await client.query(
      "INSERT INTO payments (tenant_id, booking_id, amount, method, status, created_at) VALUES ($1, $2, $3, $4, 'paid', NOW())",
      [booking.tenant_id, booking.id, amount, method]
    );

    await client.query(
      "UPDATE bookings SET status = 'completed', end_time = $1, total_amount = $2 WHERE id = $3",
      [exitTime, amount, booking.id]
    );

    await client.query("UPDATE slots SET status = 'available' WHERE id = $1", [booking.slot_id]);

    await client.query("COMMIT");
    return res.json({
      success: true,
      message: "Booking completed and payment recorded",
      data: { booking_id: booking.id, hours, amount },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Exit booking error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to complete booking" });
  } finally {
    client.release();
  }
});

// Get payments
router.get("/payments", async (req, res) => {
  try {
    let queryStr;
    let params;

    if (req.user.role === "customer") {
      queryStr = `
        SELECT p.* FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE b.user_id = $1
        ORDER BY p.created_at DESC`;
      params = [req.user.id];
    } else {
      queryStr = `
        SELECT p.* FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE p.tenant_id = $1
        ORDER BY p.created_at DESC`;
      params = [req.user.tenant_id];
    }

    const { rows } = await pool.query(queryStr, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get payments error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
});

// User dashboard stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const userId = req.user.id;

    const bookingRes = await pool.query(
      `SELECT COUNT(*) AS "totalBookings",
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS "activeBookings"
       FROM bookings WHERE user_id = $1`,
      [userId]
    );

    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS "totalSpent"
       FROM payments p JOIN bookings b ON p.booking_id = b.id
       WHERE b.user_id = $1`,
      [userId]
    );

    const bookingRow = bookingRes.rows[0];
    const revenueRow = revenueRes.rows[0];

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
