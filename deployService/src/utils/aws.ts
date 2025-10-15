import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.ACCOUNT_ENDPOINT,
    credentials: {
        accessKeyId: process.env.ACCOUNT_ACCESS_ID || '',
        secretAccessKey: process.env.ACCOUNT_SECRET_KEY || '',
    },
});

export async function downloadS3Folder(prefix: string): Promise<string[]> {
    const params = {
        Bucket: 'base', // Change to your bucket name if needed
        Prefix: prefix,
    };
    let files: string[] = [];
    let ContinuationToken: string | undefined = undefined;
    // place repositories under the service root: ../../repos
    const baseRepoDir = path.resolve(__dirname, '../../repos');
    // extract id from prefix like 'repos/<id>'
    const parts = prefix.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    do {
        const command = new ListObjectsV2Command({ ...params, ContinuationToken });
        const response: ListObjectsV2CommandOutput = await s3.send(command);
        if (response.Contents) {
            for (const obj of response.Contents) {
                if (obj.Key) {
                    files.push(obj.Key);
                    const getCmd = new GetObjectCommand({ Bucket: params.Bucket, Key: obj.Key });
                    const fileResponse = await s3.send(getCmd);
                    // Ensure files are stored inside ../../repos/<id>/<relativePath>
                    const relativePath = obj.Key.substring(prefix.length).replace(/^\/+/, '');
                    const filePath = path.join(baseRepoDir, id, relativePath);
                    const dirPath = path.dirname(filePath);
                    fs.mkdirSync(dirPath, { recursive: true });
                    const writable = fs.createWriteStream(filePath);
                    await new Promise<void>((resolve, reject) => {
                        (fileResponse.Body as NodeJS.ReadableStream).pipe(writable)
                            .on('finish', () => resolve())
                            .on('error', reject);
                    });
                }
            }
        }
        ContinuationToken = response.NextContinuationToken;
    } while (ContinuationToken);
    return files.filter(Boolean);
}

function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

export async function uploadFile(fileName: string, filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const command = new PutObjectCommand({
        Bucket: 'base', // Change to your bucket name if needed
        Key: fileName,
        Body: fileStream,
    });
    try {
        const response = await s3.send(command);
        return response;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

export async function copyFinalDist(id: string) {
    // read built artifacts from ../../repos/<id> and detect common output dirs
    const baseRepoDir = path.resolve(__dirname, '../../repos');
    const repoDir = path.join(baseRepoDir, `${id}`);

    const candidates = ['dist', 'build', 'out'];
    let folderPath: string | null = null;
    for (const c of candidates) {
        const p = path.join(repoDir, c);
        if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
            folderPath = p;
            console.log(`Using build output directory: ${folderPath}`);
            break;
        }
    }

    if (!folderPath) {
        // Provide helpful diagnostics instead of throwing raw ENOENT
        console.error(`No build output found for repo ${id}. Checked: ${candidates.join(', ')} in ${repoDir}`);
        try {
            const listing = fs.existsSync(repoDir) ? fs.readdirSync(repoDir) : [];
            console.error(`Contents of ${repoDir}: ${JSON.stringify(listing)}`);
        } catch (err) {
            console.error(`Failed to list ${repoDir}:`, err);
        }
        throw new Error(`No build output found for ${id}. Ensure the project was built and outputs to one of: ${candidates.join(', ')}`);
    }

    const allFiles = getAllFiles(folderPath);
    for (const file of allFiles) {
        const relativePath = file.slice(folderPath.length + 1);
        await uploadFile(`builds/${id}/${relativePath}`, file);
    }
}