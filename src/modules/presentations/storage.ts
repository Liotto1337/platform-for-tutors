import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET ?? "history-pdfs";
const client = new S3Client({
  region: process.env.S3_REGION ?? "ru-central1",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_PATH_STYLE === "true",
  maxAttempts: 2,
});

export const pdfMax = 20 * 1024 * 1024;

export function isPdf(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return buffer.length <= pdfMax && /^%PDF-\d\.\d/.test(buffer.subarray(0, 10).toString("ascii"))
    && /%%EOF\s*$/.test(buffer.subarray(-1024).toString("latin1"));
}

export async function savePdf(key: string, bytes: Uint8Array) {
  if (!isPdf(bytes)) throw new Error("Invalid PDF");
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: bytes, ContentType: "application/pdf",
  }), { abortSignal: AbortSignal.timeout(20_000) });
}

export async function openPdf(key: string) {
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }),
    { abortSignal: AbortSignal.timeout(20_000) });
}
