import { createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from './utils/aws';
import { buildProject } from "./utils/helper";

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const subscriber = createClient({ url: redisUrl });
subscriber.connect();

const publisher = createClient({ url: redisUrl });
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