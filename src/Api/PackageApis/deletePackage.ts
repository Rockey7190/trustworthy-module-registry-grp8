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

router.delete('/', async (req: Request, res: Response) => {
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
        const result = await pool.query(query, [packageName, version]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package version not found.' });
        }

        const { s3_url: s3Url, package_id: packageId } = result.rows[0];

        // Extract bucket and key from the S3 URL
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');

        // Delete the file from S3
        console.log('Deleting from S3...');
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await s3Client.send(deleteCommand);
        console.log('S3 deletion successful!');

        // Delete the package version metadata from the database
        console.log('Deleting package version from database...');
        await pool.query('DELETE FROM package_versions WHERE package_id = $1 AND version = $2;', [
            packageId,
            version,
        ]);
        console.log('Package version deletion successful!');

        res.status(200).send({ message: 'Package version deleted successfully.' });
    } catch (error: any) {
        console.error('Error in deletePackage:', error.message || error);
        res.status(500).send({ message: 'Failed to delete package.', error: error.message || 'Unknown error' });
    }
});

export default router;
