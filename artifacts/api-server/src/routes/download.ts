import { Router, type IRouter, type Request, type Response } from "express";
import path from "path";
import { promises as fs } from "fs";
import { createReadStream } from "fs";
import { getDownloadDir, readSidecar } from "../controllers/downloader.js";
import { sanitizeFilename, encodeRFC5987 } from "../utils/filename.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const ALLOWED_FILENAME =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(mp4|mp3)$/i;

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

/**
 * Build a Content-Disposition header value with both an ASCII fallback
 * (filename=) and a full UTF-8 encoded name (filename*=) so all browsers
 * show the correct, readable title.
 *
 * Example output:
 *   attachment; filename="Abracadabra - Lady Gaga.mp3"; filename*=UTF-8''Abracadabra%20-%20Lady%20Gaga.mp3
 */
function buildContentDisposition(
  disposition: "attachment" | "inline",
  stem: string,
  ext: string,
): string {
  const friendlyName = `${stem}.${ext}`;
  // ASCII fallback: strip non-ASCII characters
  const asciiFallback = friendlyName.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeRFC5987(friendlyName);
  return `${disposition}; filename="${asciiFallback}"; filename*=${encoded}`;
}

async function serveFile(
  req: Request,
  res: Response,
  disposition: "attachment" | "inline",
): Promise<void> {
  const { filename } = req.params as { filename: string };

  const match = ALLOWED_FILENAME.exec(filename);
  if (!match) {
    res.status(400).json({ status: false, error: "Invalid filename" });
    return;
  }

  const id = match[1]!;
  const ext = match[2]!.toLowerCase();
  const downloadDir = getDownloadDir();
  const filePath = path.join(downloadDir, filename);

  // Path traversal guard
  const resolved = path.resolve(filePath);
  const dir = path.resolve(downloadDir);
  if (!resolved.startsWith(dir + path.sep)) {
    res.status(403).json({ status: false, error: "Forbidden" });
    return;
  }

  try {
    await fs.access(filePath);
  } catch {
    res
      .status(404)
      .json({ status: false, error: "File not found or expired" });
    return;
  }

  // Look up the human-readable title from the sidecar JSON.
  // Fall back gracefully if the sidecar is missing for any reason.
  const sidecar = await readSidecar(id);
  const stem = sidecar?.sanitized
    ? sidecar.sanitized
    : sanitizeFilename(id); // last-resort fallback

  const stat = await fs.stat(filePath);
  const mime = MIME[ext] ?? "application/octet-stream";

  res.setHeader("Content-Type", mime);
  res.setHeader(
    "Content-Disposition",
    buildContentDisposition(disposition, stem, ext),
  );
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Accept-Ranges", "bytes");

  logger.info({ id, stem, ext, disposition }, "Serving file");

  const stream = createReadStream(filePath);
  stream.pipe(res as unknown as NodeJS.WritableStream);
}

router.get("/download/:filename", async (req: Request, res: Response) => {
  await serveFile(req, res, "attachment");
});

router.get("/preview/:filename", async (req: Request, res: Response) => {
  await serveFile(req, res, "inline");
});

export default router;
