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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dbConnection_1 = require("../../Config/dbConnection"); // Ensure this path is correct
const client_s3_1 = require("@aws-sdk/client-s3");
const util_1 = require("util");
const stream_1 = require("stream");
const router = (0, express_1.Router)();
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// GET /package/:id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const packageId = parseInt(req.params.id, 10);
    if (isNaN(packageId)) {
        return res.status(400).send({ message: 'Invalid package ID.' });
    }
    try {
        const query = `
            SELECT p.package_name, v.version, v.s3_url
            FROM package_versions v
            INNER JOIN packages p ON v.package_id = p.package_id
            WHERE v.version_id = $1;
        `;
        const result = yield dbConnection_1.pool.query(query, [packageId]);
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }
        const { package_name: name, version, s3_url: s3Url } = result.rows[0];
        const bucketName = process.env.AWS_BUCKET_NAME;
        const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
        // Retrieve the package content from S3
        const command = new client_s3_1.GetObjectCommand({ Bucket: bucketName, Key: key });
        const s3Response = yield s3Client.send(command);
        if (!s3Response.Body) {
            return res.status(500).send({ message: 'Failed to retrieve package content from S3.' });
        }
        const chunks = [];
        try {
            for (var _d = true, _e = __asyncValues(s3Response.Body), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const chunk = _c;
                chunks.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const contentBase64 = Buffer.concat(chunks).toString('base64');
        res.status(200).send({
            metadata: {
                Name: name,
                Version: version,
                ID: packageId,
            },
            data: {
                Content: contentBase64,
            },
        });
    }
    catch (error) {
        console.error('Error retrieving package:', error.message || error);
        res.status(500).send({ message: 'Failed to retrieve package.', error: error.message || 'Unknown error' });
    }
}));
// POST /package/:id
router.post('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const packageId = parseInt(req.params.id, 10);
    const { Content, Version } = req.body;
    if (isNaN(packageId)) {
        return res.status(400).send({ message: 'Invalid package ID.' });
    }
    if (!Content || !Version) {
        return res.status(400).send({ message: 'Missing required fields: Content or Version.' });
    }
    try {
        const query = `
            SELECT package_name
            FROM packages
            WHERE package_id = $1;
        `;
        const result = yield dbConnection_1.pool.query(query, [packageId]);
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }
        const { package_name: name } = result.rows[0];
        const bucketName = process.env.AWS_BUCKET_NAME;
        const key = `${name}/${Version}.zip`;
        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        // Upload to S3
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: Buffer.from(Content, 'base64'),
        });
        yield s3Client.send(uploadCommand);
        const insertQuery = `
            INSERT INTO package_versions (package_id, version, s3_url, uploaded_by)
            VALUES ($1, $2, $3, $4);
        `;
        yield dbConnection_1.pool.query(insertQuery, [packageId, Version, s3Url, null]); // Assuming uploaded_by = 4
        res.status(200).send({ message: 'Package version updated successfully.' });
    }
    catch (error) {
        console.error('Error updating package:', error.message || error);
        res.status(500).send({ message: 'Failed to update package.', error: error.message || 'Unknown error' });
    }
}));
exports.default = router;
