import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import tar from 'tar';
import { minify } from 'terser';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';

const upload = multer({ dest: 'uploads/' });
const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Helper to validate npm-style package structure
function validateNpmPackage(packageDir: string): boolean {
    const packageJsonPath = path.join(packageDir, 'package.json');
    return fs.existsSync(packageJsonPath);
}

// Helper to archive a directory into zip format
function archiveToZip(sourceDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const tempZipPath = `${sourceDir}.zip`;
        const output = fs.createWriteStream(tempZipPath);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();

        output.on('close', () => resolve(tempZipPath));
        archive.on('error', reject);
    });
}

// Helper to extract tar files
async function extractTar(filePath: string, outputDir: string): Promise<void> {
    return tar.extract({
        file: filePath,
        cwd: outputDir,
    });
}

// Helper to optimize files in a directory
async function debloatDirectory(sourceDir: string): Promise<void> {
    const files = fs.readdirSync(sourceDir);

    for (const file of files) {
        const filePath = path.join(sourceDir, file);

        if (fs.statSync(filePath).isDirectory()) {
            await debloatDirectory(filePath);
        } else if (file.endsWith('.js')) {
            const originalContent = fs.readFileSync(filePath, 'utf-8');
            const result = await minify(originalContent, { compress: true, mangle: true });
            if (result.code) {
                fs.writeFileSync(filePath, result.code);
            }
        } else if (file.startsWith('.')) {
            fs.unlinkSync(filePath);
        }
    }
}

router.post('/', upload.array('files'), async (req: Request, res: Response) => {
    try {
        const { packageName } = req.body;
        const files = req.files as Express.Multer.File[];
        const debloat = req.query.debloat === 'true';
        const userId = 5; // Simulate user ID

        if (!packageName || !files || files.length === 0) {
            return res.status(400).send({ message: 'Missing package name or files' });
        }

        const tempDir = path.join(__dirname, '../../temp', packageName);
        fs.mkdirSync(tempDir, { recursive: true });

        if (files.length === 1 && (files[0].originalname.endsWith('.tar') || files[0].originalname.endsWith('.zip'))) {
            const uploadedFilePath = files[0].path;
            if (files[0].originalname.endsWith('.tar')) {
                await extractTar(uploadedFilePath, tempDir);
            } else {
                const unzipper = require('unzipper');
                await fs.createReadStream(uploadedFilePath).pipe(unzipper.Extract({ path: tempDir })).promise();
            }
        } else {
            files.forEach((file) => {
                const destPath = path.join(tempDir, file.originalname);
                fs.renameSync(file.path, destPath);
            });
        }

        if (!validateNpmPackage(tempDir)) {
            return res.status(400).send({ message: 'Invalid package structure: missing package.json' });
        }

        if (debloat) {
            await debloatDirectory(tempDir);
        }

        // Extract README.md content
        const readmePath = path.join(tempDir, 'README.md');
        let readmeContent = null;
        if (fs.existsSync(readmePath)) {
            readmeContent = fs.readFileSync(readmePath, 'utf-8');
        }

        const zipFilePath = await archiveToZip(tempDir);
        const zipFileBuffer = fs.readFileSync(zipFilePath);

        // Upload the file to S3
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const s3Key = `${packageName}/1.0.0.zip`;

        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: zipFileBuffer,
        });

        await s3Client.send(uploadCommand);
        console.log('S3 upload successful!');

        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // Insert package metadata
        const packageResult = await pool.query(
            'INSERT INTO packages (package_name, uploaded_by) VALUES ($1, $2) ON CONFLICT (package_name) DO NOTHING RETURNING package_id',
            [packageName, userId]
        );

        const packageId = packageResult.rows[0]?.package_id || (
            await pool.query('SELECT package_id FROM packages WHERE package_name = $1', [packageName])
        ).rows[0].package_id;

        // Insert package version and README content
        await pool.query(
            'INSERT INTO package_versions (package_id, version, s3_url, uploaded_by, readme_content) VALUES ($1, $2, $3, $4, $5)',
            [packageId, '1.0.0', s3Url, userId, readmeContent]
        );

        // Cleanup
        fs.unlinkSync(zipFilePath);
        files.forEach((file) => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });

        res.status(200).send({
            message: 'Package uploaded successfully',
            packageId,
        });
    } catch (e: any) {
        console.error('Error in /upload:', e.message || e);
        res.status(500).send({ message: 'Failed to upload package', error: e.message || 'Unknown error' });
    }
});

export default router;
