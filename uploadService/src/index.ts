import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import path from "path"
import { uploadFile } from "./utils/aws";
import { createClient } from "redis";
import { generate, getAllFiles } from "./utils/helper";
import multer from 'multer';
import { editImageWithGemini, analyzeImage } from './utils/gemini';

const publisher = createClient();
publisher.connect();

const subscribe  = createClient();
subscribe.connect();


const app = express();
app.use(cors())
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
    },
});


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
        publisher.hSet("status",id,"uploaded"); // hset - used to set value, uses hashset


        res.json({ id });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload all files', details: error });
    }
})

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscribe.hGet("status", id as string);
    res.json({
        status: response
    });
})

// Image editing endpoints
app.post("/image/analyze", upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const analysis = await analyzeImage(req.file.buffer, req.file.mimetype);
        
        res.json({
            success: true,
            analysis: analysis,
            filename: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ 
            error: 'Failed to analyze image', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post("/image/edit", upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { instruction } = req.body;
        if (!instruction) {
            return res.status(400).json({ error: 'No editing instruction provided' });
        }

        const result = await editImageWithGemini({
            instruction: instruction,
            imageBuffer: req.file.buffer,
            mimeType: req.file.mimetype
        });

        res.json(result);
    } catch (error) {
        console.error('Error editing image:', error);
        res.status(500).json({ 
            error: 'Failed to edit image', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


app.listen(3000);
