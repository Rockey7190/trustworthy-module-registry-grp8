import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: "",
    host: "",
    database: "",
    password: "",
    port: 5432,
    ssl: {
        rejectUnauthorized: false // This bypasses SSL certificate verification for local dev
    },
});

pool.on('connect', () => {
    console.log('Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});