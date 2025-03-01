import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { AppConfig } from "../config";

class SQSService {
  private SQSClient: SQSClient;
  private queueUrl: string;

  constructor(queueUrl: string) {
    this.SQSClient = new SQSClient({
      region: String(AppConfig.get("BUCKET_REGION")) || "ap-south-1",
      credentials: {
        accessKeyId: String(AppConfig.get("AMAZON_ACCESS_KEY")),
        secretAccessKey: String(AppConfig.get("AMAZON_SECRET_ACCESS_KEY")),
      },
    });

    this.queueUrl = queueUrl;
  }

  /**
   * Receive messages from SQS Queue.
   * @param maxMessages - The maximum number of messages to receive (default: 1)
   * @param waitTimeSeconds - Long polling wait time (default: 5)
   * @returns A promise that resolves to the received messages.
   */

  async receiveMessage(maxMessages: number = 1, waitTimeSeconds: number = 5) {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds,
    });

    try {
      const response = await this.SQSClient.send(command);
      return response.Messages || [];
    } catch (error) {
      console.log("Error fetching messages", error);
      throw error;
    }
  }

  /**
   * Delete a message from the SQS queue.
   * @param receiptHandle - The receipt handle of the message to delete.
   * @returns A promise that resolves when the message is deleted.
   */

  async deleteMessage(receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });

    try {
      await this.SQSClient.send(command);
      console.log(`Message deleted: ${receiptHandle}`);
    } catch (error) {
      console.log("Error deleteing messages", error);
      throw error;
    }
  }
}

const queueUrl = String(AppConfig.get("QUEUE_URL"));
export const sqsService = new SQSService(queueUrl);
