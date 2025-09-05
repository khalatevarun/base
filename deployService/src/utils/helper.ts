import path from "path";
import { exec } from "child_process"

export function buildProject(id:string) {
    return new Promise((resolve) => {
        const child = exec(`cd ${path.join(__dirname, `repos/${id}`)} && npm install && npm run build`)

        child.stdout?.on('data', function(data) {
            console.log('stdout:' + data);
        });

        child.stderr?.on('data', function(data){ 
            console.log('stderr: ' + data);
        });

        child.on('close', function(code){
            resolve("")
        });
    })

}