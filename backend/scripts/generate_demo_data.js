import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * generate_demo_data.js
 * Run from the backend directory: node scripts/generate_demo_data.js
 * 
 * This script populates the database with hundreds of historical records 
 * spanning the last 90 days to create "impressive" dashboard charts.
 */

const COMPANY_NAMES = [
  "Grand Mall Parking",
  "Central Plaza Garage",
  "Silver Towers Parking",
  "Airport Express Parking"
];

const LOCATIONS = [
  { lat: 28.5355, lng: 77.3910 }, // Noida
  { lat: 28.4595, lng: 77.0266 }, // Gurgaon
  { lat: 28.7041, lng: 77.1025 }, // Delhi North
  { lat: 28.5823, lng: 77.2994 }  // Mayur Vihar
];

async function generateDemoData() {
  console.log("🚀 Starting Demo Data Generation...");

  try {
    // 1. Create or Find Companies
    const companyIds = [];
    for (let i = 0; i < COMPANY_NAMES.length; i++) {
        const res = await pool.query(
            "INSERT INTO companies (name, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id",
            [COMPANY_NAMES[i], LOCATIONS[i].lat, LOCATIONS[i].lng]
        );
        if (res.rows.length > 0) {
            companyIds.push(res.rows[0].id);
        } else {
            const find = await pool.query("SELECT id FROM companies WHERE name = $1", [COMPANY_NAMES[i]]);
            companyIds.push(find.rows[0].id);
        }
    }
    console.log(`✅ ${companyIds.length} companies ready (IDs: ${companyIds.join(',')})`);

    // 2. Create slots for new companies if they don't have enough
    for (const tenantId of companyIds) {
        const slotCheck = await pool.query("SELECT count(*) FROM slots WHERE tenant_id = $1", [tenantId]);
        if (parseInt(slotCheck.rows[0].count) < 20) {
            console.log(`🕒 Creating slots for tenant ${tenantId}...`);
            const types = ['Car', 'SUV', 'Bike'];
            const prices = { 'Car': 5.0, 'SUV': 8.0, 'Bike': 2.5 };
            for (let floor = 1; floor <= 3; floor++) {
                for (let num = 1; num <= 10; num++) {
                    const type = types[Math.floor(Math.random() * types.length)];
                    await pool.query(
                        "INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour) VALUES ($1, $2, $3, $4, 'available', $5)",
                        [tenantId, `${String.fromCharCode(64 + floor)}-${num}`, floor.toString(), type, prices[type]]
                    );
                }
            }
        }
    }

    // 3. Find some users or create a "Demo User"
    let userRes = await pool.query("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
    let userId;
    if (userRes.rows.length === 0) {
        const email = `demo_${crypto.randomBytes(4).toString('hex')}@demo.com`;
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
            ["Demo Customer", email, "hashed_pass", "customer"]
        );
        userId = newUser.rows[0].id;
    } else {
        userId = userRes.rows[0].id;
    }

    // 4. Generate Historical Bookings/Payments
    console.log("🕒 Generating historical bookings (Last 90 days)... This may take a minute.");
    const now = new Date();
    let bookingCount = 0;

    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const dayDate = new Date();
        dayDate.setDate(now.getDate() - dayOffset);
        
        // Random number of bookings per day (5 to 15)
        const dailyCount = 5 + Math.floor(Math.random() * 10);

        for (let i = 0; i < dailyCount; i++) {
            const tenantId = companyIds[Math.floor(Math.random() * companyIds.length)];
            const slotsRes = await pool.query("SELECT id, price_per_hour FROM slots WHERE tenant_id = $1 LIMIT 10", [tenantId]);
            if (slotsRes.rows.length === 0) continue;
            
            const slot = slotsRes.rows[Math.floor(Math.random() * slotsRes.rows.length)];
            
            // Random hour (peak weighting)
            let hour = Math.floor(Math.random() * 24);
            // 70% chance to be in peak hours (8-10am, 5-7pm)
            if (Math.random() > 0.3) {
                const peaks = [8, 9, 10, 17, 18, 19];
                hour = peaks[Math.floor(Math.random() * peaks.length)];
            }

            const startTime = new Date(dayDate);
            startTime.setHours(hour, Math.floor(Math.random() * 60));
            
            const duration = 1 + Math.floor(Math.random() * 4); // 1-5 hours
            const totalAmount = parseFloat(slot.price_per_hour) * duration;

            // Insert Booking
            const bookRes = await pool.query(
                "INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status, total_amount, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8) RETURNING id",
                [tenantId, userId, slot.id, `DL-${1000 + Math.floor(Math.random() * 8999)}`, startTime, duration, totalAmount, startTime]
            );

            // Insert Payment
            await pool.query(
                "INSERT INTO payments (tenant_id, booking_id, amount, method, status, created_at) VALUES ($1, $2, $3, 'card', 'paid', $4)",
                [tenantId, bookRes.rows[0].id, totalAmount, startTime]
            );

            bookingCount++;
        }
    }

    console.log(`✨ DONE! Generated ${bookingCount} bookings and payments.`);
    process.exit(0);

  } catch (err) {
    console.error("❌ ERROR generating demo data:", err);
    process.exit(1);
  }
}

generateDemoData();
