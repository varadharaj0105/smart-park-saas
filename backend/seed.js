import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        console.log('Connected to MySQL server.');

        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        console.log('Running schema.sql...');
        await connection.query(schemaSql);
        console.log('schema.sql executed successfully.');

        const seedSql = fs.readFileSync(path.join(__dirname, 'seed_data.sql'), 'utf-8');
        console.log('Running seed_data.sql...');
        await connection.query(seedSql);
        console.log('seed_data.sql executed successfully.');

    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await connection.end();
    }
}

runSeed();
