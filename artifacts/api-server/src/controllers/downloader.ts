import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getMetadata, downloadMp4, downloadMp3 } from "../utils/ytDlp.js";
import { sanitizeFilename } from "../utils/filename.js";
import { logger } from "../lib/logger.js";
import { bus } from "../lib/eventBus.js";

const DOWNLOAD_DIR = "/tmp/yt-downloads";
const FILE_TTL_MS = 15 * 60 * 1000;

async function ensureDownloadDir(): Promise<void> {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
}

function buildBaseUrl(req: {
  protocol: string;
  get: (h: string) => string | undefined;
}): string {
  const forwarded = req.get("x-forwarded-host");
  const forwProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwarded && forwProto) {
    return `${forwProto}://${forwarded}`;
  }

  const replitDomains = process.env["REPLIT_DOMAINS"];
  if (replitDomains) {
    const primary = replitDomains.split(",")[0]!.trim();
    return `https://${primary}`;
  }

  const host = req.get("host") ?? "localhost";
  return `${req.protocol}://${host}`;
}

/** Sidecar JSON written next to each UUID media file so the serve route can
 *  look up the human-readable title without keeping anything in memory. */
export interface SidecarData {
  title: string;
  sanitized: string; // pre-sanitized stem ready for Content-Disposition
}

export async function readSidecar(id: string): Promise<SidecarData | null> {
  const sidecarPath = path.join(DOWNLOAD_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(sidecarPath, "utf8");
    return JSON.parse(raw) as SidecarData;
  } catch {
    return null;
  }
}

async function writeSidecar(id: string, data: SidecarData): Promise<void> {
  const sidecarPath = path.join(DOWNLOAD_DIR, `${id}.json`);
  await fs.writeFile(sidecarPath, JSON.stringify(data), "utf8");
}

export async function scheduleCleanup(
  id: string,
  mp4Path: string,
  mp3Path: string,
): Promise<void> {
  setTimeout(async () => {
    const sidecarPath = path.join(DOWNLOAD_DIR, `${id}.json`);
    for (const p of [mp4Path, mp3Path, sidecarPath]) {
      try {
        await fs.unlink(p);
        logger.info({ path: p }, "Cleaned up temp file");
      } catch {
        // File may already be gone — ignore
      }
    }
  }, FILE_TTL_MS);
}

export interface MediaLinks {
  download: string;
  preview: string;
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
  downloads: {
    mp4: MediaLinks;
    mp3: MediaLinks;
  };
}

export async function processQuery(
  query: string,
  req: { protocol: string; get: (h: string) => string | undefined },
): Promise<DownloadResult> {
  await ensureDownloadDir();

  bus.push("step", "Received query", { q: query });
  logger.info({ query }, "Processing download query");

  bus.push("step", "Fetching metadata from YouTube…");
  const meta = await getMetadata(query);
  logger.info({ title: meta.title, id: meta.id }, "Metadata fetched");
  bus.push("info", "Metadata ready", {
    title: meta.title,
    duration: meta.duration,
    channel: meta.channel,
  });

  const id = uuidv4();
  const mp4Path = path.join(DOWNLOAD_DIR, `${id}.mp4`);
  const mp3Path = path.join(DOWNLOAD_DIR, `${id}.mp3`);

  const sanitized = sanitizeFilename(meta.title);
  const sidecar: SidecarData = { title: meta.title, sanitized };

  await writeSidecar(id, sidecar);

  bus.push("step", "Downloading MP4 + MP3 in parallel…", { id });

  await Promise.all([
    downloadMp4(meta.webpage_url, mp4Path).then(() => {
      bus.push("info", "MP4 download + remux complete", { id });
    }),
    downloadMp3(meta.webpage_url, mp3Path).then(() => {
      bus.push("info", "MP3 encode complete", { id });
    }),
  ]);

  logger.info({ id, sanitized }, "Downloads complete");
  bus.push("done", "All done — links ready", { id, title: meta.title });

  scheduleCleanup(id, mp4Path, mp3Path).catch(() => {});

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
      mp4: {
        download: `${base}/api/download/${id}.mp4`,
        preview: `${base}/api/preview/${id}.mp4`,
      },
      mp3: {
        download: `${base}/api/download/${id}.mp3`,
        preview: `${base}/api/preview/${id}.mp3`,
      },
    },
  };
}

export function getDownloadDir(): string {
  return DOWNLOAD_DIR;
}
