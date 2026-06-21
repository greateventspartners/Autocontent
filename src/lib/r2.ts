import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

const BUCKET = process.env.S3_BUCKET || "autocontent";

function createR2Client() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    requestHandler: new FetchHttpHandler(),
    forcePathStyle: true,
  });
}

export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  workspaceId: string
): Promise<StoredFile> {
  const client = createR2Client();
  const key = `${workspaceId}/${Date.now()}-${fileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const url = `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;

  return { key, url, size: buffer.length, mimeType };
}

export async function getFile(key: string): Promise<Buffer | null> {
  const client = createR2Client();
  const response = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );

  if (!response.Body) return null;
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(key: string): Promise<void> {
  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

export async function listFiles(prefix: string): Promise<string[]> {
  const client = createR2Client();
  const response = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return (response.Contents ?? []).map((o) => o.Key!).filter(Boolean);
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = createR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}
