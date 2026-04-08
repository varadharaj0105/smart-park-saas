import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

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
  console.log("🚀 Starting Demo Data Generation (Full Platform)...");

  try {
    // 1. Create New Companies
    for (let i = 0; i < COMPANY_NAMES.length; i++) {
        await pool.query(
            "INSERT INTO companies (name, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            [COMPANY_NAMES[i], LOCATIONS[i].lat, LOCATIONS[i].lng]
        );
    }

    // 2. Get ALL company IDs (new and existing)
    const allCompsRes = await pool.query("SELECT id FROM companies");
    const companyIds = allCompsRes.rows.map(r => r.id);
    console.log(`✅ ${companyIds.length} companies found and ready.`);

    // 3. Create slots for any company that has none
    for (const tenantId of companyIds) {
        const slotCheck = await pool.query("SELECT count(*) FROM slots WHERE tenant_id = $1", [tenantId]);
        if (parseInt(slotCheck.rows[0].count) < 5) {
            console.log(`🕒 Creating initial slots for tenant ${tenantId}...`);
            const types = ['Car', 'SUV', 'Bike'];
            const prices = { 'Car': 5.0, 'SUV': 8.0, 'Bike': 2.5 };
            for (let num = 1; num <= 10; num++) {
                const type = types[Math.floor(Math.random() * types.length)];
                await pool.query(
                    "INSERT INTO slots (tenant_id, slot_number, floor, type, status, price_per_hour) VALUES ($1, $2, $3, $4, 'available', $5)",
                    [tenantId, `S-${num}`, "1", type, prices[type]]
                );
            }
        }
    }

    // 4. Find/Create Demo User
    let userRes = await pool.query("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
    let userId = userRes.rows.length > 0 ? userRes.rows[0].id : null;
    if (!userId) {
        const email = `demo_${crypto.randomBytes(2).toString('hex')}@demo.com`;
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'customer') RETURNING id",
            ["Demo Customer", email, "secret"]
        );
        userId = newUser.rows[0].id;
    }

    // 5. Generate Historical Data for ALL companies
    console.log("🕒 Generating 90 days of history for EVERY company...");
    const now = new Date();
    let totalAdded = 0;

    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const dayDate = new Date();
        dayDate.setDate(now.getDate() - dayOffset);
        
        for (const tenantId of companyIds) {
            // 3-8 bookings per day per company
            const dailyCount = 3 + Math.floor(Math.random() * 5);
            const slots = await pool.query("SELECT id, price_per_hour FROM slots WHERE tenant_id = $1", [tenantId]);
            if (slots.rows.length === 0) continue;

            for (let i = 0; i < dailyCount; i++) {
                const slot = slots.rows[Math.floor(Math.random() * slots.rows.length)];
                const startTime = new Date(dayDate);
                startTime.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
                
                const duration = 1 + Math.floor(Math.random() * 3);
                const amount = parseFloat(slot.price_per_hour) * duration;

                const bRes = await pool.query(
                    "INSERT INTO bookings (tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status, total_amount, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8) RETURNING id",
                    [tenantId, userId, slot.id, `DL-${1000 + Math.floor(Math.random() * 9000)}`, startTime, duration, amount, startTime]
                );

                await pool.query(
                    "INSERT INTO payments (tenant_id, booking_id, amount, method, status, created_at) VALUES ($1, $2, $3, 'card', 'paid', $4)",
                    [tenantId, bRes.rows[0].id, amount, startTime]
                );
                totalAdded++;
            }
        }
    }

    console.log(`✨ DONE! Generated ${totalAdded} across all companies.`);
    process.exit(0);

  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

generateDemoData();
