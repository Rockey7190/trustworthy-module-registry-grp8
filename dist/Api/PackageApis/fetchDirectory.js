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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1 || limit < 1) {
        return res.status(400).send({ message: 'Page and limit must be positive integers.' });
    }
    try {
        // Count total packages for pagination metadata
        const countResult = yield dbConnection_1.pool.query('SELECT COUNT(*) AS total FROM packages');
        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / limit);
        const offset = (page - 1) * limit;
        if (page > totalPages && totalPages > 0) {
            return res.status(400).send({ message: 'Page number exceeds total pages.' });
        }
        // Fetch paginated packages
        const query = `
            SELECT package_id, package_name, uploaded_by, created_at
            FROM packages
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2;
        `;
        const result = yield dbConnection_1.pool.query(query, [limit, offset]);
        res.status(200).send({
            metadata: {
                totalCount,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
            packages: result.rows,
        });
    }
    catch (error) {
        console.error('Error fetching directory:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch directory.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
