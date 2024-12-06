import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';

const router = Router();

router.get('/directory', async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1) {
        return res.status(400).send({ message: 'Page and limit must be positive integers.' });
    }

    try {
        // Count total packages for pagination metadata
        const countResult = await pool.query('SELECT COUNT(*) AS total FROM packages');
        const totalCount = parseInt(countResult.rows[0].total, 10);

        const totalPages = Math.ceil(totalCount / limit);
        const offset = (page - 1) * limit;

        if (page > totalPages && totalPages > 0) {
            return res.status(400).send({ message: 'Page number exceeds total pages.' });
        }

        // Fetch paginated packages
        const query = `
            SELECT package_id, package_name, uploaded_by, created_at
            FROM packages
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2;
        `;
        const result = await pool.query(query, [limit, offset]);

        res.status(200).send({
            metadata: {
                totalCount,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
            packages: result.rows,
        });
    } catch (error: any) {
        console.error('Error fetching directory:', error.message || error);
        res.status(500).send({ message: 'Failed to fetch directory.', error: error.message || 'Unknown error' });
    }
});

export default router;
