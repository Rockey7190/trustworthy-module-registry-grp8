export const INSERT_USER_QUERY = `INSERT INTO users (username, password_hash, email, is_admin, group_id) VALUES ($1, $2, $3, $4, $5)`;
export const CHECK_DUPLICATE_QUERY = 'SELECT * FROM users WHERE username = $1 OR email = $2';
export const SELECT_USER_INFO = `SELECT * FROM users WHERE username = $1`;
export const DELETE_USER = `DELETE FROM users WHERE user_id = $1`;
export const SELECT_ONE_USER_INFO = `SELECT * FROM users WHERE user_id = $1`;
export const SELECT_ALL_USER_INFO = `SELECT * FROM users`;