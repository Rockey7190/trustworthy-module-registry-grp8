import { Router, Request, Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';
import { pipeline } from 'stream';
import { promisify } from 'util';
import path from 'path';

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
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package or version not found.' });
        }

        const s3Url = result.rows[0].s3_url;
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');

        // Get the file from S3
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const s3Response = await s3Client.send(command);

        // Set headers for file download
        res.setHeader('Content-Type', s3Response.ContentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(key)}"`);


        // Stream the file to the response
        await pipelineAsync(s3Response.Body as NodeJS.ReadableStream, res);
    } catch (error: any) {
        console.error('Error streaming file:', error.message || error);
        res.status(500).send({ message: 'Failed to stream file.', error: error.message || 'Unknown error' });
    }
});

export default router;
