"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv_1 = __importDefault(require("dotenv"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const AWSS3Utils_1 = require("./AWSS3Utils");
dotenv_1.default.config();
const videoUrl = process.env.VIDEO_URL;
const outputBucket = process.env.OUTPUT_BUCKET;
const videoId = process.env.VIDEO_ID || Date.now().toString();
function downloadVideo(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputPath = path.join(__dirname, "../temp", "input.mp4");
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        console.log("Downloading video from URL", url);
        const response = yield (0, axios_1.default)({
            method: "GET",
            url: url,
            responseType: "stream",
        });
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", () => resolve(outputPath));
            writer.on("error", reject);
        });
    });
}
function transcodeToHLS(inputPath) {
    const outputDir = path.join(__dirname, "../temp/output");
    fs.mkdirSync(outputDir, { recursive: true });
    // Create directories for each resolution
    ["360p", "480p", "720p"].forEach((res) => {
        fs.mkdirSync(path.join(outputDir, res), { recursive: true });
    });
    // Execute FFmpeg commands
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Transcode to 360p
            yield runFFmpeg(inputPath, outputDir, 360);
            // Transcode to 480p
            yield runFFmpeg(inputPath, outputDir, 480);
            // Transcode to 720p
            yield runFFmpeg(inputPath, outputDir, 720);
            // Create master playlist
            createMasterPlaylist(outputDir);
            resolve(outputDir);
        }
        catch (error) {
            reject(error);
        }
    }));
}
function runFFmpeg(inputPath, outputDir, height) {
    return new Promise((resolve, reject) => {
        const resolution = `${height}p`;
        const outputPath = path.join(outputDir, resolution);
        console.log(`Transcoding to ${resolution}...`);
        const ffmpeg = (0, child_process_1.spawn)("ffmpeg", [
            "-i",
            inputPath,
            "-vf",
            `scale=-2:${height}`,
            "-c:v",
            "h264",
            "-profile:v",
            "main",
            "-crf",
            "23",
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-b:a",
            "128k",
            "-hls_time",
            "6",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            `${outputPath}/segment_%03d.ts`,
            `${outputPath}/playlist.m3u8`,
        ]);
        ffmpeg.stderr.on("data", (data) => {
            console.log(`FFmpeg: ${data}`);
        });
        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });
    });
}
function createMasterPlaylist(outputDir) {
    const masterContent = `#EXTM3U
  #EXT-X-VERSION:3
  #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
  360p/playlist.m3u8
  #EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
  480p/playlist.m3u8
  #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
  720p/playlist.m3u8`;
    fs.writeFileSync(path.join(outputDir, "master.m3u8"), masterContent);
}
function getAllFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath));
        }
        else {
            results.push(filePath);
        }
    });
    return results;
}
function uploadToS3(outputDir, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Uploading HLS content to S3...");
        const allFiles = getAllFiles(outputDir); // Get all files from the HLS directory
        for (const filePath of allFiles) {
            const key = path.relative(outputDir, filePath); // Preserve directory structure
            try {
                // Get a pre-signed URL for uploading
                const uploadUrl = yield AWSS3Utils_1.s3Service.getUploadUrl(key, bucketName);
                // Read file data
                const fileStream = fs.createReadStream(filePath);
                // Upload file using the pre-signed URL
                yield axios_1.default.put(uploadUrl, fileStream, {
                    headers: {
                        "Content-Type": "video/mp4", // Ensure correct content type
                    },
                });
                console.log(`Uploaded: ${key}`);
            }
            catch (error) {
                console.error(`Failed to upload ${key}:`, error);
            }
        }
        console.log("All files uploaded successfully.");
    });
}
function cleanup() {
    return __awaiter(this, void 0, void 0, function* () {
        const tempDir = path.join(__dirname, "../temp");
        fs.rmSync(tempDir, { recursive: true, force: true });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!videoUrl) {
                throw new Error("VIDEO_URL environment variable is required");
            }
            console.log(`Processing video: ${videoUrl}`);
            console.log(`Video ID: ${videoId}`);
            console.log(`Output bucket: ${outputBucket}`);
            // Download the video
            const inputPath = yield downloadVideo(videoUrl);
            // Transcode to HLS
            const outputDir = yield transcodeToHLS(inputPath);
            // Upload to S3
            const playbackUrl = yield uploadToS3(outputDir, outputBucket);
            console.log(`Processing complete!`);
            console.log(`Playback URL: ${playbackUrl}`);
            // Clean up
            yield cleanup();
            process.exit(0);
        }
        catch (error) {
            console.error("Error processing video:", error);
            process.exit(1);
        }
    });
}
main();
