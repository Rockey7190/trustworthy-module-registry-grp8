//fetchVersion.ts
import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';
import semver from 'semver';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const { packageName, version } = req.query;

    if (!packageName) {
        return res.status(400).send({ message: 'Package name is required.' });
    }

    try {
        // Query the database for all versions of the package
        const query = `
            SELECT v.version
            FROM package_versions v
            INNER JOIN packages p ON v.package_id = p.package_id
            WHERE p.package_name = $1
            ORDER BY v.created_at DESC;
        `;
        const result = await pool.query(query, [packageName]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'No versions found for the specified package.' });
        }

        const versions = result.rows.map((row: { version: string }) => row.version);

        let filteredVersions;
        if (version) {
            // Apply version filtering
            if (semver.valid(version as string)) {
                // Exact version
                filteredVersions = versions.filter((v) => semver.eq(v, version as string));
            } else if ((version as string).includes('-')) {
                // Bounded range (e.g., "1.2.3-2.1.0")
                const [minVersion, maxVersion] = (version as string).split('-');
                filteredVersions = versions.filter((v) => semver.gte(v, minVersion) && semver.lte(v, maxVersion));
            } else if ((version as string).startsWith('~')) {
                // Tilde range (e.g., "~1.2.0")
                filteredVersions = versions.filter((v) => semver.satisfies(v, version as string));
            } else if ((version as string).startsWith('^')) {
                // Carat range (e.g., "^1.2.0")
                filteredVersions = versions.filter((v) => semver.satisfies(v, version as string));
            } else {
                return res.status(400).send({ message: 'Invalid version specification.' });
            }
        } else {
            // If no version filter is provided, return all versions
            filteredVersions = versions;
        }

        res.status(200).send({ packageName, versions: filteredVersions });
    } catch (error: any) {
        console.error('Error fetching versions:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch versions.', error: error.message || 'Unknown error' });
    }
});

export default router;
