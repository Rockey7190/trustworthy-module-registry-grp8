import { pool } from '../../Config/dbConnection';
import express from 'express';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password_hash, email } = req.body;
    
    try {
        const client = await pool.connect();
        const query = `INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)`;
        await client.query(query, [username, password_hash, email]);
        client.release(); // Release the connection back to the pool
        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password_hash } = req.body;

    try {
        const client = await pool.connect();
        const query = `SELECT * FROM users WHERE username = $1 AND password_hash = $2`;
        const result = await client.query(query, [username, password_hash]);
        client.release();

        if (result.rows.length > 0) {
            res.status(200).send({ message: 'Authentication successful', user: result.rows[0] });
        } else {
            res.status(401).send({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send({ error: 'Authentication failed' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const client = await pool.connect();
        const query = `DELETE FROM users WHERE id = $1`;
        const result = await client.query(query, [userId]);
        client.release();

        if ((result.rowCount ?? 0) > 0) {
            res.status(200).send({ message: 'User deleted successfully' });
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({ error: 'Deletion failed' });
    }
});

router.get('/userInfo/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const client = await pool.connect();
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await client.query(query, [userId]);
        client.release();

        if (result.rows.length > 0) {
            res.status(200).send(result.rows[0]);
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send({ error: 'Failed to retrieve user' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const client = await pool.connect();
        const query = `SELECT * FROM users`;
        const result = await client.query(query);
        client.release();

        res.status(200).send(result.rows);
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send({ error: 'Failed to retrieve users' });
    }
});



export default router;
