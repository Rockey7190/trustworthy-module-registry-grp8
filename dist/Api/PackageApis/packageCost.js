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
const client_s3_1 = require("@aws-sdk/client-s3");
const router = (0, express_1.Router)();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// GET /package/{id}/cost
router.get('/:id/cost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const packageId = parseInt(req.params.id, 10);
    const includeDependencies = req.query.dependency === 'true';
    // Placeholder for authorization
    //const authToken = req.headers['x-authorization'];
    //if (authToken) {
    //   return res.status(501).send({ message: 'Authorization not implemented.' });
    //}
    if (isNaN(packageId)) {
        return res.status(400).send({ message: 'Invalid or missing Package ID.' });
    }
    try {
        const bucketName = process.env.AWS_BUCKET_NAME; // Ensure bucketName is defined in the outer scope
        // Step 1: Check if package exists
        const packageQuery = `SELECT package_id, package_name FROM packages WHERE package_id = $1;`;
        const packageResult = yield dbConnection_1.pool.query(packageQuery, [packageId]);
        if (packageResult.rows.length === 0) {
            return res.status(404).send({ message: 'Package does not exist.' });
        }
        const packageName = packageResult.rows[0].package_name;
        // Step 2: Fetch S3 file size and calculate cost
        const fileQuery = `
            SELECT s3_url
            FROM package_versions
            WHERE package_id = $1;
        `;
        const fileResult = yield dbConnection_1.pool.query(fileQuery, [packageId]);
        let standaloneCost = 0;
        for (const row of fileResult.rows) {
            const s3Url = row.s3_url;
            const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
            const headCommand = new client_s3_1.HeadObjectCommand({ Bucket: bucketName, Key: key });
            const s3Response = yield s3Client.send(headCommand);
            const sizeInKB = (s3Response.ContentLength || 0) / 1024;
            standaloneCost += sizeInKB * 0.01; // $0.01 per KB
        }
        // Response object
        const response = {
            [packageId]: {
                standaloneCost,
            },
        };
        // Step 3: Include dependency costs if requested
        if (includeDependencies) {
            const dependencyQuery = `
                SELECT d.dependency_id AS package_id, p.package_name
                FROM package_dependencies d
                INNER JOIN packages p ON d.dependency_id = p.package_id
                WHERE d.package_id = $1;
            `;
            const dependencyResult = yield dbConnection_1.pool.query(dependencyQuery, [packageId]);
            for (const dep of dependencyResult.rows) {
                const depFileQuery = `
                    SELECT s3_url
                    FROM package_versions
                    WHERE package_id = $1;
                `;
                const depFileResult = yield dbConnection_1.pool.query(depFileQuery, [dep.package_id]);
                let depCost = 0;
                for (const depRow of depFileResult.rows) {
                    const depS3Url = depRow.s3_url;
                    const depKey = depS3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
                    const depHeadCommand = new client_s3_1.HeadObjectCommand({ Bucket: bucketName, Key: depKey });
                    const depS3Response = yield s3Client.send(depHeadCommand);
                    const depSizeInKB = (depS3Response.ContentLength || 0) / 1024;
                    depCost += depSizeInKB * 0.01; // $0.01 per KB
                }
                response[dep.package_id] = {
                    standaloneCost: depCost,
                    totalCost: standaloneCost + depCost,
                };
            }
        }
        res.status(200).send(response);
    }
    catch (error) {
        console.error('Error calculating package cost:', error.message || error);
        res.status(500).send({
            message: 'Failed to calculate package cost.',
            error: error.message || 'Unknown error',
        });
    }
}));
exports.default = router;
