import { Router, type IRouter, type Request, type Response } from "express";
import path from "path";
import { promises as fs } from "fs";
import { createReadStream } from "fs";
import { getDownloadDir } from "../controllers/downloader.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const ALLOWED_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|mp3)$/i;

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

async function serveFile(
  req: Request,
  res: Response,
  disposition: "attachment" | "inline",
): Promise<void> {
  const { filename } = req.params as { filename: string };

  if (!filename || !ALLOWED_FILENAME.test(filename)) {
    res.status(400).json({ status: false, error: "Invalid filename" });
    return;
  }

  const ext = path.extname(filename).slice(1).toLowerCase();
  const downloadDir = getDownloadDir();
  const filePath = path.join(downloadDir, filename);

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

  const stat = await fs.stat(filePath);
  const mime = MIME[ext] ?? "application/octet-stream";

  res.setHeader("Content-Type", mime);
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${filename}"`,
  );
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Accept-Ranges", "bytes");

  logger.info({ filename, disposition }, "Serving file");

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
