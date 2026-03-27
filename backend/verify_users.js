import { pool } from "./db.js";

async function verify() {
  try {
    const res = await pool.query("SELECT id, email, role, tenant_id FROM users");
    console.log("Current Users:");
    console.table(res.rows);
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    process.exit();
  }
}

verify();
