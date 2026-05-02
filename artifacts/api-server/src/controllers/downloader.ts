import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getMetadata, downloadMp4, downloadMp3 } from "../utils/ytDlp.js";
import { logger } from "../lib/logger.js";

const DOWNLOAD_DIR = "/tmp/yt-downloads";
const FILE_TTL_MS = 15 * 60 * 1000;

async function ensureDownloadDir(): Promise<void> {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
}

function buildBaseUrl(req: {
  protocol: string;
  get: (h: string) => string | undefined;
}): string {
  const host = req.get("x-forwarded-host") ?? req.get("host") ?? "localhost";
  const proto =
    req.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? req.protocol;
  return `${proto}://${host}`;
}

export async function scheduleCleanup(
  mp4Path: string,
  mp3Path: string,
): Promise<void> {
  setTimeout(async () => {
    for (const p of [mp4Path, mp3Path]) {
      try {
        await fs.unlink(p);
        logger.info({ path: p }, "Cleaned up temp file");
      } catch {
      }
    }
  }, FILE_TTL_MS);
}

export interface DownloadResult {
  status: true;
  query: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: number;
  upload_date: string | null;
  downloads: { mp4: string; mp3: string };
}

export async function processQuery(
  query: string,
  req: { protocol: string; get: (h: string) => string | undefined },
): Promise<DownloadResult> {
  await ensureDownloadDir();

  logger.info({ query }, "Processing download query");

  const meta = await getMetadata(query);
  logger.info({ title: meta.title, id: meta.id }, "Metadata fetched");

  const id = uuidv4();
  const mp4Path = path.join(DOWNLOAD_DIR, `${id}.mp4`);
  const mp3Path = path.join(DOWNLOAD_DIR, `${id}.mp3`);

  await Promise.all([
    downloadMp4(meta.webpage_url, mp4Path),
    downloadMp3(meta.webpage_url, mp3Path),
  ]);

  logger.info({ id }, "Downloads complete");

  scheduleCleanup(mp4Path, mp3Path).catch(() => {});

  const base = buildBaseUrl(req);

  return {
    status: true,
    query,
    title: meta.title,
    thumbnail: meta.thumbnail,
    duration: meta.duration,
    channel: meta.channel,
    views: meta.views,
    upload_date: meta.upload_date,
    downloads: {
      mp4: `${base}/api/download/${id}.mp4`,
      mp3: `${base}/api/download/${id}.mp3`,
    },
  };
}

export function getDownloadDir(): string {
  return DOWNLOAD_DIR;
}
