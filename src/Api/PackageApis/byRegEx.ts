import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const { RegEx } = req.body;

    if (!RegEx || typeof RegEx !== 'string') {
        return res.status(400).send({ message: 'Invalid or missing RegEx in request body.' });
    }

    try {
        const query = `
            SELECT DISTINCT p.package_id AS id, p.package_name AS name, v.version
            FROM packages p
            LEFT JOIN package_versions v ON p.package_id = v.package_id
            WHERE (p.package_name ~* $1 OR COALESCE(v.readme_content, '') ~* $1);
        `;

        const result = await pool.query(query, [RegEx]);

        console.log('Query results:', result.rows); // Log raw results for debugging

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'No packages found matching the provided RegEx.' });
        }

        res.status(200).send(result.rows); // Return raw results for debugging
    } catch (error: any) {
        console.error('Error searching packages by RegEx:', error.message || error);
        res.status(500).send({
            message: 'Failed to search packages by RegEx.',
            error: error.message || 'Unknown error',
        });
    }
});

export default router;