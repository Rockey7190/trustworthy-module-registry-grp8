import { Router, Request, Response } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';

const upload = multer(); // Middleware for handling file uploads
const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

router.put('/update', upload.single('file'), async (req: Request, res: Response) => {
    const { packageName, version } = req.body;
    const file = req.file;

    if (!packageName || !version || !file) {
        return res.status(400).send({ message: 'Package name, version, and file are required.' });
    }

    try {
        // Check if the package exists in the database
        const query = `
            SELECT s3_url FROM packages
            WHERE package_name = $1;
        `;
        const result = await pool.query(query, [packageName]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }

        // Upload the new version to S3
        const key = `${packageName}-${version}.zip`;
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
        });

        console.log('Uploading new version to S3...');
        await s3Client.send(uploadCommand);
        console.log('S3 upload successful!');

        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Update the database with the new version
        const updateQuery = `
            UPDATE packages
            SET version = $1, s3_url = $2
            WHERE package_name = $3
            RETURNING *;
        `;
        const values = [version, s3Url, packageName];
        const updateResult = await pool.query(updateQuery, values);

        console.log('Database update successful!', updateResult.rows[0]);
        res.status(200).send({
            message: 'Package updated successfully.',
            package: updateResult.rows[0],
        });
    } catch (error: any) {
        console.error('Error in updatePackage:', error.message || error);
        res.status(500).send({ message: 'Failed to update package.', error: error.message || 'Unknown error' });
    }
});

export default router;

