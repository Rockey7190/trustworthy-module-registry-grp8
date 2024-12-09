"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.validatePassword = validatePassword;
exports.validateUsername = validateUsername;
exports.isValidInput = isValidInput;
exports.checkForDuplicate = checkForDuplicate;
const dbUtil_1 = require("../../Util/dbUtil");
const bcrypt = require('bcryptjs');
const validator = require("validator");
function hashPassword(plainPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const saltRounds = 10;
        const hashedPassword = yield bcrypt.hash(plainPassword, saltRounds);
        return hashedPassword;
    });
}
function verifyPassword(plainPassword, hashedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const isMatch = yield bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    });
}
function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
}
function validateUsername(username) {
    return /^[a-zA-Z0-9_]+$/.test(username);
}
function isValidInput(input) {
    const invalidPatterns = /['"%;()=]/;
    return !invalidPatterns.test(input);
}
function checkForDuplicate(client, username, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.query(dbUtil_1.CHECK_DUPLICATE_QUERY, [username, email]);
        return result.rows.length > 0;
    });
}
