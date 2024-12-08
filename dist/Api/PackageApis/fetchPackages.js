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
    const queries = req.body;
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = 10; // Default limit for pagination
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).send({ message: 'No valid query fields provided.' });
    }
    try {
        const results = [];
        for (const query of queries) {
            let sqlQuery;
            let sqlParams;
            if (query.Name === '*') {
                // Fetch all packages
                sqlQuery = `
                    SELECT v.package_id AS id, p.package_name AS name, v.version
                    FROM package_versions v
                    INNER JOIN packages p ON v.package_id = p.package_id
                    LIMIT $1 OFFSET $2
                `;
                sqlParams = [limit, offset];
            }
            else if (query.Name) {
                // Fetch packages by name
                sqlQuery = `
                    SELECT v.package_id AS id, p.package_name AS name, v.version
                    FROM package_versions v
                    INNER JOIN packages p ON v.package_id = p.package_id
                    WHERE p.package_name = $1
                    LIMIT $2 OFFSET $3
                `;
                sqlParams = [query.Name, limit, offset];
            }
            else if (query.Version) {
                // Fetch packages by version
                sqlQuery = `
                    SELECT v.package_id AS id, p.package_name AS name, v.version
                    FROM package_versions v
                    INNER JOIN packages p ON v.package_id = p.package_id
                    WHERE v.version = $1
                    LIMIT $2 OFFSET $3
                `;
                sqlParams = [query.Version, limit, offset];
            }
            else {
                continue; // Skip invalid query
            }
            const dbResult = yield dbConnection_1.pool.query(sqlQuery, sqlParams);
            results.push(...dbResult.rows);
        }
        res.status(200).send(results);
    }
    catch (error) {
        console.error('Error fetching packages:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch packages.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
