import dotenv from "dotenv";
import mysql from "mysql2/promise";

// Load environment variables from .env
dotenv.config();

// Create a MySQL connection pool using mysql2
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional helper to get a dedicated connection
export async function getConnection() {
  return pool.getConnection();
}

// Test the database connection when the server starts
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    // eslint-disable-next-line no-console
    console.log("✅ MySQL connected successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
}

