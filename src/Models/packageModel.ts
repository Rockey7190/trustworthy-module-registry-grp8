import * as fs from 'fs';
import * as path from 'path';

// Define the directory where packages will be stored
const storageDir = path.resolve(__dirname, '../../storage');

// Ensure the storage directory exists
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

// Store a package (zip file) in the storage directory
export const storePackage = async (packageName: string, packageData: Buffer): Promise<string> => {
    try {
        const packagePath = path.join(storageDir, `${packageName}.zip`);
        
        // Write the package data to a .zip file
        await fs.promises.writeFile(packagePath, packageData);
        
        return `Package ${packageName} stored successfully at ${packagePath}`;
    } catch (error) {
        console.error('Error storing package:', error);
        throw new Error('Failed to store package');
    }
};

// Update an existing package with a new version
export const updatePackage = async (packageName: string, newPackageData: Buffer): Promise<string> => {
    try {
        const packagePath = path.join(storageDir, `${packageName}.zip`);
        
        // Check if the package already exists
        if (!fs.existsSync(packagePath)) {
            throw new Error(`Package ${packageName} does not exist. Cannot update.`);
        }

        // Overwrite the existing package with the new data
        await fs.promises.writeFile(packagePath, newPackageData);
        
        return `Package ${packageName} updated successfully at ${packagePath}`;
    } catch (error) {
        console.error('Error updating package:', error);
        throw new Error('Failed to update package');
    }
};

