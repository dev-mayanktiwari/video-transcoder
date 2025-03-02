import dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import { spawn } from "child_process";
import { s3Service } from "./AWSS3Utils";
dotenv.config();

const videoUrl = process.env.VIDEO_URL;
const outputBucket = process.env.OUTPUT_BUCKET;
const videoId = process.env.VIDEO_ID || Date.now().toString();
const backendEndpoint =
  process.env.BACKEND_ENDPOINT ||
  "http://localhost:3000/api/v1/upload/upload-video-link";

const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || "";

// Configure logging
const logDir = path.join(__dirname, "../logs");
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, `video-processing-${videoId}.log`);
const logStream = fs.createWriteStream(logPath, { flags: "a" });

function log(message: string, level: "INFO" | "ERROR" | "DEBUG" = "INFO") {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  console.log(formattedMessage);
  logStream.write(formattedMessage + "\n");
}

// Log environment variables at startup
function logEnvironment() {
  log(`VIDEO_URL: ${videoUrl ? "SET (hidden for privacy)" : "NOT SET"}`);
  log(`OUTPUT_BUCKET: ${outputBucket || "NOT SET"}`);
  log(`VIDEO_ID: ${videoId}`);

  // Log AWS credentials (without revealing actual values)
  const region = process.env.BUCKET_REGION;
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_ACCESS_KEY;

  log(`AWS_REGION: ${region || "NOT SET"}`);
  log(`AWS_ACCESS_KEY: ${accessKey ? "SET (hidden for security)" : "NOT SET"}`);
  log(`AWS_SECRET_KEY: ${secretKey ? "SET (hidden for security)" : "NOT SET"}`);
}

async function downloadVideo(url: string) {
  const outputPath = path.join(__dirname, "../temp", "input.mp4");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  log(`Downloading video from URL: ${url}`);
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        log(`Video download completed: ${outputPath}`);
        resolve(outputPath);
      });
      writer.on("error", (err) => {
        log(`Error writing video file: ${err.message}`, "ERROR");
        reject(err);
      });
    });
  } catch (error: any) {
    log(`Error downloading video: ${error.message}`, "ERROR");
    throw error;
  }
}

function transcodeToHLS(inputPath: string): Promise<string> {
  const outputDir = path.join(__dirname, "../temp/output");
  fs.mkdirSync(outputDir, { recursive: true });

  // Create directories for each resolution
  ["360p", "480p", "720p"].forEach((res) => {
    fs.mkdirSync(path.join(outputDir, res), { recursive: true });
  });

  log(`Starting HLS transcoding for video: ${inputPath}`);

  // Execute FFmpeg commands
  return new Promise(async (resolve, reject) => {
    try {
      // Transcode to 360p
      log("Starting 360p transcoding");
      await runFFmpeg(inputPath, outputDir, 360);
      log("Completed 360p transcoding");

      // Transcode to 480p
      log("Starting 480p transcoding");
      await runFFmpeg(inputPath, outputDir, 480);
      log("Completed 480p transcoding");

      // Transcode to 720p
      log("Starting 720p transcoding");
      await runFFmpeg(inputPath, outputDir, 720);
      log("Completed 720p transcoding");

      // Create master playlist
      log("Creating master playlist");
      createMasterPlaylist(outputDir);
      log("Master playlist created");

      resolve(outputDir);
    } catch (error: any) {
      log(`Transcoding error: ${error.message}`, "ERROR");
      reject(error);
    }
  });
}

function runFFmpeg(
  inputPath: string,
  outputDir: string,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const resolution = `${height}p`;
    const outputPath = path.join(outputDir, resolution);

    log(`Transcoding to ${resolution}...`);

    const ffmpeg = spawn("ffmpeg", [
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

    let ffmpegLogs = "";
    ffmpeg.stderr.on("data", (data) => {
      const dataStr = data.toString();
      ffmpegLogs += dataStr;
      log(`FFmpeg progress: ${dataStr}`, "DEBUG");
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        log(`FFmpeg ${resolution} completed successfully`);
        resolve();
      } else {
        log(`FFmpeg process exited with code ${code}`, "ERROR");
        log(`FFmpeg logs: ${ffmpegLogs}`, "ERROR");
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}

function createMasterPlaylist(outputDir: string): void {
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

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  });

  return results;
}

async function uploadToS3(
  outputDir: string,
  bucketName: string
): Promise<string> {
  log(`Uploading HLS content to S3 bucket: ${bucketName}...`);

  if (!bucketName) {
    const error = new Error("Bucket name is empty or undefined");
    log(`S3 upload error: ${error.message}`, "ERROR");
    throw error;
  }

  const allFiles = getAllFiles(outputDir);
  log(`Found ${allFiles.length} files to upload`);

  // const baseUrl = `https://${bucketName}.s3.amazonaws.com/${videoId}/`;

  for (const filePath of allFiles) {
    const key = `${videoId}/${path.relative(outputDir, filePath)}`; // Add videoId prefix

    try {
      log(`Uploading file: ${key}`);

      // Use direct upload instead of presigned URLs
      await s3Service.uploadFile(filePath, key, bucketName);

      log(`Successfully uploaded: ${key}`);
    } catch (error: any) {
      log(`Failed to upload ${key}: ${error.message}`, "ERROR");

      if (error.response) {
        log(`Response status: ${error.response.status}`, "ERROR");
        log(`Response data: ${JSON.stringify(error.response.data)}`, "ERROR");
      }

      // Continue with other files despite error
    }
  }

  const playbackUrl = `${CLOUDFRONT_URL}/${videoId}/master.m3u8`;
  log(`All uploads attempted. Playback URL: ${playbackUrl}`);
  return playbackUrl;
}

async function postUrl(backendUrl: string, videoId: string, videoLink: string) {
  await axios.post(backendUrl, {
    videoId,
    videoLink,
  });
}

async function cleanup(): Promise<void> {
  const tempDir = path.join(__dirname, "../temp");
  log(`Cleaning up temporary files in ${tempDir}`);
  fs.rmSync(tempDir, { recursive: true, force: true });
  log("Cleanup completed");

  // Close the log stream
  logStream.end();
}

async function main() {
  log(`Starting video processing with ID: ${videoId}`);
  logEnvironment();

  try {
    if (!videoUrl) {
      throw new Error("VIDEO_URL environment variable is required");
    }

    if (!outputBucket) {
      throw new Error("OUTPUT_BUCKET environment variable is required");
    }

    // Download the video
    const inputPath = await downloadVideo(videoUrl);

    // Transcode to HLS
    const outputDir = await transcodeToHLS(inputPath as string);

    // Upload to S3
    const playbackUrl = await uploadToS3(outputDir, outputBucket);

    log(`Processing complete! Playback URL: ${playbackUrl}`);

    await postUrl(backendEndpoint, videoId, playbackUrl);

    log(`Updated the URL in database successfully`);
    // Clean up
    await cleanup();

    process.exit(0);
  } catch (error: any) {
    log(`Fatal error processing video: ${error.message}`, "ERROR");
    log(`Stack trace: ${error.stack}`, "ERROR");

    await cleanup().catch((err) => {
      log(`Error during cleanup: ${err.message}`, "ERROR");
    });

    process.exit(1);
  }
}

main();
