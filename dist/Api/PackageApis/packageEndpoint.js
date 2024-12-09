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
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { Content, JSProgram, debloat, Name, URL } = req.body;
    // Placeholder for authorization
    //const authToken = req.headers['x-authorization'];
    //if (authToken) {
    //    return res.status(501).send({ message: 'Authorization not implemented.' });
    //}
    // Validate the request body
    if ((!Content && !URL) || (Content && URL)) {
        return res.status(400).send({ message: 'Either Content or URL must be provided, but not both.' });
    }
    if (!Name || typeof Name !== 'string') {
        return res.status(400).send({ message: 'Missing or invalid package Name.' });
    }
    try {
        // Check if the package already exists
        const packageCheckQuery = `SELECT COUNT(*) AS count FROM packages WHERE package_name = $1;`;
        const packageResult = yield dbConnection_1.pool.query(packageCheckQuery, [Name]);
        if (parseInt(packageResult.rows[0].count, 10) > 0) {
            return res.status(409).send({ message: 'Package already exists.' });
        }
        // Insert the package into the database
        const insertPackageQuery = `
            INSERT INTO packages (package_name, is_secret, uploaded_by)
            VALUES ($1, $2, $3)
            RETURNING package_id;
        `;
        const packageInsertResult = yield dbConnection_1.pool.query(insertPackageQuery, [Name, false, null]); // Replace `4` with a dynamic user ID if needed
        const packageId = packageInsertResult.rows[0].package_id;
        // Handle Content or URL
        let s3Url = null;
        if (Content) {
            const bucketName = process.env.AWS_BUCKET_NAME;
            const key = `${Name}/1.0.0.zip`; // Defaulting version to 1.0.0
            const uploadCommand = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: Buffer.from(Content, 'base64'),
            });
            yield s3Client.send(uploadCommand);
            s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        }
        else if (URL) {
            s3Url = URL; // Use the provided URL as the s3_url
        }
        // Insert package version
        const insertVersionQuery = `
            INSERT INTO package_versions (package_id, version, s3_url, uploaded_by)
            VALUES ($1, $2, $3, $4);
        `;
        yield dbConnection_1.pool.query(insertVersionQuery, [packageId, '1.0.0', s3Url, null]); // Replace `4` with a dynamic user ID if needed
        // Return response
        res.status(201).send({
            metadata: {
                Name,
                Version: '1.0.0',
                ID: packageId,
            },
            data: {
                Content: Content || null,
                URL: URL || null,
                JSProgram,
            },
        });
    }
    catch (error) {
        console.error('Error uploading package:', error.message || error);
        res.status(500).send({ message: 'Failed to upload package.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
