import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: "asmedb",
    host: "asme-db.cn2o0ao8aj7i.us-east-2.rds.amazonaws.com",
    database: "asme_intial",
    password: "asmedbdb",
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
