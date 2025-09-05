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




