import express from "express";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.ACCOUNT_ENDPOINT,
    credentials: {
        accessKeyId: process.env.ACCOUNT_ACCESS_ID || '',
        secretAccessKey: process.env.ACCOUNT_SECRET_KEY || '',
    },
});

app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path;
    try {
        const command = new GetObjectCommand({
            Bucket: "base",
            Key: `builds/${id}${filePath}`
        });
        const contents = await s3.send(command);
        const type = filePath.endsWith("html") ? "text/html" :
            filePath.endsWith("css") ? "text/css" : "application/javascript";
        res.set("Content-Type", type);
        // contents.Body is a stream, so pipe it to response
        (contents.Body as NodeJS.ReadableStream).pipe(res);
    } catch (error) {
        res.status(404).send("File not found");
    }
})

app.listen(3001);
