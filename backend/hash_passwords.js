import bcrypt from "bcryptjs";
import { pool } from "./db.js";

async function runMigration() {
  console.log("Starting password hash migration...");
  
  const client = await pool.connect();
  try {
    const { rows: users } = await client.query("SELECT id, password FROM users");
    
    let migratedCount = 0;
    
    for (const user of users) {
      // If it doesn't start with $2a$, $2b$, or $2y$, it's likely a plaintext password
      if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await client.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user.id]);
        migratedCount++;
      }
    }
    
    console.log(`Migration complete. Hashed ${migratedCount} plaintext passwords.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
