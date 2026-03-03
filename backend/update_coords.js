import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { pool } from './db.js';

async function updateLocations() {
    try {
        const connection = await pool.getConnection();

        console.log('Updating coordinates to Coimbatore, Peelamedu...');

        // Downtown - Peelamedu Main Road
        await connection.query(`UPDATE companies SET latitude = 11.0267, longitude = 77.0142 WHERE name = 'Downtown Parking Co.'`);

        // Uptown - Hope College/Avinashi Road
        await connection.query(`UPDATE companies SET latitude = 11.0229, longitude = 77.0262 WHERE name = 'Uptown Parking Solutions'`);

        // Metro - Tidel Park / Airport Road area
        await connection.query(`UPDATE companies SET latitude = 11.0354, longitude = 77.0346 WHERE name = 'Metro Park Inc.'`);

        // Fallback for others just to cluster around Peelamedu
        await connection.query(`UPDATE companies SET latitude = 11.0240, longitude = 77.0210 WHERE latitude IS NULL`);

        console.log('Locations updated successfully! Check your map.');
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

updateLocations();
