import path from "path";
import { exec } from "child_process"

export function buildProject(id:string) {
    return new Promise((resolve) => {
        // run build inside ../../repos/<id> so artifacts land in that folder
        const repoPath = path.join(__dirname, `../../repos/${id}`);
        // ensure devDependencies (typescript, vite, etc.) are installed even if NODE_ENV=production
        // --include=dev forces installing devDependencies when npm defaults to production
        const cmd = `cd ${repoPath} && npm install --include=dev && npm run build`;
        const child = exec(cmd);

        child.stdout?.on('data', function(data) {
            console.log('stdout:' + data);
        });

        child.stderr?.on('data', function(data){ 
            console.log('stderr: ' + data);
        });

        child.on('close', function(code){
            if (code && code !== 0) {
                console.log(`build process exited with code ${code}`);
            }
            resolve("")
        });
    })

}