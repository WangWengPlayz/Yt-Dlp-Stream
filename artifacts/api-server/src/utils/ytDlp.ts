import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

const PYTHONLIBS_BIN = "/home/runner/workspace/.pythonlibs/bin";
const YTDLP_BIN = path.join(PYTHONLIBS_BIN, "yt-dlp");

const YTDLP_ENV = {
  ...process.env,
  PATH: [PYTHONLIBS_BIN, process.env["PATH"] ?? ""].filter(Boolean).join(":"),
  PYTHONPATH: [
    "/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages",
    process.env["PYTHONPATH"] ?? "",
  ]
    .filter(Boolean)
    .join(":"),
};

function isUrl(query: string): boolean {
  return (
    /^https?:\/\//i.test(query) ||
    /^(www\.)?youtu(\.be|be\.com)/i.test(query)
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(raw: string | null | undefined): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export interface VideoMetadata {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  channel: string;
  views: number;
  upload_date: string | null;
  webpage_url: string;
}

export async function getMetadata(query: string): Promise<VideoMetadata> {
  const target = isUrl(query) ? query : `ytsearch1:${query}`;

  const { stdout } = await execFileAsync(
    YTDLP_BIN,
    ["--dump-json", "--skip-download", "--no-playlist", target],
    { timeout: 30_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
  );

  const raw = stdout.trim().split("\n")[0]!;
  const data = JSON.parse(raw) as Record<string, unknown>;

  const id = String(data["id"] ?? "");
  return {
    id,
    title: String(data["title"] ?? "Unknown"),
    duration: formatDuration(Number(data["duration"] ?? 0)),
    thumbnail:
      String(data["thumbnail"] ?? "") ||
      `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    channel: String(data["uploader"] ?? data["channel"] ?? "Unknown"),
    views: Number(data["view_count"] ?? 0),
    upload_date: formatDate(data["upload_date"] as string | null),
    webpage_url:
      String(data["webpage_url"] ?? "") ||
      `https://www.youtube.com/watch?v=${id}`,
  };
}

export async function downloadMp4(
  videoUrl: string,
  outputPath: string,
): Promise<void> {
  await execFileAsync(
    YTDLP_BIN,
    [
      "-f",
      "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best",
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "-o",
      outputPath,
      videoUrl,
    ],
    { timeout: 300_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
  );
}

export async function downloadMp3(
  videoUrl: string,
  outputPath: string,
): Promise<void> {
  await execFileAsync(
    YTDLP_BIN,
    [
      "-f",
      "bestaudio",
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "192K",
      "--no-playlist",
      "-o",
      outputPath,
      videoUrl,
    ],
    { timeout: 300_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
  );
}
