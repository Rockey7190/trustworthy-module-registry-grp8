import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// GET /package/{id}/cost
router.get('/:id/cost', async (req: Request, res: Response) => {
    const packageId = parseInt(req.params.id, 10);
    const includeDependencies = req.query.dependency === 'true';

    // Placeholder for authorization
    //const authToken = req.headers['x-authorization'];
    //if (authToken) {
     //   return res.status(501).send({ message: 'Authorization not implemented.' });
    //}

    if (isNaN(packageId)) {
        return res.status(400).send({ message: 'Invalid or missing Package ID.' });
    }

    try {
        const bucketName = process.env.AWS_BUCKET_NAME!; // Ensure bucketName is defined in the outer scope

        // Step 1: Check if package exists
        const packageQuery = `SELECT package_id, package_name FROM packages WHERE package_id = $1;`;
        const packageResult = await pool.query(packageQuery, [packageId]);

        if (packageResult.rows.length === 0) {
            return res.status(404).send({ message: 'Package does not exist.' });
        }

        const packageName = packageResult.rows[0].package_name;

        // Step 2: Fetch S3 file size and calculate cost
        const fileQuery = `
            SELECT s3_url
            FROM package_versions
            WHERE package_id = $1;
        `;
        const fileResult = await pool.query(fileQuery, [packageId]);

        let standaloneCost = 0;
        for (const row of fileResult.rows) {
            const s3Url = row.s3_url;
            const key = s3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');

            const headCommand = new HeadObjectCommand({ Bucket: bucketName, Key: key });
            const s3Response = await s3Client.send(headCommand);

            const sizeInKB = (s3Response.ContentLength! || 0) / 1024;
            standaloneCost += sizeInKB * 0.01; // $0.01 per KB
        }

        // Response object
        const response: any = {
            [packageId]: {
                standaloneCost,
            },
        };

        // Step 3: Include dependency costs if requested
        if (includeDependencies) {
            const dependencyQuery = `
                SELECT d.dependency_id AS package_id, p.package_name
                FROM package_dependencies d
                INNER JOIN packages p ON d.dependency_id = p.package_id
                WHERE d.package_id = $1;
            `;
            const dependencyResult = await pool.query(dependencyQuery, [packageId]);

            for (const dep of dependencyResult.rows) {
                const depFileQuery = `
                    SELECT s3_url
                    FROM package_versions
                    WHERE package_id = $1;
                `;
                const depFileResult = await pool.query(depFileQuery, [dep.package_id]);

                let depCost = 0;
                for (const depRow of depFileResult.rows) {
                    const depS3Url = depRow.s3_url;
                    const depKey = depS3Url.replace(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');

                    const depHeadCommand = new HeadObjectCommand({ Bucket: bucketName, Key: depKey });
                    const depS3Response = await s3Client.send(depHeadCommand);

                    const depSizeInKB = (depS3Response.ContentLength! || 0) / 1024;
                    depCost += depSizeInKB * 0.01; // $0.01 per KB
                }

                response[dep.package_id] = {
                    standaloneCost: depCost,
                    totalCost: standaloneCost + depCost,
                };
            }
        }

        res.status(200).send(response);
    } catch (error: any) {
        console.error('Error calculating package cost:', error.message || error);
        res.status(500).send({
            message: 'Failed to calculate package cost.',
            error: error.message || 'Unknown error',
        });
    }
});

export default router;
