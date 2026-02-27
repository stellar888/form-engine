import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const ROOT_IMAGES_DIR = path.join(process.cwd(), "images");

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  return "application/octet-stream";
}

export async function GET(_: Request, context: { params: { path: string[] } }) {
  const pathSegments = context.params.path || [];

  const requestedPath = path.join(ROOT_IMAGES_DIR, ...pathSegments);
  const resolvedPath = path.resolve(requestedPath);

  if (!resolvedPath.startsWith(path.resolve(ROOT_IMAGES_DIR))) {
    return NextResponse.json({ error: "Invalid image path." }, { status: 400 });
  }

  if (!existsSync(resolvedPath)) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const [fileStats, fileBuffer] = await Promise.all([stat(resolvedPath), readFile(resolvedPath)]);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentTypeFor(resolvedPath),
      "Content-Length": String(fileStats.size),
      "Cache-Control": "public, max-age=86400"
    }
  });
}
