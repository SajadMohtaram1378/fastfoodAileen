import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

export const s3 = new AWS.S3({
  endpoint: process.env.ARVAN_ENDPOINT!,
  accessKeyId: process.env.ARVAN_ACCESS_KEY!,
  secretAccessKey: process.env.ARVAN_SECRET_KEY!,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});
