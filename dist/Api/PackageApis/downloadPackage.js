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
const stream_1 = require("stream");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { packageName, version } = req.query;
    if (!packageName) {
        return res.status(400).send({ message: 'Package name is required.' });
    }
    try {
        // Query the database for the package and version
        const query = `
            SELECT v.s3_url 
            FROM package_versions v
            INNER JOIN packages p ON v.package_id = p.package_id
            WHERE p.package_name = $1 ${version ? 'AND v.version = $2' : ''}
            ORDER BY v.created_at DESC
            LIMIT 1;
        `;
        const values = version ? [packageName, version] : [packageName];
        const result = yield dbConnection_1.pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package or version not found.' });
        }
        const s3Url = result.rows[0].s3_url;
        const bucketName = process.env.AWS_BUCKET_NAME;
        const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
        // Get the file from S3
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        const s3Response = yield s3Client.send(command);
        // Set headers for file download
        res.setHeader('Content-Type', s3Response.ContentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${path_1.default.basename(key)}"`);
        // Stream the file to the response
        yield pipelineAsync(s3Response.Body, res);
    }
    catch (error) {
        console.error('Error streaming file:', error.message || error);
        res.status(500).send({ message: 'Failed to stream file.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
