"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELECT_ALL_USER_INFO = exports.SELECT_ONE_USER_INFO = exports.DELETE_USER = exports.SELECT_USER_INFO = exports.CHECK_DUPLICATE_QUERY = exports.INSERT_USER_QUERY = void 0;
exports.INSERT_USER_QUERY = `INSERT INTO users (username, password_hash, email, is_admin, group_id) VALUES ($1, $2, $3, $4, $5)`;
exports.CHECK_DUPLICATE_QUERY = 'SELECT * FROM users WHERE username = $1 OR email = $2';
exports.SELECT_USER_INFO = `SELECT * FROM users WHERE username = $1`;
exports.DELETE_USER = `DELETE FROM users WHERE user_id = $1`;
exports.SELECT_ONE_USER_INFO = `SELECT * FROM users WHERE user_id = $1`;
exports.SELECT_ALL_USER_INFO = `SELECT * FROM users`;
