import { pool } from "./db.js";
import bcrypt from "bcryptjs";

async function seedNewAdmin() {
  try {
    const email = "varadharaj2005rock@gmail.com";
    const password = "password"; // Temporary password
    const hash = await bcrypt.hash(password, 10);
    
    console.log(`Seeding ${email} as super_admin...`);
    
    // Ensure company ID 1 exists (Platform)
    const compRes = await pool.query("SELECT id FROM companies WHERE id = 1");
    if (compRes.rows.length === 0) {
      await pool.query("INSERT INTO companies (id, name) VALUES (1, 'Platform')");
    }

    await pool.query(`
      INSERT INTO users (name, email, password, role, tenant_id, company_name) 
      VALUES ('New Super Admin', $1, $2, 'super_admin', 1, 'Platform')
      ON CONFLICT (email) 
      DO UPDATE SET role = 'super_admin', tenant_id = 1
    `, [email, hash]);
    
    console.log("New Super Admin seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    process.exit();
  }
}

seedNewAdmin();
