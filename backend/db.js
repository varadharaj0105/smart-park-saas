import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the database connection when the server starts
export async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    // eslint-disable-next-line no-console
    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ PostgreSQL connection failed:", error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
  }
}
