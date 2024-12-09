import { Router, Request, Response } from 'express';
import { getMetrics } from '../../Server/metricsController'; // Adjust path to the actual service

const router = Router();

router.get('/:id/rate', async (req: Request, res: Response) => {
    const packageId = parseInt(req.params.id, 10);

    if (isNaN(packageId)) {
        return res.status(400).send({ message: 'Invalid Package ID.' });
    }

    try {
        const metrics = await getMetrics(req, res);

        // Directly use metrics in the response
        res.status(200).json({
            rating: metrics,
        });
    } catch (error: any) {
        console.error('Error fetching package rating:', error);

        if (error.message.includes('not found')) {
            return res.status(404).json({ message: 'Package does not exist.' });
        }

        if (error.message.includes('metrics')) {
            return res.status(500).json({ message: 'The package rating system choked on at least one of the metrics.' });
        }

        // Generic fallback for unexpected errors
        return res.status(500).json({ message: 'An unexpected error occurred.' });
    }
});

export default router;
