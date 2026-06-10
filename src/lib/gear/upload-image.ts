import { del, put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "gear");
const MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const ALLOWED = new Set(Object.keys(MIME_EXT));

function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function isBlobUrl(imageUrl: string): boolean {
  return (
    imageUrl.startsWith("https://") &&
    imageUrl.includes(".blob.vercel-storage.com")
  );
}

export async function saveGearImage(
  userId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("图片不能超过 5MB");
  }

  const ext = MIME_EXT[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (useBlobStorage()) {
    const blob = await put(`gear/${userId}/${filename}`, buffer, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  const dir = path.join(UPLOAD_ROOT, userId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/gear/${userId}/${filename}`;
}

export async function deleteGearImageFile(
  imageUrl: string | null | undefined,
): Promise<void> {
  if (!imageUrl) return;

  if (isBlobUrl(imageUrl)) {
    try {
      await del(imageUrl);
    } catch {
      /* 文件可能已不存在 */
    }
    return;
  }

  if (!imageUrl.startsWith("/uploads/gear/")) return;
  if (imageUrl.includes("..")) return;

  const fullPath = path.join(process.cwd(), "public", imageUrl);
  const resolved = path.resolve(fullPath);
  const root = path.resolve(UPLOAD_ROOT);
  if (!resolved.startsWith(root)) return;

  try {
    await unlink(resolved);
  } catch {
    /* 文件可能已不存在 */
  }
}
