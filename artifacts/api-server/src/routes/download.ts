import { Router, type IRouter, type Request, type Response } from "express";
import path from "path";
import { promises as fs } from "fs";
import { getDownloadDir } from "../controllers/downloader.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const ALLOWED_FILENAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|mp3)$/i;

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

router.get("/download/:filename", async (req: Request, res: Response) => {
  const { filename } = req.params;

  if (!filename || !ALLOWED_FILENAME.test(filename)) {
    res.status(400).json({ status: false, error: "Invalid filename" });
    return;
  }

  const ext = path.extname(filename).slice(1).toLowerCase();
  const filePath = path.join(getDownloadDir(), filename);

  const resolved = path.resolve(filePath);
  const dir = path.resolve(getDownloadDir());
  if (!resolved.startsWith(dir + path.sep)) {
    res.status(403).json({ status: false, error: "Forbidden" });
    return;
  }

  try {
    await fs.access(filePath);
  } catch {
    res.status(404).json({ status: false, error: "File not found or expired" });
    return;
  }

  const stat = await fs.stat(filePath);

  res.setHeader("Content-Type", MIME[ext] ?? "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Cache-Control", "no-cache");

  logger.info({ filename }, "Serving download");

  const { createReadStream } = await import("fs");
  const stream = createReadStream(filePath);
  stream.pipe(res as unknown as NodeJS.WritableStream);
});

export default router;
