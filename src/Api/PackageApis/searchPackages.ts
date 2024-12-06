import { Router, Request, Response } from 'express';
import { pool } from '../../Config/dbConnection';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
    const { query, page, limit } = req.query;

    if (!query) {
        return res.status(400).send({ message: 'Search query is required.' });
    }

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;

    if (pageNumber < 1 || pageSize < 1) {
        return res.status(400).send({ message: 'Page and limit must be positive integers.' });
    }

    try {
        // Count total matching packages for pagination metadata
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM packages p
            INNER JOIN package_versions pv ON p.package_id = pv.package_id
            WHERE p.package_name ~* $1 OR pv.readme_content ~* $1;
        `;
        const countResult = await pool.query(countQuery, [query]);
        const totalCount = parseInt(countResult.rows[0].total, 10);

        const totalPages = Math.ceil(totalCount / pageSize);
        const offset = (pageNumber - 1) * pageSize;

        if (pageNumber > totalPages && totalPages > 0) {
            return res.status(400).send({ message: 'Page number exceeds total pages.' });
        }

        // Fetch matching packages with pagination
        const searchQuery = `
            SELECT p.package_id, p.package_name, pv.version, pv.readme_content, p.uploaded_by, pv.created_at
            FROM packages p
            INNER JOIN package_versions pv ON p.package_id = pv.package_id
            WHERE p.package_name ~* $1 OR pv.readme_content ~* $1
            ORDER BY pv.created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        const result = await pool.query(searchQuery, [query, pageSize, offset]);

        res.status(200).send({
            metadata: {
                totalCount,
                totalPages,
                currentPage: pageNumber,
                pageSize,
            },
            packages: result.rows,
        });
    } catch (error: any) {
        console.error('Error searching packages:', error.message || error);
        res.status(500).send({ message: 'Failed to search packages.', error: error.message || 'Unknown error' });
    }
});

export default router;
