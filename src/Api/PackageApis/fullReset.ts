import { Router, Request, Response } from 'express';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';

const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

router.post('/reset', async (_req: Request, res: Response) => {
    try {
        // Step 1: Clear database tables
        console.log('Resetting database...');
        await pool.query('DELETE FROM package_versions;');
        await pool.query('DELETE FROM packages;');
        console.log('Database reset complete.');

        // Step 2: Clear S3 bucket
        const bucketName = process.env.AWS_BUCKET_NAME!;
        console.log('Fetching objects from S3...');
        const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
        const { Contents } = await s3Client.send(listCommand);

        if (Contents && Contents.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                    Objects: Contents.map((object) => ({ Key: object.Key! })),
                },
            });
            console.log('Deleting objects from S3...');
            await s3Client.send(deleteCommand);
            console.log('S3 reset complete.');
        } else {
            console.log('No objects found in S3.');
        }

        res.status(200).send({ message: 'System reset to default state successfully.' });
    } catch (error: any) {
        console.error('Error resetting system:', error.message || error);
        res.status(500).send({ message: 'Failed to reset system.', error: error.message || 'Unknown error' });
    }
});

export default router;
