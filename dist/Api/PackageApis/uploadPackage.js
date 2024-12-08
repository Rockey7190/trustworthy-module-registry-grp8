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
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const tar_1 = __importDefault(require("tar"));
const terser_1 = require("terser");
const client_s3_1 = require("@aws-sdk/client-s3");
const dbConnection_1 = require("../../Config/dbConnection");
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const router = (0, express_1.Router)();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// Helper to validate npm-style package structure
function validateNpmPackage(packageDir) {
    const packageJsonPath = path_1.default.join(packageDir, 'package.json');
    return fs_1.default.existsSync(packageJsonPath);
}
// Helper to archive a directory into zip format
function archiveToZip(sourceDir) {
    return new Promise((resolve, reject) => {
        const tempZipPath = `${sourceDir}.zip`;
        const output = fs_1.default.createWriteStream(tempZipPath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
        output.on('close', () => resolve(tempZipPath));
        archive.on('error', reject);
    });
}
// Helper to extract tar files
function extractTar(filePath, outputDir) {
    return __awaiter(this, void 0, void 0, function* () {
        return tar_1.default.extract({
            file: filePath,
            cwd: outputDir,
        });
    });
}
// Helper to optimize files in a directory
function debloatDirectory(sourceDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs_1.default.readdirSync(sourceDir);
        for (const file of files) {
            const filePath = path_1.default.join(sourceDir, file);
            if (fs_1.default.statSync(filePath).isDirectory()) {
                yield debloatDirectory(filePath);
            }
            else if (file.endsWith('.js')) {
                const originalContent = fs_1.default.readFileSync(filePath, 'utf-8');
                const result = yield (0, terser_1.minify)(originalContent, { compress: true, mangle: true });
                if (result.code) {
                    fs_1.default.writeFileSync(filePath, result.code);
                }
            }
            else if (file.startsWith('.')) {
                fs_1.default.unlinkSync(filePath);
            }
        }
    });
}
router.post('/', upload.array('files'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { packageName } = req.body;
        const files = req.files;
        const debloat = req.query.debloat === 'true';
        const userId = 5; // Simulate user ID
        if (!packageName || !files || files.length === 0) {
            return res.status(400).send({ message: 'Missing package name or files' });
        }
        const tempDir = path_1.default.join(__dirname, '../../temp', packageName);
        fs_1.default.mkdirSync(tempDir, { recursive: true });
        if (files.length === 1 && (files[0].originalname.endsWith('.tar') || files[0].originalname.endsWith('.zip'))) {
            const uploadedFilePath = files[0].path;
            if (files[0].originalname.endsWith('.tar')) {
                yield extractTar(uploadedFilePath, tempDir);
            }
            else {
                const unzipper = require('unzipper');
                yield fs_1.default.createReadStream(uploadedFilePath).pipe(unzipper.Extract({ path: tempDir })).promise();
            }
        }
        else {
            files.forEach((file) => {
                const destPath = path_1.default.join(tempDir, file.originalname);
                fs_1.default.renameSync(file.path, destPath);
            });
        }
        if (!validateNpmPackage(tempDir)) {
            return res.status(400).send({ message: 'Invalid package structure: missing package.json' });
        }
        if (debloat) {
            yield debloatDirectory(tempDir);
        }
        // Extract README.md content
        const readmePath = path_1.default.join(tempDir, 'README.md');
        let readmeContent = null;
        if (fs_1.default.existsSync(readmePath)) {
            readmeContent = fs_1.default.readFileSync(readmePath, 'utf-8');
        }
        const zipFilePath = yield archiveToZip(tempDir);
        const zipFileBuffer = fs_1.default.readFileSync(zipFilePath);
        // Upload the file to S3
        const bucketName = process.env.AWS_BUCKET_NAME;
        const s3Key = `${packageName}/1.0.0.zip`;
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: zipFileBuffer,
        });
        yield s3Client.send(uploadCommand);
        console.log('S3 upload successful!');
        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        // Insert package metadata
        const packageResult = yield dbConnection_1.pool.query('INSERT INTO packages (package_name, uploaded_by) VALUES ($1, $2) ON CONFLICT (package_name) DO NOTHING RETURNING package_id', [packageName, userId]);
        const packageId = ((_a = packageResult.rows[0]) === null || _a === void 0 ? void 0 : _a.package_id) || (yield dbConnection_1.pool.query('SELECT package_id FROM packages WHERE package_name = $1', [packageName])).rows[0].package_id;
        // Insert package version and README content
        yield dbConnection_1.pool.query('INSERT INTO package_versions (package_id, version, s3_url, uploaded_by, readme_content) VALUES ($1, $2, $3, $4, $5)', [packageId, '1.0.0', s3Url, userId, readmeContent]);
        // Cleanup
        fs_1.default.unlinkSync(zipFilePath);
        files.forEach((file) => {
            if (fs_1.default.existsSync(file.path))
                fs_1.default.unlinkSync(file.path);
        });
        res.status(200).send({
            message: 'Package uploaded successfully',
            packageId,
        });
    }
    catch (e) {
        console.error('Error in /upload:', e.message || e);
        res.status(500).send({ message: 'Failed to upload package', error: e.message || 'Unknown error' });
    }
}));
exports.default = router;
