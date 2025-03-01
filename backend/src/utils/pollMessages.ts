import { AppConfig } from "../config";
import { s3Service } from "./AWSS3Utils";
import { sqsService } from "./AWSSQSUtils";

async function processMessage(body: string | undefined) {
  if (!body) {
    console.log("No body received");
  }
  try {
    const event = JSON.parse(body!);
    const key = event.Records?.[0]?.s3?.object?.key;

    if (key) {
      console.log("Object key found", key);
      const downloadUrl = await s3Service.getDownloadUrl(
        key,
        String(AppConfig.get("BUCKET_NAME_NORMAL_UPLOAD"))
      );
      console.log("Download URL:", downloadUrl);
    } else {
      console.log("No object key found");
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
