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
exports.storePackage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const dbConnection_1 = require("../Config/dbConnection"); // Ensure the db connection is correct
// Initialize S3 client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const storePackage = (packageName, version, fileBuffer, userId, groupId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting S3 upload...');
        const key = `${packageName}-${version}.zip`;
        const bucketName = process.env.AWS_BUCKET_NAME;
        // Upload file to S3
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileBuffer,
        });
        yield s3Client.send(command);
        console.log('S3 upload successful!');
        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log('Inserting into database...');
        const query = `
            INSERT INTO packages (package_name, version, s3_url, uploaded_by, group_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING package_id;
        `;
        const values = [packageName, version, s3Url, userId, groupId];
        const result = yield dbConnection_1.pool.query(query, values);
        console.log('Database insertion successful!', result.rows[0]);
        return { message: 'Package stored successfully', packageId: result.rows[0].package_id };
    }
    catch (error) {
        console.error('Error in storePackage:', error.message || error);
        throw new Error('Failed to store package');
    }
});
exports.storePackage = storePackage;
