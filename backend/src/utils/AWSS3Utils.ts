import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { AppConfig } from "../config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class S3BucketService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: String(AppConfig.get("BUCKET_REGION")) || "ap-south-1",
      credentials: {
        accessKeyId: String(AppConfig.get("AMAZON_ACCESS_KEY")) || "",
        secretAccessKey:
          String(AppConfig.get("AMAZON_SECRET_ACCESS_KEY")) || "",
      },
    });
  }

  /**
   * Generate a pre-signed URL for uploading an object.
   * @param key - The key (filename) for the object.
   * @param expiresIn - The expiry time of the signed URL in seconds.
   * @returns A promise that resolves to the signed URL.
   */

  async getUploadUrl(
    key: string,
    bucketName: string,
    expiresIn: number = 300
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: "video/mp4",
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a pre-signed URL for downloading an object.
   * @param key - The key (filename) of the object.
   * @param expiresIn - The expiry time of the signed URL in seconds.
   * @returns A promise that resolves to the signed URL.
   */
  async getDownloadUrl(
    key: string,
    bucketName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete an object from the S3 bucket.
   * @param key - The key (filename) of the object.
   * @returns A promise that resolves when the object is deleted.
   */

  async deleteObject(key: string, bucketName: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}

export const s3Service = new S3BucketService();
