import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection'; // Ensure this path is correct
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { promisify } from 'util';
import { pipeline } from 'stream';

const router = Router();
const pipelineAsync = promisify(pipeline);

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// GET /package/:id
router.get('/:id', async (req: Request, res: Response) => {
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
        const result = await pool.query(query, [packageId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }

        const { package_name: name, version, s3_url: s3Url } = result.rows[0];
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');

        // Retrieve the package content from S3
        const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
        const s3Response = await s3Client.send(command);

        if (!s3Response.Body) {
            return res.status(500).send({ message: 'Failed to retrieve package content from S3.' });
        }

        const chunks: Uint8Array[] = [];
        for await (const chunk of s3Response.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
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
    } catch (error: any) {
        console.error('Error retrieving package:', error.message || error);
        res.status(500).send({ message: 'Failed to retrieve package.', error: error.message || 'Unknown error' });
    }
});

// POST /package/:id
router.post('/:id', async (req: Request, res: Response) => {
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
        const result = await pool.query(query, [packageId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Package not found.' });
        }

        const { package_name: name } = result.rows[0];
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const key = `${name}/${Version}.zip`;
        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: Buffer.from(Content, 'base64'),
        });
        await s3Client.send(uploadCommand);
        
        const insertQuery = `
            INSERT INTO package_versions (package_id, version, s3_url, uploaded_by)
            VALUES ($1, $2, $3, $4);
        `;
        await pool.query(insertQuery, [packageId, Version, s3Url, null]); // Assuming uploaded_by = 4

        res.status(200).send({ message: 'Package version updated successfully.' });
    } catch (error: any) {
        console.error('Error updating package:', error.message || error);
        res.status(500).send({ message: 'Failed to update package.', error: error.message || 'Unknown error' });
    }
});

export default router;
