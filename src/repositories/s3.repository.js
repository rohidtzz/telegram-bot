const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_USE_SSL,
  S3_FORCE_PATH_STYLE
} = require("../config");
const logger = require("../utils/logger");

// Parse endpoint to get host and port
function parseEndpoint(endpoint) {
  const url = new URL(endpoint.startsWith("http") ? endpoint : `http://${endpoint}`);
  return {
    hostname: url.hostname,
    port: url.port ? parseInt(url.port) : url.protocol === "https:" ? 443 : 80
  };
}

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY
  },
  forcePathStyle: S3_FORCE_PATH_STYLE,
  tls: S3_USE_SSL
});

/**
 * Ensure bucket exists, create if not
 */
async function ensureBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    logger.info(`✓ S3 bucket exists: ${S3_BUCKET}`);
  } catch (error) {
    if (error.name === "NotFound") {
      logger.info(`Creating S3 bucket: ${S3_BUCKET}`);
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      logger.info(`✓ S3 bucket created: ${S3_BUCKET}`);
    } else {
      throw error;
    }
  }
}

/**
 * Upload file to S3
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object name/path
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} contentType - Content type (MIME type)
 * @returns {Promise<object>}
 */
async function uploadFile(bucket, objectName, fileBuffer, contentType = "application/octet-stream") {
  try {
    const params = {
      Bucket: bucket,
      Key: objectName,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        "Upload-Date": new Date().toISOString()
      }
    };

    await s3Client.send(new PutObjectCommand(params));
    logger.info(`✓ File uploaded to S3: ${objectName}`);

    return {
      bucket,
      object: objectName,
      size: fileBuffer.length,
      contentType
    };
  } catch (error) {
    logger.error(`Failed to upload file to S3: ${error.message}`);
    throw error;
  }
}

/**
 * Get signed URL for file access
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object name/path
 * @param {number} expiresIn - URL expiration time in seconds (default 3600 = 1 hour)
 * @returns {Promise<string>}
 */
async function getFileUrl(bucket, objectName, expiresIn = 3600) {
  try {
    const params = {
      Bucket: bucket,
      Key: objectName
    };

    const url = await getSignedUrl(s3Client, new GetObjectCommand(params), {
      expiresIn
    });

    logger.info(`✓ Generated signed URL for: ${objectName}`);
    return url;
  } catch (error) {
    logger.error(`Failed to generate signed URL: ${error.message}`);
    throw error;
  }
}

/**
 * Delete file from S3
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object name/path
 * @returns {Promise<void>}
 */
async function deleteFile(bucket, objectName) {
  try {
    const params = {
      Bucket: bucket,
      Key: objectName
    };

    await s3Client.send(new DeleteObjectCommand(params));
    logger.info(`✓ File deleted from S3: ${objectName}`);
  } catch (error) {
    logger.error(`Failed to delete file from S3: ${error.message}`);
    throw error;
  }
}

module.exports = {
  ensureBucket,
  uploadFile,
  getFileUrl,
  deleteFile
};
