import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate } from "./utils";
import path from "path"
import { getAllFiles } from "./file";
import { uploadFile } from "./cloudflare";
import { createClient } from "redis";

const publisher = createClient();
publisher.connect();

const subscribe  = createClient();
subscribe.connect();


const app = express();
app.use(cors())
app.use(express.json());


app.post("/deploy",async (req,res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
    await simpleGit().clone(repoUrl, path.join(__dirname,`./repos/${id}`));

    const files  = getAllFiles(path.join(__dirname, `repos/${id}`));

    console.log("Files", files);

    // Upload all files concurrently and wait for completion
    try {
        await Promise.all(
            files.map(file => uploadFile(file.slice(__dirname.length + 1), file))
        );

        publisher.lPush("build-queue", id);
        publisher.hSet("status",id,"uploaded"); // hset - sed to set value, like db


        res.json({ id });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload all files', details: error });
    }
})

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscribe.hGet("stauts", id as string);
    res.json({
        status: response
    });
})


app.listen(3000);
