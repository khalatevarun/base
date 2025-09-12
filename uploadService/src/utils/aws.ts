import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.ACCOUNT_ENDPOINT,
    credentials: {
        accessKeyId: process.env.ACCOUNT_ACCESS_ID || '',
        secretAccessKey: process.env.ACCOUNT_SECRET_KEY || '',
    },
});

export const uploadFile = async (fileName: string, filePath: string) => {
    const fileStream = fs.createReadStream(filePath);
    const command = new PutObjectCommand({
        Bucket: 'base', 
        Key: fileName,
        Body: fileStream,
    });
    try {
        const response = await s3.send(command);
        console.log(response);
        return response;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}