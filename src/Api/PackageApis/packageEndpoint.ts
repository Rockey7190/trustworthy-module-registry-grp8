import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const router = Router();
const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

router.post('/', async (req: Request, res: Response) => {
    const { Content, JSProgram, debloat, Name, URL } = req.body;

    // Placeholder for authorization
    //const authToken = req.headers['x-authorization'];
    //if (authToken) {
    //    return res.status(501).send({ message: 'Authorization not implemented.' });
    //}

    // Validate the request body
    if ((!Content && !URL) || (Content && URL)) {
        return res.status(400).send({ message: 'Either Content or URL must be provided, but not both.' });
    }
    if (!Name || typeof Name !== 'string') {
        return res.status(400).send({ message: 'Missing or invalid package Name.' });
    }

    try {
        // Check if the package already exists
        const packageCheckQuery = `SELECT COUNT(*) AS count FROM packages WHERE package_name = $1;`;
        const packageResult = await pool.query(packageCheckQuery, [Name]);

        if (parseInt(packageResult.rows[0].count, 10) > 0) {
            return res.status(409).send({ message: 'Package already exists.' });
        }

        // Insert the package into the database
        const insertPackageQuery = `
            INSERT INTO packages (package_name, is_secret, uploaded_by)
            VALUES ($1, $2, $3)
            RETURNING package_id;
        `;
        const packageInsertResult = await pool.query(insertPackageQuery, [Name, false, null]); // Replace `4` with a dynamic user ID if needed
        const packageId = packageInsertResult.rows[0].package_id;

        // Handle Content or URL
        let s3Url: string | null = null;
        if (Content) {
            const bucketName = process.env.AWS_BUCKET_NAME!;
            const key = `${Name}/1.0.0.zip`; // Defaulting version to 1.0.0
            const uploadCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: Buffer.from(Content, 'base64'),
            });
            await s3Client.send(uploadCommand);
            s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } else if (URL) {
            s3Url = URL; // Use the provided URL as the s3_url
        }

        // Insert package version
        const insertVersionQuery = `
            INSERT INTO package_versions (package_id, version, s3_url, uploaded_by)
            VALUES ($1, $2, $3, $4);
        `;
        await pool.query(insertVersionQuery, [packageId, '1.0.0', s3Url, null]); // Replace `4` with a dynamic user ID if needed

        // Return response
        res.status(201).send({
            metadata: {
                Name,
                Version: '1.0.0',
                ID: packageId,
            },
            data: {
                Content: Content || null,
                URL: URL || null,
                JSProgram,
            },
        });
    } catch (error: any) {
        console.error('Error uploading package:', error.message || error);
        res.status(500).send({ message: 'Failed to upload package.', error: error.message || 'Unknown error' });
    }
});

export default router;
