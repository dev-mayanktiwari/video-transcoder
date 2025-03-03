import {
  ECSClient,
  RunTaskCommand,
  RunTaskCommandInput,
} from "@aws-sdk/client-ecs";
import { AppConfig } from "../config";

export async function runContainer(downloadUrl: string, videoID: string) {
  try {
    console.log("🔍 Checking AWS credentials...");
    console.log(
      "Access Key:",
      AppConfig.get("AMAZON_ACCESS_KEY") ? "Exists ✅" : "Missing ❌"
    );
    console.log(
      "Secret Key:",
      AppConfig.get("AMAZON_SECRET_ACCESS_KEY") ? "Exists ✅" : "Missing ❌"
    );

    console.log("🔍 Checking ECS config...");
    console.log("Cluster Name:", AppConfig.get("ECS_CLUSTER_NAME"));
    console.log("Task Definition:", AppConfig.get("ECS_TASK_DEFINITON"));

    const ecsClient = new ECSClient({
      region: String(AppConfig.get("BUCKET_REGION")),
      credentials: {
        accessKeyId: String(AppConfig.get("AMAZON_ACCESS_KEY")),
        secretAccessKey: String(AppConfig.get("AMAZON_SECRET_ACCESS_KEY")),
      },
    });

    const params: RunTaskCommandInput = {
      cluster: String(AppConfig.get("ECS_CLUSTER_NAME")),
      taskDefinition: String(AppConfig.get("ECS_TASK_DEFINITON")),
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            String(AppConfig.get("SUBNET_ID_1")),
            String(AppConfig.get("SUBNET_ID_2")),
          ],
          securityGroups: [String(AppConfig.get("SECURITY_GROUP_ID"))],
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "video-processor-container", // Verify this matches your task definition
            environment: [
              { name: "VIDEO_URL", value: downloadUrl },
              { name: "VIDEO_ID", value: videoID },
              {
                name: "OUTPUT_BUCKET",
                value: String(AppConfig.get("BUCKET_NAME_HLS_UPLOAD")),
              },
              {
                name: "CLOUDFRONT_URL",
                value: String(AppConfig.get("CLOUDFRONT_URL")),
              },
              {
                name: "BUCKET_REGION",
                value: String(AppConfig.get("BUCKET_REGION")),
              },
              {
                name: "AMAZON_ACCESS_KEY",
                value: String(AppConfig.get("AMAZON_ACCESS_KEY")),
              },
              {
                name: "AMAZON_SECRET_ACCESS_KEY",
                value: String(AppConfig.get("AMAZON_SECRET_ACCESS_KEY")),
              },
              {
                name: "BACKEND_ENDPOINT",
                value: String(AppConfig.get("BACKEND_ENDPOINT")),
              },
            ],
          },
        ],
      },
    };

    console.log(
      "🚀 Running ECS Task with params:",
      JSON.stringify(params, null, 2)
    );

    const command = new RunTaskCommand(params);
    const response = await ecsClient.send(command);

    console.log(
      "✅ ECS Task launched successfully:",
      response.tasks?.[0]?.taskArn
    );
  } catch (error: any) {
    console.error("❌ Error launching ECS task:", error);

    if (error.name === "InvalidParameterException") {
      console.error(
        "⚠️ Possible issue: Task definition, cluster, or container name mismatch."
      );
    }
    if (error.name === "AccessDeniedException") {
      console.error(
        "⚠️ Possible issue: IAM role lacks 'ecs:RunTask' or 'iam:PassRole' permissions."
      );
    }
    if (error.name === "NetworkingError") {
      console.error(
        "⚠️ Possible issue: AWS region mismatch or invalid credentials."
      );
    }
  }
}
