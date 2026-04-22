import { createHash } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

const UPLOADS_ROOT = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), "uploads");

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function computeHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function sanitizeFilename(original: string): string {
  return original
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}

export async function saveFile(params: {
  condominioId: string;
  competencia: string;
  filename: string;
  buffer: Buffer;
}): Promise<{ relativePath: string; hash: string }> {
  const dir = path.join(UPLOADS_ROOT, params.condominioId, params.competencia);
  await mkdir(dir, { recursive: true });

  const hash = computeHash(params.buffer);
  const ext = path.extname(params.filename) || ".bin";
  const storedName = `${Date.now()}_${hash.slice(0, 8)}${ext}`;
  const fullPath = path.join(dir, storedName);

  await writeFile(fullPath, params.buffer);

  const relativePath = [params.condominioId, params.competencia, storedName].join("/");
  return { relativePath, hash };
}

function resolveStoragePath(relativePath: string): string {
  const normalized = relativePath.split(/[/\\]/).join(path.sep);
  return path.join(UPLOADS_ROOT, normalized);
}

export async function readFileFromStorage(relativePath: string): Promise<Buffer> {
  return readFile(resolveStoragePath(relativePath));
}

export async function deleteFileFromStorage(relativePath: string): Promise<void> {
  await unlink(resolveStoragePath(relativePath)).catch(() => {
    // Arquivo já inexistente — não é erro crítico
  });
}
