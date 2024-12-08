import { Router, Request, Response } from 'express';

const router = Router();

// GET /tracks
router.get('/', (req: Request, res: Response) => {
    try {
        // List of planned tracks
        const plannedTracks = ["Access control track"];

        res.status(200).send({ plannedTracks });
    } catch (error: any) {
        console.error('Error retrieving tracks:', error.message || error);
        res.status(500).send({
            message: 'The system encountered an error while retrieving the student\'s track information.',
            error: error.message || 'Unknown error',
        });
    }
});

export default router;
