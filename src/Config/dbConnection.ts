import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// export const pool = new Pool({
//     user: "asmedb",
//     host: "asme-db.cn2o0ao8aj7i.us-east-2.rds.amazonaws.com",
//     database: "asme_intial",
//     password: "asmedbdb",
//     port: 5432,
//     ssl: {
//         rejectUnauthorized: false // This bypasses SSL certificate verification for local dev
//     },
// });


export const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432
});

pool.on('connect', () => {
    console.log('Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});
