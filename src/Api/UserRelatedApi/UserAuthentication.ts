import { pool } from '../../Config/dbConnection';
import express from 'express';
import * as DB_UTIL  from '../../Util/dbUtil';
import * as validation from '../ApiHelper/userAuthenticationHelper'
import validator from 'validator';
import { PoolClient } from 'pg';


const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password, email, is_admin, group_id } = req.body;

    if(!validation.validateUsername(username)){
        return res.status(400).send("Invalid username. Only alphanumeric characters are allowed.");
    }

    if(!validation.validatePassword(password)){
        return res.status(400).send("Invalid password. It must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.");
    }

    if(!validation.isValidInput(username) || !validation.isValidInput(password)) {
        return res.status(400).send("Invalid input detected. Please avoid using special characters.");
    } 

    if (!validator.isEmail(email)) {
        return res.status(400).send("Invalid email format.");
    }

    if (typeof is_admin !== 'boolean') {
        return res.status(400).send("Invalid id_admin. It must be a boolean value.");
    }
    
    if (group_id !== null && typeof group_id !== 'number') {
        return res.status(400).send("Invalid group_id. It must be a number or null.");
    }

    let client: PoolClient | undefined; 

    try {
        const client = await pool.connect();
        const isDuplicate = await validation.checkForDuplicate(client, username, email);
        if(isDuplicate){
            return res.status(400).send({ error: 'Username or email already exists.' });
        }
        
        const hashedPassword = await validation.hashPassword(password) 
        await client.query(DB_UTIL.INSERT_USER_QUERY, [username, hashedPassword, email, is_admin, group_id]);
        res.status(201).send({ message: 'User registered successfully' });
        
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ error: 'Registration failed' });
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if(!validation.isValidInput(username) || !validation.isValidInput(password)) {
        return res.status(400).send("Invalid input detected. Please avoid using special characters.");
    }

    try {
        const client = await pool.connect();
        const result = await client.query(DB_UTIL.SELECT_USER_INFO, [username]);
        client.release();

        if (result.rows.length === 0) {
            res.status(401).send({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const matchPassword = await validation.verifyPassword(password, user.password_hash);

        if (!matchPassword) {
            return res.status(401).send({ error: 'Invalid username or password' });
        }

        res.status(200).send({ message: 'Authentication successful' });

    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send({ error: 'Authentication failed' });
    }
});

router.post('/authenticate', async (req, res) => {
    const { User, Secret } = req.body;

    if (!User || !Secret || !User.name || !Secret.password) {
        return res.status(400).send({ error: 'Invalid request format.' });
    }

    const { name: username, isAdmin } = User;
    const { password } = Secret;

    if (!validation.isValidInput(username) || !validation.isValidInput(password)) {
        return res.status(400).send("Invalid input detected. Please avoid using special characters.");
    }

    try {
        const client = await pool.connect();
        const result = await client.query(DB_UTIL.SELECT_USER_INFO, [username]);
        client.release();

        if (result.rows.length === 0) {
            return res.status(401).send({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const matchPassword = await validation.verifyPassword(password, user.password_hash);

        if (!matchPassword) {
            return res.status(401).send({ error: 'Invalid username or password' });
        }

        const mockToken = "rhfr^&fjh&efek5575!$!7384wrb"; 
        res.status(200).send({
            tokenType: 'bearer',
            accessToken: mockToken,
            message: 'Authentication successful',
        });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send({ error: 'Authentication failed' });
    }
});


router.delete('/delete/:id', async (req, res) => {
    const userId = req.params.id;
    let client: PoolClient | undefined;

    try {
        client = await pool.connect();
        const result = await client.query(DB_UTIL.DELETE_USER, [userId]);

        if ((result.rowCount ?? 0) > 0) {
            res.status(200).send({ message: 'User deleted successfully' });
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({ error: 'Deletion failed' });
    }finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
});


router.get('/userInfo/:id', async (req, res) => {
    const userId = req.params.id;

    if (!/^\d+$/.test(userId)) { 
        return res.status(400).send({ error: 'Invalid user ID format' });
    }

    let client;
    try {
        client = await pool.connect();

        const result = await client.query(DB_UTIL.SELECT_ONE_USER_INFO, [userId]);

        if (result.rows.length > 0) {
            res.status(200).send(result.rows[0]);
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send({ error: 'Failed to retrieve user' });
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
});


router.get('/users', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(DB_UTIL.SELECT_ALL_USER_INFO);

        if (result.rows.length === 0) {
            return res.status(200).send({ message: 'No users found', data: [] });
        }

        res.status(200).send({ message: 'Users retrieved successfully', data: result.rows });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send({ error: 'Failed to retrieve users' });
    } finally {
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
});




export default router;
