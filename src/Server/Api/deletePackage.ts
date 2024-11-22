import { Router, Request, Response } from 'express';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';

const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

router.delete('/delete', async (req: Request, res: Response) => {
    const { packageName, version } = req.body;

    if (!packageName || !version) {
        return res.status(400).send({ message: 'Package name and version are required.' });
    }

    try {
        // Check if the package exists in the database
        const query = `
            SELECT s3_url FROM packages
            WHERE package_name = $1 AND version = $2;
        `;
        const result = await pool.query(query, [packageName, version]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }

        const s3Url = result.rows[0].s3_url;

        // Extract bucket and key from the S3 URL
        const bucketName = process.env.AWS_BUCKET_NAME!;
	const key = s3Url.substring(s3Url.lastIndexOf('/') + 1); // Extract the file key


        // Delete the file from S3
        console.log('Deleting from S3...');
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await s3Client.send(deleteCommand);
        console.log('S3 deletion successful!');

        // Delete the package metadata from the database
        console.log('Deleting from database...');
        const deleteQuery = `
            DELETE FROM packages
            WHERE package_name = $1 AND version = $2;
        `;
        await pool.query(deleteQuery, [packageName, version]);
        console.log('Database deletion successful!');

        res.status(200).send({ message: 'Package deleted successfully.' });
    } catch (error: any) {
        console.error('Error in deletePackage:', error.message || error);
        res.status(500).send({ message: 'Failed to delete package.', error: error.message || 'Unknown error' });
    }
});

export default router;

