

## How Base Works

Base takes a GitHub repository URL and serves your React application on a public URL. The deployment pipeline:

1. Get the GitHub URL from the user
2. Clone the repo and store it in cloud storage
3. Build the project and store build files
4. Serve the application on a public URL
5. Handle incoming requests and serve build files

## System Design Overview


The architecture breaks down into three main services working together:

**Upload Service** -> **Deploy Service** -> **Request Handler**

Each service has a specific responsibility and communicates through Redis queues, making the system scalable and fault-tolerant.

## Architecture & Services

### Upload Service
The entry point for new deployments. Handles repository ingestion and initial processing.

**What it does:**
- Receives GitHub URL from user
- Clones repository using `simple-git`
- Uploads source code to Cloudflare R2 storage
- Pushes deployment job to Redis queue
- Updates deployment status in Redis
- Returns deployment ID to user

**Libraries used:**
- `simple-git` - Git operations and repository cloning
- `express` - API endpoints and request handling
- `aws-sdk` - Cloudflare R2 storage interactions
- `redis` - Queue management and status updates

### Deploy Service
The build engine that processes queued deployments and generates production assets.

**What it does:**
- Listens to Redis queue for new deployments
- Downloads source code from Cloudflare R2
- Runs build commands using `child_process`
- Uploads generated build files to R2 storage
- Updates deployment status in Redis

**Libraries used:**
- `child_process` - Execute build commands (npm install, npm run build)
- `aws-sdk` - Download source and upload build artifacts
- `redis` - Queue processing and status management

### Request Handler
The serving layer that delivers built applications to end users.

**What it does:**
- Receives requests with deployment ID
- Downloads build files from Cloudflare R2
- Serves static files to users
- Handles routing for single-page applications

**Libraries used:**
- `express` - HTTP server and routing
- `aws-sdk` - Retrieve build files from storage

## Tech Stack

**Backend Services:** Node.js with Express
**Storage:** Cloudflare R2 (S3-compatible object storage)
**Queue Management:** Redis
**Version Control:** Git integration via simple-git
**Build Process:** Native Node.js child_process

## Database Strategy

**Cloudflare R2**
- Stores source code after cloning
- Stores build artifacts for serving
- Provides S3-compatible API for seamless integration

**Redis**
- Manages deployment queues between services
- Stores deployment status and metadata
- Enables real-time status updates

## Why I Built This

Building this platform taught me how much we take services like Vercel for granted. While frontend engineering evolves with AI, I wanted to understand the peripheral concepts - how CI/CD works, how deployment happens, and how code reaches end users. Every component was built to understand the fundamental concepts behind modern deployment platforms.
