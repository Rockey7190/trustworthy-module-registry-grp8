import express, { Request, Response } from 'express';
import multer from 'multer';
import { storePackage, updatePackage } from '../../Models/packageModel';  // Ensure the import path matches the correct casing of the file

const upload = multer();
export const uploadRouter = express.Router();

// Endpoint to upload a new package
uploadRouter.post('/upload', upload.single('package'), async (req: Request, res: Response) => {
    const { packageName } = req.body;

    if (!packageName || !req.file) {
        return res.status(400).json({ error: 'Missing package name or file' });
    }

    try {
        const result = await storePackage(packageName, req.file.buffer);
        res.status(200).json({ message: result });
    } catch (error) {
        // Cast the error to Error type to access the message property
        res.status(500).json({ error: (error as Error).message });
    }
});

// Endpoint to update an existing package
uploadRouter.post('/update', upload.single('package'), async (req: Request, res: Response) => {
    const { packageName } = req.body;

    if (!packageName || !req.file) {
        return res.status(400).json({ error: 'Missing package name or file' });
    }

    try {
        const result = await updatePackage(packageName, req.file.buffer);
        res.status(200).json({ message: result });
    } catch (error) {
        // Cast the error to Error type to access the message property
        res.status(500).json({ error: (error as Error).message });
    }
});

