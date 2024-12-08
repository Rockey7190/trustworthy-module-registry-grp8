import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const queries = req.body;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const limit = 10; // Default limit for pagination

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return res.status(400).send({ message: 'No valid query fields provided.' });
    }

    try {
        const results: any[] = [];
        for (const query of queries) {
            let sqlQuery: string;
            let sqlParams: any[];

            if (query.Name === '*') {
                // Fetch all packages
                sqlQuery = `
                    SELECT v.package_id AS id, p.package_name AS name, v.version
                    FROM package_versions v
                    INNER JOIN packages p ON v.package_id = p.package_id
                    LIMIT $1 OFFSET $2
                `;
                sqlParams = [limit, offset];
            } else if (query.Name) {
                // Fetch packages by name
                sqlQuery = `
                    SELECT v.package_id AS id, p.package_name AS name, v.version
                    FROM package_versions v
                    INNER JOIN packages p ON v.package_id = p.package_id
                    WHERE p.package_name = $1
                    LIMIT $2 OFFSET $3
                `;
                sqlParams = [query.Name, limit, offset];
            } else if (query.Version) {
                // Fetch packages by version
                sqlQuery = `
                    SELECT v.package_id AS id, p.package_name AS name, v.version
                    FROM package_versions v
                    INNER JOIN packages p ON v.package_id = p.package_id
                    WHERE v.version = $1
                    LIMIT $2 OFFSET $3
                `;
                sqlParams = [query.Version, limit, offset];
            } else {
                continue; // Skip invalid query
            }

            const dbResult = await pool.query(sqlQuery, sqlParams);
            results.push(...dbResult.rows);
        }

        res.status(200).send(results);
    } catch (error: any) {
        console.error('Error fetching packages:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch packages.', error: error.message || 'Unknown error' });
    }
});

export default router;
