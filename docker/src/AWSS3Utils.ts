import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";
dotenv.config();

class S3BucketService {
  private s3Client: S3Client;
  private logger: (message: string, level?: string) => void;

  constructor() {
    // Set up logging
    const logDir = path.join(__dirname, "../logs");
    fs.mkdirSync(logDir, { recursive: true });
    const logStream = fs.createWriteStream(
      path.join(logDir, `s3-service-${Date.now()}.log`),
      { flags: "a" }
    );

    this.logger = (message, level = "INFO") => {
      const logMsg = `[${new Date().toISOString()}] [S3Service] [${level}] ${message}`;
      console.log(logMsg);
      logStream.write(logMsg + "\n");
    };

    // Get credentials
    const region = process.env.BUCKET_REGION;
    const accessKeyId = process.env.AMAZON_ACCESS_KEY;
    const secretAccessKey = process.env.AMAZON_SECRET_ACCESS_KEY;

    // Log credential status (without revealing actual values)
    this.logger(`AWS configuration: Region=${region || "NOT SET"}`);
    this.logger(
      `AWS Access Key ID: ${
        accessKeyId
          ? "****" + accessKeyId.substring(accessKeyId.length - 4)
          : "NOT SET"
      }`
    );
    this.logger(
      `AWS Secret Access Key: ${secretAccessKey ? "SET (hidden)" : "NOT SET"}`
    );

    // Validate credentials
    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger(
        "WARNING: Missing or empty AWS credentials in environment variables",
        "ERROR"
      );
      if (!region) this.logger("BUCKET_REGION is not set", "ERROR");
      if (!accessKeyId) this.logger("AMAZON_ACCESS_KEY is not set", "ERROR");
      if (!secretAccessKey)
        this.logger("AMAZON_SECRET_ACCESS_KEY is not set", "ERROR");
    }

    // Create S3 client with explicit credentials
    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: region || "ap-south-1",
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
      });
      this.logger("S3 client initialized with provided credentials");
    } else {
      // Try to use environment variables or instance profile credentials
      this.s3Client = new S3Client({
        region: region || "ap-south-1",
      });
      this.logger(
        "S3 client initialized with default credential provider chain"
      );
    }
  }

  /**
   * Generate a pre-signed URL for uploading an object.
   * @param key - The key (filename) for the object.
   * @param bucketName - The S3 bucket name
   * @param expiresIn - The expiry time of the signed URL in seconds.
   * @returns A promise that resolves to the signed URL.
   */
  async getUploadUrl(
    key: string,
    bucketName: string,
    expiresIn: number = 600
  ): Promise<string> {
    if (!key || !bucketName) {
      const error = new Error(
        `Invalid parameters: key=${key}, bucketName=${bucketName}`
      );
      this.logger(`Failed to generate upload URL: ${error.message}`, "ERROR");
      throw error;
    }

    this.logger(`Generating upload URL for ${bucketName}/${key}`);

    // Determine content type based on file extension
    let contentType = "application/octet-stream";
    if (key.endsWith(".mp4")) contentType = "video/mp4";
    if (key.endsWith(".m3u8")) contentType = "application/vnd.apple.mpegurl";
    if (key.endsWith(".ts")) contentType = "video/mp2t";

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger(`Successfully generated upload URL for ${bucketName}/${key}`);
      return url;
    } catch (error: any) {
      this.logger(`Failed to generate upload URL: ${error.message}`, "ERROR");
      if (error.stack) {
        this.logger(`Stack trace: ${error.stack}`, "ERROR");
      }
      throw error;
    }
  }

  /**
   * Upload a file directly to S3 without using presigned URLs
   * @param filePath - Path to the local file
   * @param key - The key (filename) to use in S3
   * @param bucketName - The S3 bucket name
   * @returns A promise that resolves when the upload completes
   */
  async uploadFile(
    filePath: string,
    key: string,
    bucketName: string,
    contentType?: string
  ): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Determine content type based on file extension
    const fileContentType =
      contentType || mime.lookup(filePath) || "application/octet-stream";
    const fileContent = fs.readFileSync(filePath);

    this.logger(`Uploading file directly to S3: ${bucketName}/${key}`);

    try {
      const fileContent = fs.readFileSync(filePath);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        ACL: "public-read",
      });

      await this.s3Client.send(command);
      this.logger(`Successfully uploaded ${bucketName}/${key}`);
    } catch (error: any) {
      this.logger(`Failed to upload file: ${error.message}`, "ERROR");
      if (error.stack) {
        this.logger(`Stack trace: ${error.stack}`, "ERROR");
      }
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for downloading an object.
   * @param key - The key (filename) of the object.
   * @param bucketName - The S3 bucket name
   * @param expiresIn - The expiry time of the signed URL in seconds.
   * @returns A promise that resolves to the signed URL.
   */
  async getDownloadUrl(
    key: string,
    bucketName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!key || !bucketName) {
      const error = new Error(
        `Invalid parameters: key=${key}, bucketName=${bucketName}`
      );
      this.logger(`Failed to generate download URL: ${error.message}`, "ERROR");
      throw error;
    }

    try {
      this.logger(`Generating download URL for ${bucketName}/${key}`);

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger(
        `Successfully generated download URL for ${bucketName}/${key}`
      );
      return url;
    } catch (error: any) {
      this.logger(`Failed to generate download URL: ${error.message}`, "ERROR");
      throw error;
    }
  }

  /**
   * Delete an object from the S3 bucket.
   * @param key - The key (filename) of the object.
   * @param bucketName - The S3 bucket name
   * @returns A promise that resolves when the object is deleted.
   */
  async deleteObject(key: string, bucketName: string): Promise<void> {
    if (!key || !bucketName) {
      const error = new Error(
        `Invalid parameters: key=${key}, bucketName=${bucketName}`
      );
      this.logger(`Failed to delete object: ${error.message}`, "ERROR");
      throw error;
    }

    try {
      this.logger(`Deleting object ${bucketName}/${key}`);

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger(`Successfully deleted object ${bucketName}/${key}`);
    } catch (error: any) {
      this.logger(`Failed to delete object: ${error.message}`, "ERROR");
      throw error;
    }
  }
}

export const s3Service = new S3BucketService();
