const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const UPLOADS_DIR = './uploads';

async function migrateFilesToS3() {
  try {
    console.log('🚀 Starting file migration to S3...');

    // Get all uploaded files from database
    const uploadedFiles = await prisma.uploadedFile.findMany();
    const practiceClones = await prisma.practiceClone.findMany();

    console.log(`Found ${uploadedFiles.length} uploaded files and ${practiceClones.length} practice clones`);

    // Migrate uploaded files
    for (const file of uploadedFiles) {
      const localPath = path.join(UPLOADS_DIR, file.filename);
      
      if (fs.existsSync(localPath)) {
        console.log(`📤 Uploading ${file.filename}...`);
        
        const fileContent = fs.readFileSync(localPath);
        const s3Key = `uploads/${file.filename}`;
        
        await s3.upload({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: fileContent,
          ContentType: 'application/octet-stream'
        }).promise();
        
        console.log(`✅ Uploaded ${file.filename} to S3`);
      } else {
        console.log(`⚠️  Local file not found: ${localPath}`);
      }
    }

    // Migrate practice clone files
    for (const clone of practiceClones) {
      const localPath = path.join(UPLOADS_DIR, clone.filename);
      
      if (fs.existsSync(localPath)) {
        console.log(`📤 Uploading practice clone ${clone.filename}...`);
        
        const fileContent = fs.readFileSync(localPath);
        const s3Key = `practice-clones/${clone.filename}`;
        
        await s3.upload({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: fileContent,
          ContentType: 'application/octet-stream'
        }).promise();
        
        console.log(`✅ Uploaded practice clone ${clone.filename} to S3`);
      } else {
        console.log(`⚠️  Practice clone file not found: ${localPath}`);
      }
    }

    console.log('🎉 File migration to S3 completed!');
  } catch (error) {
    console.error('❌ File migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFilesToS3();