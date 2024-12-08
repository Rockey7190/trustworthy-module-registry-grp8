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
const express_1 = require("express");
const client_s3_1 = require("@aws-sdk/client-s3");
const dbConnection_1 = require("../../Config/dbConnection");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// @ts-ignore
const unzipper_1 = __importDefault(require("unzipper"));
const router = (0, express_1.Router)();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// Helper to get direct dependencies from a package.json
function getDirectDependencies(packageJsonPath) {
    if (!fs_1.default.existsSync(packageJsonPath))
        return [];
    const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
    return Object.keys(packageJson.dependencies || {});
}
// Helper to resolve dependency sizes recursively
function resolveDependencies(packageName_1) {
    return __awaiter(this, arguments, void 0, function* (packageName, resolved = new Set(), sizeMap = new Map()) {
        if (resolved.has(packageName))
            return { sizeMap, totalSize: 0 };
        resolved.add(packageName);
        // Fetch package version info from the database
        const packageResult = yield dbConnection_1.pool.query(`SELECT pv.s3_url, pv.version FROM package_versions pv 
         INNER JOIN packages p ON pv.package_id = p.package_id 
         WHERE p.package_name = $1 
         ORDER BY pv.created_at DESC LIMIT 1`, [packageName]);
        if (packageResult.rows.length === 0) {
            console.warn(`Package not found: ${packageName}`);
            return { sizeMap, totalSize: 0 };
        }
        const { s3_url: s3Url } = packageResult.rows[0];
        const key = s3Url.split('.com/')[1];
        // Check the size of the zip file on S3
        try {
            const headCommand = new client_s3_1.HeadObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key });
            const headResult = yield s3Client.send(headCommand);
            const size = headResult.ContentLength || 0;
            sizeMap.set(packageName, size);
            // Download and read package.json to get dependencies
            const tempDir = path_1.default.join(__dirname, 'temp', packageName);
            fs_1.default.mkdirSync(tempDir, { recursive: true });
            const downloadCommand = new client_s3_1.GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key });
            const { Body } = yield s3Client.send(downloadCommand);
            yield new Promise((resolve, reject) => {
                const extractStream = Body.pipe(unzipper_1.default.Extract({ path: tempDir }));
                extractStream.on('close', resolve);
                extractStream.on('error', reject);
            });
            const packageJsonPath = path_1.default.join(tempDir, 'package.json');
            const dependencies = getDirectDependencies(packageJsonPath);
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            // Resolve dependencies recursively
            let totalSize = size;
            for (const dep of dependencies) {
                const result = yield resolveDependencies(dep, resolved, sizeMap);
                totalSize += result.totalSize;
            }
            return { sizeMap, totalSize };
        }
        catch (error) {
            console.error(`Failed to fetch size for ${packageName}:`, error.message || error);
            return { sizeMap, totalSize: 0 };
        }
    });
}
router.get('/size-cost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const packageNamesQuery = req.query.packageNames;
    if (!packageNamesQuery) {
        return res.status(400).send({ message: 'Package names are required.' });
    }
    const packageNames = Array.isArray(packageNamesQuery)
        ? packageNamesQuery
        : [packageNamesQuery];
    const resolved = new Set();
    const sizeMap = new Map();
    try {
        let totalSize = 0;
        for (const pkg of packageNames) {
            const result = yield resolveDependencies(pkg, resolved, sizeMap);
            totalSize += result.totalSize;
        }
        res.status(200).send({
            totalSize,
            sizeBreakdown: Array.from(sizeMap.entries()).map(([pkg, size]) => ({ package: pkg, size })),
        });
    }
    catch (error) {
        console.error('Error calculating size cost:', error.message || error);
        res.status(500).send({ message: 'Failed to calculate size cost.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
