"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    host: "asme-db.cn2o0ao8aj7i.us-east-2.rds.amazonaws.com",
    user: "asmedb",
    password: "asmedbdb",
    database: "asme_intial",
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});
// GITHUB_TOKEN=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
// OPENAI_API_KEY=sk-Ew9D6Nly-l7jX-TBKyOAGWnD3alcsZPSLPODi-2RtRT3BlbkFJet5HHHqauJ58_46iZGKeXVffgRo4sWq6OCwsTkprgA
// DB_USER=asmedb
// DB_HOST=asme-ds.cn2o0ao8aj7i.us-east-2.rds.amazonaws.com
// DB_NAME=asme_intial
// DB_PASSWORD=asmedbdb
// DB_PORT=5432
// DB_SSL=false
// PORT= 8080
exports.pool.on('connect', () => {
    console.log('Database connected successfully');
});
exports.pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});
