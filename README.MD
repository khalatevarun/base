# Building Base - A platform to build and deploy React projects

This is my attempt to build a platform like Vercel from scratch using cloud services.
While I have been hearing that frontend engineering is dead in the AI era, I still believe that there is a lot of concepts apart from just building a UI. I want to learn all the peripheral concepts around frontend engineering. My intention is to understand how the CI/CD works, how the deployment works and how the code reaches the end user. While system design preparation is also important, since I am looking for a job, I think building a project is the best way to learn. I now understand how granted we take these services for. 

Here is the log of my learnings and the architecture I am building.

# Overview
We can break the whole process into 5 steps

1. Get the github url of the project from the user
2. Clone the github repo on our server and store it in a db
3. Build the project and store the build files in the db
4. Once the build files are ready, share a url with the user where the code is hosted
5. When user hits the url, serve the build files from the db

# Architecture
To achieve this, I am using the following architecture

## Services
1. Upload Service - To get the github url from the user, clone the repo and store it in db
2. Deploy Service - To build the project and store the build files in db
3. Requestion Handler - To serve the build files from the db when user hits the url

## Database

1. Cloudflare R2 - To store the code and build files
2. Redis - To manage the queues and store the status of each deployment

## Libraries Used
1. simple-git - To clone the github repo
2. child_process - To run the build commands
3. express - To create the api endpoints
4. redis - To interact with redis db
5. aws-sdk - To interact with cloudflare r2 db


Upload Service
1. Get the github url from the user
2. Clone the repo using simple-git
3. Upload the code to cloudflare r2 using aws-sdk
4. Push a message to redis queue 
5. Update the status of the deployment in redis db
6. Return the deployment id to the user

Deploy Service
1. Listen to the redis queue for new deployments
2. Download the code from cloudflare r2 using aws-sdk
3. Run the build commands using child_process
4. Upload the build files to cloudflare r2 using aws-sdk
5. Update the status of the deployment in redis db

Request Handler
1. Get the deployment id from the user
2. Download the build files from cloudflare r2 using aws
-sdk
3. Serve the build files to the user

Challenges
1. Generating a deployment link that is accessible on the internet:
Problem Currently once the project is build and the build files are stored in r2, a link is generated - id.base.com. For testing purposes and local develoepment, I go to the /etc/hosts files and map the id.base.com to localhost. To make it available on the internet, I need to buy a domain and map it to my server. 


# Enhancements:

## Containerizing the build process:
### Why?
- Isolation: running npm install / build inside a container prevents arbitrary repo code from touching host files/processes or system-wide packages.

- Risks in the current version: Executes builds on host: untrusted code runs with host privileges.

## Containerized build notes (migration summary)

Replaced host builds with containerized builds; few challenges faced and lessons learned in this transition:

- Engine mismatch (node version) inside container
  - Some projects required a newer Node engine (e.g. Node 20). Fixed by changing the builder image to a compatible Node image (configurable via `BUILDER_IMAGE`).

- npm EACCES on cache folder (`/.npm`) inside container
  - NPM attempted to write to a root-owned cache directory when the container ran as a non-root user, causing EACCES errors.

- Solution implemented
  - Set environment variables inside the container so npm uses a writable directory in the mounted workdir:
    - `HOME=/work`
    - `npm_config_cache=/work/.npm`
  - Run the build with `npm ci --cache /work/.npm && npm run build` and map the host UID:GID into the container (`--user UID:GID`) so created files have correct ownership.

These changes made containerized builds reproducible and prevented permission issues while keeping the build isolation benefits.







