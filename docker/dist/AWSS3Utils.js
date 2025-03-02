"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class S3BucketService {
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: String(process.env.BUCKET_REGION) || "ap-south-1",
            credentials: {
                accessKeyId: String(process.env.AMAZON_ACCESS_KEY) || "",
                secretAccessKey: String(process.env.AMAZON_SECRET_ACCESS_KEY) || "",
            },
        });
    }
    /**
     * Generate a pre-signed URL for uploading an object.
     * @param key - The key (filename) for the object.
     * @param expiresIn - The expiry time of the signed URL in seconds.
     * @returns A promise that resolves to the signed URL.
     */
    getUploadUrl(key_1, bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (key, bucketName, expiresIn = 300) {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                ContentType: "video/mp4",
            });
            return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        });
    }
    /**
     * Generate a pre-signed URL for downloading an object.
     * @param key - The key (filename) of the object.
     * @param expiresIn - The expiry time of the signed URL in seconds.
     * @returns A promise that resolves to the signed URL.
     */
    getDownloadUrl(key_1, bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (key, bucketName, expiresIn = 3600) {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        });
    }
    /**
     * Delete an object from the S3 bucket.
     * @param key - The key (filename) of the object.
     * @returns A promise that resolves when the object is deleted.
     */
    deleteObject(key, bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            yield this.s3Client.send(command);
        });
    }
}
exports.s3Service = new S3BucketService();
