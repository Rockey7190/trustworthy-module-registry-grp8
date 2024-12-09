import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';

const router = Router();

// GET /packages
router.get('/', async (req: Request, res: Response) => {
    const name = req.query.name as string;

    // Validate the name query parameter
    if (!name) {
        return res.status(400).send({ message: 'Name query parameter is required.' });
    }

    try {
        // Query to fetch packages by name
        const query = `
            SELECT p.package_name AS name,   -- Matches response field Name
                   v.version AS version,    -- Matches response field Version
                   p.package_id AS id       -- Matches response field ID
            FROM packages p
            INNER JOIN package_versions v ON p.package_id = v.package_id
            WHERE p.package_name ILIKE $1;
        `;
        const result = await pool.query(query, [`%${name}%`]);

        // Check if no packages were found
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'No packages found matching the name.' });
        }

        // Map the results to match the `PackageMetadata` schema
        const response = result.rows.map(pkg => ({
            Name: pkg.name,       // Maps SQL alias `name`
            Version: pkg.version, // Maps SQL alias `version`
            ID: pkg.id,           // Maps SQL alias `id`
        }));

        res.status(200).send(response);
    } catch (error: any) {
        console.error('Error fetching packages by name:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch packages.', error: error.message || 'Unknown error' });
    }
});

export default router;
