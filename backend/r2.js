import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load env vars early — ES module imports are hoisted above dotenv.config() in server.js
dotenv.config();

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Upload a buffer to R2 and return the public URL
export async function uploadToR2(buffer, filename, contentType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${PUBLIC_URL}/${filename}`;
}

// Delete a file from R2 by its key
export async function deleteFromR2(filename) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: filename,
    })
  );
}

export default s3Client;
