import { Router, Request, Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';
import { pipeline } from 'stream';
import { promisify } from 'util';

const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const pipelineAsync = promisify(pipeline);

router.get('/download', async (req: Request, res: Response) => {
    const { packageName, version } = req.query;

    if (!packageName) {
        return res.status(400).send({ message: 'Package name is required.' });
    }

    try {
        // Query the database for the package
        const query = `
            SELECT s3_url FROM packages
            WHERE package_name = $1 ${version ? 'AND version = $2' : ''}
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        const values = version ? [packageName, version] : [packageName];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }

        const s3Url = result.rows[0].s3_url;
        const bucketName = process.env.AWS_BUCKET_NAME!;
	const key = s3Url.substring(s3Url.lastIndexOf('/') + 1); // Extract everything after the last '/'


        // Get the file from S3
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const s3Response = await s3Client.send(command);

        // Set headers for file download
        res.setHeader('Content-Type', s3Response.ContentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${key}"`);

        // Stream the file to the response
        await pipelineAsync(s3Response.Body as NodeJS.ReadableStream, res);
    } catch (error: any) {
        console.error('Error streaming file:', error.message || error);
        res.status(500).send({ message: 'Failed to stream file.', error: error.message || 'Unknown error' });
    }
});

export default router;

