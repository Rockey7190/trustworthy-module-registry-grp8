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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//fetchVersion.ts
const express_1 = require("express");
const dbConnection_1 = require("../../Config/dbConnection");
const semver_1 = __importDefault(require("semver"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { packageName, version } = req.query;
    if (!packageName) {
        return res.status(400).send({ message: 'Package name is required.' });
    }
    try {
        // Query the database for all versions of the package
        const query = `
            SELECT v.version
            FROM package_versions v
            INNER JOIN packages p ON v.package_id = p.package_id
            WHERE p.package_name = $1
            ORDER BY v.created_at DESC;
        `;
        const result = yield dbConnection_1.pool.query(query, [packageName]);
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'No versions found for the specified package.' });
        }
        const versions = result.rows.map((row) => row.version);
        let filteredVersions;
        if (version) {
            // Apply version filtering
            if (semver_1.default.valid(version)) {
                // Exact version
                filteredVersions = versions.filter((v) => semver_1.default.eq(v, version));
            }
            else if (version.includes('-')) {
                // Bounded range (e.g., "1.2.3-2.1.0")
                const [minVersion, maxVersion] = version.split('-');
                filteredVersions = versions.filter((v) => semver_1.default.gte(v, minVersion) && semver_1.default.lte(v, maxVersion));
            }
            else if (version.startsWith('~')) {
                // Tilde range (e.g., "~1.2.0")
                filteredVersions = versions.filter((v) => semver_1.default.satisfies(v, version));
            }
            else if (version.startsWith('^')) {
                // Carat range (e.g., "^1.2.0")
                filteredVersions = versions.filter((v) => semver_1.default.satisfies(v, version));
            }
            else {
                return res.status(400).send({ message: 'Invalid version specification.' });
            }
        }
        else {
            // If no version filter is provided, return all versions
            filteredVersions = versions;
        }
        res.status(200).send({ packageName, versions: filteredVersions });
    }
    catch (error) {
        console.error('Error fetching versions:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch versions.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
