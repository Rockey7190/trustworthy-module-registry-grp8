"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbConnection_1 = require("../../Config/dbConnection");
const express_1 = __importDefault(require("express"));
const DB_UTIL = __importStar(require("../../Util/dbUtil"));
const validation = __importStar(require("../ApiHelper/userAuthenticationHelper"));
const validator_1 = __importDefault(require("validator"));
const router = express_1.default.Router();
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email, is_admin, group_id } = req.body;
    if (!validation.validateUsername(username)) {
        return res.status(400).send("Invalid username. Only alphanumeric characters are allowed.");
    }
    if (!validation.validatePassword(password)) {
        return res.status(400).send("Invalid password. It must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.");
    }
    if (!validation.isValidInput(username) || !validation.isValidInput(password)) {
        return res.status(400).send("Invalid input detected. Please avoid using special characters.");
    }
    if (!validator_1.default.isEmail(email)) {
        return res.status(400).send("Invalid email format.");
    }
    if (typeof is_admin !== 'boolean') {
        return res.status(400).send("Invalid id_admin. It must be a boolean value.");
    }
    if (group_id !== null && typeof group_id !== 'number') {
        return res.status(400).send("Invalid group_id. It must be a number or null.");
    }
    let client;
    try {
        const client = yield dbConnection_1.pool.connect();
        const isDuplicate = yield validation.checkForDuplicate(client, username, email);
        if (isDuplicate) {
            return res.status(400).send({ error: 'Username or email already exists.' });
        }
        const hashedPassword = yield validation.hashPassword(password);
        yield client.query(DB_UTIL.INSERT_USER_QUERY, [username, hashedPassword, email, is_admin, group_id]);
        res.status(201).send({ message: 'User registered successfully' });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ error: 'Registration failed' });
    }
    finally {
        if (client) {
            try {
                client.release();
            }
            catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!validation.isValidInput(username) || !validation.isValidInput(password)) {
        return res.status(400).send("Invalid input detected. Please avoid using special characters.");
    }
    try {
        const client = yield dbConnection_1.pool.connect();
        const result = yield client.query(DB_UTIL.SELECT_USER_INFO, [username]);
        client.release();
        if (result.rows.length === 0) {
            res.status(401).send({ error: 'Invalid username or password' });
        }
        const user = result.rows[0];
        const matchPassword = yield validation.verifyPassword(password, user.password_hash);
        if (!matchPassword) {
            return res.status(401).send({ error: 'Invalid username or password' });
        }
        res.status(200).send({ message: 'Authentication successful' });
    }
    catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send({ error: 'Authentication failed' });
    }
}));
// router.post('/authenticate', async (req, res) => {
//     const { User, Secret } = req.body;
//     // Validate input structure
//     if (!User || !Secret || !User.name || !Secret.password) {
//         return res.status(400).send({ error: 'Invalid request format.' });
//     }
//     const { name: username, isAdmin } = User;
//     const { password } = Secret;
//     if (!validation.isValidInput(username) || !validation.isValidInput(password)) {
//         return res.status(400).send("Invalid input detected. Please avoid using special characters.");
//     }
//     try {
//         const client = await pool.connect();
//         const result = await client.query(DB_UTIL.SELECT_USER_INFO, [username]);
//         client.release();
//         if (result.rows.length === 0) {
//             return res.status(401).send({ error: 'Invalid username or password' });
//         }
//         const user = result.rows[0];
//         const matchPassword = await validation.verifyPassword(password, user.password_hash);
//         if (!matchPassword) {
//             return res.status(401).send({ error: 'Invalid username or password' });
//         }
//         res.status(200).send({ message: 'Authentication successful' });
//     } catch (error) {
//         console.error('Error during authentication:', error);
//         res.status(500).send({ error: 'Authentication failed' });
//     }
// });
router.post('/authenticate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { User, Secret } = req.body;
    // Validate input structure
    if (!User || !Secret || !User.name || !Secret.password) {
        return res.status(400).send({ error: 'Invalid request format.' });
    }
    const { name: username, isAdmin } = User;
    const { password } = Secret;
    if (!validation.isValidInput(username) || !validation.isValidInput(password)) {
        return res.status(400).send("Invalid input detected. Please avoid using special characters.");
    }
    try {
        const client = yield dbConnection_1.pool.connect();
        const result = yield client.query(DB_UTIL.SELECT_USER_INFO, [username]);
        client.release();
        if (result.rows.length === 0) {
            return res.status(401).send({ error: 'Invalid username or password' });
        }
        const user = result.rows[0];
        const matchPassword = yield validation.verifyPassword(password, user.password_hash);
        if (!matchPassword) {
            return res.status(401).send({ error: 'Invalid username or password' });
        }
        const mockToken = "mock_bearer_token_1234567890"; // Static mock token
        res.status(200).send({
            tokenType: 'bearer',
            accessToken: mockToken,
            message: 'Authentication successful',
        });
    }
    catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send({ error: 'Authentication failed' });
    }
}));
router.delete('/delete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.params.id;
    let client;
    try {
        client = yield dbConnection_1.pool.connect();
        const result = yield client.query(DB_UTIL.DELETE_USER, [userId]);
        if (((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0) {
            res.status(200).send({ message: 'User deleted successfully' });
        }
        else {
            res.status(404).send({ error: 'User not found' });
        }
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({ error: 'Deletion failed' });
    }
    finally {
        if (client) {
            try {
                client.release();
            }
            catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
}));
router.get('/userInfo/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    if (!/^\d+$/.test(userId)) {
        return res.status(400).send({ error: 'Invalid user ID format' });
    }
    let client;
    try {
        client = yield dbConnection_1.pool.connect();
        const result = yield client.query(DB_UTIL.SELECT_ONE_USER_INFO, [userId]);
        if (result.rows.length > 0) {
            res.status(200).send(result.rows[0]);
        }
        else {
            res.status(404).send({ error: 'User not found' });
        }
    }
    catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send({ error: 'Failed to retrieve user' });
    }
    finally {
        if (client) {
            try {
                client.release();
            }
            catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
}));
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let client;
    try {
        client = yield dbConnection_1.pool.connect();
        const result = yield client.query(DB_UTIL.SELECT_ALL_USER_INFO);
        if (result.rows.length === 0) {
            return res.status(200).send({ message: 'No users found', data: [] });
        }
        res.status(200).send({ message: 'Users retrieved successfully', data: result.rows });
    }
    catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send({ error: 'Failed to retrieve users' });
    }
    finally {
        if (client) {
            try {
                client.release();
            }
            catch (releaseError) {
                console.error('Error releasing client:', releaseError);
            }
        }
    }
}));
exports.default = router;
