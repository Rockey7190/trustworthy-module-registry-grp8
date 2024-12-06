import { Router, Request, Response } from 'express';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../../Config/dbConnection';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import unzipper from 'unzipper';

const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Helper to get direct dependencies from a package.json
function getDirectDependencies(packageJsonPath: string): string[] {
    if (!fs.existsSync(packageJsonPath)) return [];
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return Object.keys(packageJson.dependencies || {});
}

// Helper to resolve dependency sizes recursively
async function resolveDependencies(
    packageName: string,
    resolved: Set<string> = new Set(),
    sizeMap: Map<string, number> = new Map()
): Promise<{ sizeMap: Map<string, number>; totalSize: number }> {
    if (resolved.has(packageName)) return { sizeMap, totalSize: 0 };
    resolved.add(packageName);

    // Fetch package version info from the database
    const packageResult = await pool.query(
        `SELECT pv.s3_url, pv.version FROM package_versions pv 
         INNER JOIN packages p ON pv.package_id = p.package_id 
         WHERE p.package_name = $1 
         ORDER BY pv.created_at DESC LIMIT 1`,
        [packageName]
    );

    if (packageResult.rows.length === 0) {
        console.warn(`Package not found: ${packageName}`);
        return { sizeMap, totalSize: 0 };
    }

    const { s3_url: s3Url } = packageResult.rows[0];
    const key = s3Url.split('.com/')[1];

    // Check the size of the zip file on S3
    try {
        const headCommand = new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key });
        const headResult = await s3Client.send(headCommand);
        const size = headResult.ContentLength || 0;

        sizeMap.set(packageName, size);

        // Download and read package.json to get dependencies
        const tempDir = path.join(__dirname, 'temp', packageName);
        fs.mkdirSync(tempDir, { recursive: true });

        const downloadCommand = new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key });
        const { Body } = await s3Client.send(downloadCommand);

        await new Promise((resolve, reject) => {
            const extractStream = (Body as NodeJS.ReadableStream).pipe(unzipper.Extract({ path: tempDir }));
            extractStream.on('close', resolve);
            extractStream.on('error', reject);
        });

        const packageJsonPath = path.join(tempDir, 'package.json');
        const dependencies = getDirectDependencies(packageJsonPath);

        fs.rmSync(tempDir, { recursive: true, force: true });

        // Resolve dependencies recursively
        let totalSize = size;
        for (const dep of dependencies) {
            const result = await resolveDependencies(dep, resolved, sizeMap);
            totalSize += result.totalSize;
        }

        return { sizeMap, totalSize };
    } catch (error: any) {
        console.error(`Failed to fetch size for ${packageName}:`, error.message || error);
        return { sizeMap, totalSize: 0 };
    }
}

router.get('/size-cost', async (req: Request, res: Response) => {
    const packageNamesQuery = req.query.packageNames;

    if (!packageNamesQuery) {
        return res.status(400).send({ message: 'Package names are required.' });
    }

    const packageNames = Array.isArray(packageNamesQuery)
        ? packageNamesQuery as string[]
        : [packageNamesQuery as string];

    const resolved = new Set<string>();
    const sizeMap = new Map<string, number>();

    try {
        let totalSize = 0;

        for (const pkg of packageNames) {
            const result = await resolveDependencies(pkg, resolved, sizeMap);
            totalSize += result.totalSize;
        }

        res.status(200).send({
            totalSize,
            sizeBreakdown: Array.from(sizeMap.entries()).map(([pkg, size]) => ({ package: pkg, size })),
        });
    } catch (error: any) {
        console.error('Error calculating size cost:', error.message || error);
        res.status(500).send({ message: 'Failed to calculate size cost.', error: error.message || 'Unknown error' });
    }
});

export default router;
