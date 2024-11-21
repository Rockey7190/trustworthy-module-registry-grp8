import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storePackage } from '../../Models/packageModel';

const upload = multer(); // Middleware for handling file uploads
const router = Router();

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const { packageName } = req.body;
        const file = req.file;

        if (!file || !packageName) {
            return res.status(400).send({ message: 'Missing package name or file' });
        }

	//////
        const userId = 4; // Replace with dynamic user ID from user using the website
        const groupId = null; // Replace with group logic if applicable
        const version = '1.0.0'; // Replace with dynamic versioning if required
	//////

        // Call the storePackage function
        const result = await storePackage(packageName, version, file.buffer, userId, groupId);

        res.status(200).send({
            message: 'Package uploaded successfully',
            packageId: result.packageId,
        });
    } catch (error: any) {
        console.error('Error in /upload:', error.message || error);
        res.status(500).send({ message: 'Failed to upload package', error: error.message || 'Unknown error' });
    }
});

export default router;
