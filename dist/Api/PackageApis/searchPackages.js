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
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, page, limit } = req.query;
    if (!query) {
        return res.status(400).send({ message: 'Search query is required.' });
    }
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    if (pageNumber < 1 || pageSize < 1) {
        return res.status(400).send({ message: 'Page and limit must be positive integers.' });
    }
    try {
        // Count total matching packages for pagination metadata
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM packages p
            INNER JOIN package_versions pv ON p.package_id = pv.package_id
            WHERE p.package_name ~* $1 OR pv.readme_content ~* $1;
        `;
        const countResult = yield dbConnection_1.pool.query(countQuery, [query]);
        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / pageSize);
        const offset = (pageNumber - 1) * pageSize;
        if (pageNumber > totalPages && totalPages > 0) {
            return res.status(400).send({ message: 'Page number exceeds total pages.' });
        }
        // Fetch matching packages with pagination
        const searchQuery = `
            SELECT p.package_id, p.package_name, pv.version, pv.readme_content, p.uploaded_by, pv.created_at
            FROM packages p
            INNER JOIN package_versions pv ON p.package_id = pv.package_id
            WHERE p.package_name ~* $1 OR pv.readme_content ~* $1
            ORDER BY pv.created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        const result = yield dbConnection_1.pool.query(searchQuery, [query, pageSize, offset]);
        res.status(200).send({
            metadata: {
                totalCount,
                totalPages,
                currentPage: pageNumber,
                pageSize,
            },
            packages: result.rows,
        });
    }
    catch (error) {
        console.error('Error searching packages:', error.message || error);
        res.status(500).send({ message: 'Failed to search packages.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
