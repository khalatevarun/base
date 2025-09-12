import path from "path";
import { spawn } from "child_process";
import fs from "fs";


export function buildProject(id:string): Promise<void> {
    return new Promise((resolve, reject) => {
        // prefer runtime location (compiled dist) so worker finds repos under dist/repos
        const repoHostPath = path.join(__dirname, 'repos', id);
        console.log(`[build:${id}] repoHostPath=${repoHostPath}`);
        if (!fs.existsSync(repoHostPath)) {
            return reject(new Error(`Repo path does not exist: ${repoHostPath}`));
        }

        
        // use Node 20 by default to match project engine requirements
        const IMAGE = process.env.BUILDER_IMAGE || "node:20-alpine";
        const TIMEOUT_MS = Number(process.env.BUILDER_TIMEOUT_MS || 5 * 60 * 1000); // default 5 mins
        const MEMORY = process.env.BUILDER_MEMORY || "1g";
        const CPUS = process.env.BUILDER_CPUS || "0.5";
        const UID = process.getuid ? String(process.getuid()) : "1000";
        const GID = process.getgid ? String(process.getgid()) : "1000";

        // ensure npm uses a writable HOME and cache inside the mounted workdir
         const dockerArgs = [
            "run", "--rm",
            "--memory", MEMORY,
            "--cpus", CPUS,
            "--user", `${UID}:${GID}`,
            "-e", `HOME=/work`,
            "-e", `npm_config_cache=/work/.npm`,
            "-v", `${repoHostPath}:/work`,
            "-w", "/work",
            IMAGE,
            "sh", "-c",
            // use npm ci for reproducible installs and point cache to /work/.npm
            "npm install --cache /work/.npm && npm run build"
        ];
        console.log(`[build:${id}] docker ${dockerArgs.join(' ')}`);

        const child = spawn("docker", dockerArgs, { stdio: ["ignore", "pipe", "pipe"] });

         const killTimer = setTimeout(() => {
            try { child.kill("SIGKILL"); } catch (e) { /* ignore */ }
        }, TIMEOUT_MS);

        // const child = exec(`cd ${path.join(__dirname, `repos/${id}`)} && npm install && npm run build`)

        child.stdout?.on('data', (chunk) => {
            process.stdout.write(`[build:${id}] ${chunk}`);
        });

        child.stderr?.on('data', (chunk) => {
            process.stderr.write(`[build:${id}] ${chunk}`);
        });

        child.on("error", (err) => {
            clearTimeout(killTimer);
            reject(err);
        });

        child.on("close", (code, signal) => {
            clearTimeout(killTimer);
            if (signal) return reject(new Error(`Build killed by signal: ${signal}`));
            if (code === 0) return resolve();
            return reject(new Error(`Build failed with exit code ${code}`));
        });
    })

}