import dotenv from "dotenv";
dotenv.config();

type ConfigKeys =
  | "PORT"
  | "DATABASE_URL"
  | "SERVER_URL"
  | "ENV"
  | "BUCKET_REGION"
  | "AMAZON_ACCESS_KEY"
  | "AMAZON_SECRET_ACCESS_KEY"
  | "BUCKET_NAME_NORMAL_UPLOAD"
  | "BUCKET_NAME_HLS_UPLOAD";

const _config: Record<ConfigKeys, string | undefined> = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  SERVER_URL: process.env.SERVER_URL,
  ENV: process.env.ENV,
  BUCKET_REGION: process.env.BUCKET_REGION,
  AMAZON_ACCESS_KEY: process.env.AMAZON_ACCESS_KEY,
  AMAZON_SECRET_ACCESS_KEY: process.env.AMAZON_SECRET_ACCESS_KEY,
  BUCKET_NAME_NORMAL_UPLOAD: process.env.BUCKET_NAME_NORMAL_UPLOAD,
  BUCKET_NAME_HLS_UPLOAD: process.env.BUCKET_NAME_HLS_UPLOAD,
};

export const AppConfig = {
  get(key: ConfigKeys): string | number {
    const value = _config[key];
    if (value === undefined) {
      process.exit(1);
    }

    if (key === "PORT") {
      return Number(value);
    }

    return value;
  },
};
