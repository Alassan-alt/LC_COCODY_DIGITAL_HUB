import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver, StoredFileRef, UploadedFileInput } from "./storage.types";

const UPLOAD_ROOT = path.resolve(process.cwd(), ".local", "uploads");

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

function assertSafeKey(key: string): void {
  if (key.includes("..") || key.includes("/") || key.includes("\\")) {
    throw new Error("Clé de stockage invalide");
  }
}

export class LocalDiskStorage implements StorageDriver {
  async upload(input: UploadedFileInput): Promise<StoredFileRef> {
    await mkdir(UPLOAD_ROOT, { recursive: true });
    const key = `${randomUUID()}-${sanitizeFileName(input.originalName)}`;
    await writeFile(path.join(UPLOAD_ROOT, key), input.buffer);
    return { key, size: input.buffer.length, mimeType: input.mimeType };
  }

  async read(key: string): Promise<Buffer> {
    assertSafeKey(key);
    return readFile(path.join(UPLOAD_ROOT, key));
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await rm(path.join(UPLOAD_ROOT, key), { force: true });
  }
}
