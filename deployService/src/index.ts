import { createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from './utils/aws';
import { buildProject } from "./utils/helper";

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

async function main(){
    while(true){
        const response = await subscriber.rPop('build-queue');
        if (response) {
            const id = response;
            console.log('Popped:', response);
            await downloadS3Folder(`repos/${id}`);
            await buildProject(id);
            await copyFinalDist(id);
            publisher.hSet("status", id, "deployed");
        } else {
            await new Promise(res => setTimeout(res, 1000));
        }
    }  
}

main();