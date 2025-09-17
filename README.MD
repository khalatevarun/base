# Building Base - A platform to build and deploy React projects

This is my attempt to build a platform like Vercel from scratch using cloud services.
While I have been hearing that frontend engineering is dead in the AI era, I still believe that there is a lot of concepts apart from just building a UI. I want to learn all the peripheral concepts around frontend engineering. My intention is to understand how the CI/CD works, how the deployment works and how the code reaches the end user. While system design preparation is also important, since I am looking for a job, I think building a project is the best way to learn. I now understand how granted we take these services for. 

Here is the log of my learnings and the architecture I am building.

## 🎨 New Feature: AI Image Editing with Gemini API

Base now includes integrated AI-powered image analysis and editing guidance using Google's Gemini API. See [GEMINI_IMAGE_API.md](./GEMINI_IMAGE_API.md) for detailed documentation.

**Key Features:**
- **Image Analysis:** Get detailed AI insights about your images
- **Edit Instructions:** Receive professional editing guidance based on your requirements  
- **Modern UI:** Clean, intuitive interface with real-time previews
- **Multiple Formats:** Support for JPG, PNG, GIF, WebP (up to 10MB)

**API Endpoints:**
- `POST /image/analyze` - Analyze image content and composition
- `POST /image/edit` - Get detailed editing instructions based on user requirements

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





# Building Vercel

3 phases

1. Upload phase
2. Deployment phase
3. Request phase


## Upload phase

Take the github url from the user, download the code and store it in a db



AWS Tech Required

1. S3 - Cloud Object Storage
2. Amazon Simple Queue Service
3.


## Deployment Phase

Build the project and store it in db. As in convert React project to HTML/CSS/JS


AWS Tech Used

S3

Simple Queue Service

EC2 instances by AWS Fargate


# Request Phase


amazon global accelerator

amazon global network
# base



# learnings
1. aws sdk can be used for cloudfare object storage as well. smart move by cloudflare haha
2. using the queues service from reddis. SQS is similar to it, offered by AWS.
3. child process in nodejs to run commands like npm install, npm run build
4. pipe the express response efficiently send the file content directly from s3 to the user without storing it in the server memory. Greate way to server large files or binary data in Nodejs.
5. in redis you cannot use the same client to get data and set date, you need to create separate clients for that.




