import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import path from "path"
import { getAllFiles } from "./file";
import { uploadFile } from "./cloudflare";


const app = express();
app.use(cors())
app.use(express.json());

app.listen(3000);

app.post("/deploy",async (req,res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
    await simpleGit().clone(repoUrl, path.join(__dirname,`./output/${id}`));

    const files  = getAllFiles(path.join(__dirname, `output/${id}`));

    console.log("Files", files);

    // Upload all files concurrently and wait for completion
    try {
        await Promise.all(
            files.map(file => uploadFile(file.slice(__dirname.length + 1), file))
        );
        res.json({ id });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload all files', details: error });
    }
})