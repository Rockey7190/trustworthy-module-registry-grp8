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
const express_1 = require("express");
const dbConnection_1 = require("../../Config/dbConnection");
const router = (0, express_1.Router)();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { RegEx } = req.body;
    if (!RegEx || typeof RegEx !== 'string') {
        return res.status(400).send({ message: 'Invalid or missing RegEx in request body.' });
    }
    try {
        const query = `
            SELECT DISTINCT p.package_id AS id, p.package_name AS name, v.version
            FROM packages p
            LEFT JOIN package_versions v ON p.package_id = v.package_id
            WHERE (p.package_name ~* $1 OR COALESCE(v.readme_content, '') ~* $1);
        `;
        const result = yield dbConnection_1.pool.query(query, [RegEx]);
        console.log('Query results:', result.rows); // Log raw results for debugging
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'No packages found matching the provided RegEx.' });
        }
        res.status(200).send(result.rows); // Return raw results for debugging
    }
    catch (error) {
        console.error('Error searching packages by RegEx:', error.message || error);
        res.status(500).send({
            message: 'Failed to search packages by RegEx.',
            error: error.message || 'Unknown error',
        });
    }
}));
exports.default = router;
