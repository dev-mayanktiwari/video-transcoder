import { AppConfig } from "../config";
import { s3Service } from "./AWSS3Utils";
import { sqsService } from "./AWSSQSUtils";
// import { spawn } from "child_process";
import { runContainer } from "./runECSContainer";

async function processMessage(body: string | undefined) {
  if (!body) {
    console.log("No body received");
  }
  try {
    const event = JSON.parse(body!);
    const key = event.Records?.[0]?.s3?.object?.key;
    const videoName = key.split("/")[1];
    const videoId = videoName.split(".")[0];
    console.log(videoId);
    if (key) {
      console.log("Object key found", key);
      const downloadUrl = await s3Service.getDownloadUrl(
        key,
        String(AppConfig.get("BUCKET_NAME_NORMAL_UPLOAD"))
      );
      // console.log("Download URL:", downloadUrl);
      //   const docker = spawn("docker", [
      //     "run",
      //     "--rm",
      //     "-e",
      //     `VIDEO_URL=${downloadUrl}`,
      //     "-e",
      //     `VIDEO_ID=${videoId}`,
      //     "-e",
      //     `OUTPUT_BUCKET=${AppConfig.get("BUCKET_NAME_HLS_UPLOAD")}`,
      //     "-e",
      //     `AWS_ACCESS_KEY_ID=${AppConfig.get("AMAZON_ACCESS_KEY")}`,
      //     "-e",
      //     `BUCKET_REGION=${AppConfig.get("BUCKET_REGION")}`,
      //     "-e",
      //     `CLOUDFRONT_URL=${AppConfig.get("CLOUDFRONT_URL")}`,
      //     "-e",
      //     `AWS_SECRET_ACCESS_KEY=${AppConfig.get("AMAZON_SECRET_ACCESS_KEY")}`,
      //     "video-transcoder",
      //   ]);

      //   docker.stdout.on("data", (data: any) => {
      //     console.log(`Container output: ${data}`);
      //   });
      await runContainer(downloadUrl, videoId);
    } else {
      console.log("No key found");
    }
  } catch (error) {
    console.error("Error parsing message body:", error);
  }
}

async function pollQueue() {
  console.log("Starting queue polling.....");
  while (true) {
    try {
      const messages = await sqsService.receiveMessage();

      if (messages.length === 0) {
        console.log("No messages received. Waiting....");
      }

      for (const message of messages) {
        try {
          console.log("Processing message:", message.Body);
          await processMessage(message.Body);
          if (message.ReceiptHandle) {
            sqsService.deleteMessage(message.ReceiptHandle);
          }
        } catch (error) {
          console.error("Encountered error while processing message", error);
        }
      }
    } catch (error) {
      console.error("Error receiving messages:", error);
    }
  }
}

export default pollQueue;
