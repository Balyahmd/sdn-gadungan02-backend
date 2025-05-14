import pg from 'pg';
import dotenv from 'dotenv';
import { setTimeout as delay } from 'timers/promises';

dotenv.config();

const { Pool } = pg;

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20
};

const pool = new Pool(poolConfig);

let retries = 3;
while (retries > 0) {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        break;
    } catch (err) {
        retries--;
        console.error(`❌ Database connection failed (${retries} retries left):`, err.message);
        if (retries === 0) {
            console.error('Fatal: Could not connect to database after multiple attempts');
            process.exit(1);
        }
        await delay(2000);
    }
}

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

export default pool;