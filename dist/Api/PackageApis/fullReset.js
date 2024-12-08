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
const client_s3_1 = require("@aws-sdk/client-s3");
const dbConnection_1 = require("../../Config/dbConnection");
const router = (0, express_1.Router)();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
router.delete('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Step 1: Clear database tables
        console.log('Resetting database...');
        yield dbConnection_1.pool.query('DELETE FROM package_versions;');
        yield dbConnection_1.pool.query('DELETE FROM packages;');
        console.log('Database reset complete.');
        // Step 2: Clear S3 bucket
        const bucketName = process.env.AWS_BUCKET_NAME;
        console.log('Fetching objects from S3...');
        const listCommand = new client_s3_1.ListObjectsV2Command({ Bucket: bucketName });
        const { Contents } = yield s3Client.send(listCommand);
        if (Contents && Contents.length > 0) {
            const deleteCommand = new client_s3_1.DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                    Objects: Contents.map((object) => ({ Key: object.Key })),
                },
            });
            console.log('Deleting objects from S3...');
            yield s3Client.send(deleteCommand);
            console.log('S3 reset complete.');
        }
        else {
            console.log('No objects found in S3.');
        }
        res.status(200).send({ message: 'System reset to default state successfully.' });
    }
    catch (error) {
        console.error('Error resetting system:', error.message || error);
        res.status(500).send({ message: 'Failed to reset system.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
