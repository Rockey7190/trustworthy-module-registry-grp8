import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { pool } from '../Config/dbConnection'; // Ensure the db connection is correct

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const storePackage = async (
    packageName: string,
    version: string,
    fileBuffer: Buffer,
    userId: number,
    groupId: number | null
): Promise<{ message: string; packageId: number }> => {
    try {
        console.log('Starting S3 upload...');
        const key = `${packageName}-${version}.zip`;
        const bucketName = process.env.AWS_BUCKET_NAME!;

        // Upload file to S3
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileBuffer,
        });

        await s3Client.send(command);
        console.log('S3 upload successful!');

        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        console.log('Inserting into database...');
        const query = `
            INSERT INTO packages (package_name, version, s3_url, uploaded_by, group_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING package_id;
        `;
        const values = [packageName, version, s3Url, userId, groupId];
        const result = await pool.query(query, values);

        console.log('Database insertion successful!', result.rows[0]);
        return { message: 'Package stored successfully', packageId: result.rows[0].package_id };
    } catch (error: any) {
        console.error('Error in storePackage:', error.message || error);
        throw new Error('Failed to store package');
    }
};

