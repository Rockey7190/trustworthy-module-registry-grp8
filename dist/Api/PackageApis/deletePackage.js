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
router.delete('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { packageName, version } = req.body;
    if (!packageName || !version) {
        return res.status(400).send({ message: 'Package name and version are required.' });
    }
    try {
        // Fetch package version and S3 URL
        const query = `
            SELECT v.s3_url, v.package_id 
            FROM package_versions v
            INNER JOIN packages p ON v.package_id = p.package_id
            WHERE p.package_name = $1 AND v.version = $2;
        `;
        const result = yield dbConnection_1.pool.query(query, [packageName, version]);
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package version not found.' });
        }
        const { s3_url: s3Url, package_id: packageId } = result.rows[0];
        // Extract bucket and key from the S3 URL
        const bucketName = process.env.AWS_BUCKET_NAME;
        const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
        // Delete the file from S3
        console.log('Deleting from S3...');
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        yield s3Client.send(deleteCommand);
        console.log('S3 deletion successful!');
        // Delete the package version metadata from the database
        console.log('Deleting package version from database...');
        yield dbConnection_1.pool.query('DELETE FROM package_versions WHERE package_id = $1 AND version = $2;', [
            packageId,
            version,
        ]);
        console.log('Package version deletion successful!');
        res.status(200).send({ message: 'Package version deleted successfully.' });
    }
    catch (error) {
        console.error('Error in deletePackage:', error.message || error);
        res.status(500).send({ message: 'Failed to delete package.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
