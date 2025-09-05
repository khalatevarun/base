import { createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from './cloudflare';
import { buildProject } from "./utils";

const subscriber = createClient();
subscriber.connect();

async function main(){
    while(true){
        const response = await subscriber.rPop('build-queue');
        if (response) {
            const id = response;
            console.log('Popped:', response);
            await downloadS3Folder(`output/${id}`);
            await buildProject(id);
            await copyFinalDist(id);
        } else {
            await new Promise(res => setTimeout(res, 1000));
        }
    }  
}

main();