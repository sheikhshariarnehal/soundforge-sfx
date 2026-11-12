import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL || "https://3b094150126bc4bd2b1b284027dc018b.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "ddfd9ecbf28b0a4edb7f4d9c243bbe49",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "e73469e05d0fd97c53af29ac60b488d8c620caed05fa056f245b954e10349f36",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "sounds-storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string; filename: string }> }
) {
  const { category, filename } = await params;
  const decodedCategory = decodeURIComponent(category).toLowerCase();
  const decodedFilename = decodeURIComponent(filename);

  const r2Key = `sounds/${decodedCategory}/${decodedFilename}`;

  // 1. Try streaming from Cloudflare R2
  try {
    const rangeHeader = req.headers.get("range");
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Range: rangeHeader || undefined,
    });

    const s3Response = await s3Client.send(command);

    if (s3Response.Body) {
      const stream = s3Response.Body as unknown as ReadableStream;
      const headers = new Headers();
      headers.set("Content-Type", "audio/mpeg");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Accept-Ranges", "bytes");

      if (s3Response.ContentRange) {
        headers.set("Content-Range", s3Response.ContentRange);
      }
      if (s3Response.ContentLength) {
        headers.set("Content-Length", s3Response.ContentLength.toString());
      }

      return new NextResponse(stream, {
        status: rangeHeader ? 206 : 200,
        headers,
      });
    }
  } catch (r2Error) {
    console.warn(`[API Audio] R2 stream failed for ${r2Key}, checking local fallback...`, r2Error);
  }

  // 2. Fallback to local audio file if running locally
  try {
    const localPath = path.resolve(process.cwd(), "..", "categories", decodedCategory, decodedFilename);
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      const fileStream = fs.createReadStream(localPath);
      // Convert node stream to web stream
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": stats.size.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (localError) {
    console.error("[API Audio] Local fallback also failed:", localError);
  }

  return new NextResponse("Audio file not found", { status: 404 });
}
