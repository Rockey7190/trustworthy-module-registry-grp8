import { CHECK_DUPLICATE_QUERY } from "../../Util/dbUtil";

const bcrypt = require('bcryptjs');
const validator = require("validator")

export async function hashPassword(plainPassword: any) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword; 

}

export async function verifyPassword(plainPassword: any, hashedPassword: any) {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    return isMatch;
}

export function validatePassword(password: any){
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
}

export function validateUsername(username: any) {
    return /^[a-zA-Z0-9_]+$/.test(username);
}

export function isValidInput(input: any) {
    const invalidPatterns = /['"%;()=]/;
    return !invalidPatterns.test(input);
}

export async function checkForDuplicate(client: any, username: any, email: any){
    const result = await client.query(CHECK_DUPLICATE_QUERY, [username, email]);
    return result.rows.length > 0;
}

