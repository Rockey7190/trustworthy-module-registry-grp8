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
    user: "asmedb",
    host: "asme-db.cn2o0ao8aj7i.us-east-2.rds.amazonaws.com",
    database: "asme_intial",
    password: "asmedbdb",
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
});
exports.pool.on('connect', () => {
    console.log('Database connected successfully');
});
exports.pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});
