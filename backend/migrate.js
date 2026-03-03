import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_park_saas',
    });

    try {
        console.log('Adding latitude and longitude to companies table...');
        // Add columns
        try {
            await connection.query(`
        ALTER TABLE companies 
        ADD COLUMN latitude DECIMAL(10,8) DEFAULT NULL,
        ADD COLUMN longitude DECIMAL(11,8) DEFAULT NULL;
      `);
        } catch (e) {
            console.log('Columns might already exist, continuing...');
        }

        // Set some default coordinates for our seed data companies around Delhi
        console.log('Setting default coordinates for existing companies...');

        // Downtown - Connaught Place area
        await connection.query(`UPDATE companies SET latitude = 28.6315, longitude = 77.2167 WHERE name = 'Downtown Parking Co.'`);

        // Uptown - Hauz Khas area
        await connection.query(`UPDATE companies SET latitude = 28.5494, longitude = 77.2001 WHERE name = 'Uptown Parking Solutions'`);

        // Metro - near India Gate
        await connection.query(`UPDATE companies SET latitude = 28.6129, longitude = 77.2295 WHERE name = 'Metro Park Inc.'`);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrate();
