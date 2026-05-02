import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { promises as fs } from "fs";

const execFileAsync = promisify(execFile);

// ── Binary resolution ──────────────────────────────────────────────────────
// We search common pip install locations so the same code works on Replit,
// Render, Railway, Fly.io, plain Ubuntu VMs, and local machines without
// any environment-specific hardcoding.
const EXTRA_BIN_DIRS = [
  // Replit pip location
  "/home/runner/workspace/.pythonlibs/bin",
  // Linux user-level pip install (most common on Render / Railway)
  `${process.env["HOME"] ?? "/root"}/.local/bin`,
  // System-level pip install
  "/usr/local/bin",
  "/usr/bin",
];

const EXTRA_PYTHON_PATHS = [
  "/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages",
];

// Build an augmented PATH that the child processes will inherit.
// If yt-dlp / ffmpeg already live in the system PATH they will be found
// there; the extra dirs are prepended so Replit's local install wins on
// Replit and the system install wins everywhere else.
const AUGMENTED_PATH = [
  ...EXTRA_BIN_DIRS,
  process.env["PATH"] ?? "",
].filter(Boolean).join(":");

const YTDLP_ENV = {
  ...process.env,
  PATH: AUGMENTED_PATH,
  PYTHONPATH: [
    ...EXTRA_PYTHON_PATHS,
    process.env["PYTHONPATH"] ?? "",
  ]
    .filter(Boolean)
    .join(":"),
};

// Use the bare command name — the augmented PATH above will locate the right
// binary whether it was installed by pip, apt, brew, or any other method.
const YTDLP_BIN = "yt-dlp";
const FFMPEG_BIN = "ffmpeg";

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

/**
 * Download MP4 and ensure it is:
 *   - Properly merged (H.264 video + AAC audio preferred to avoid VFR issues)
 *   - faststart-flagged so browsers can play before the entire file loads
 *   - Timestamp-corrected to eliminate A/V sync drift
 *
 * Strategy: two-pass
 *   1. yt-dlp downloads and merges to a temp file
 *   2. ffmpeg remuxes with moov relocation + timestamp fixes → final output
 */
export async function downloadMp4(
  videoUrl: string,
  outputPath: string,
): Promise<void> {
  const tmpPath = outputPath.replace(/\.mp4$/, ".tmp.mp4");

  try {
    // Pass 1 — download & merge
    // Prefer avc1 (H.264) + m4a (AAC) to avoid Variable Frame Rate issues.
    // Fall back progressively to ensure something always downloads.
    await execFileAsync(
      YTDLP_BIN,
      [
        "-f",
        [
          "bestvideo[vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]",
          "bestvideo[vcodec^=avc1]+bestaudio[ext=m4a]",
          "bestvideo[ext=mp4]+bestaudio[ext=m4a]",
          "bestvideo+bestaudio",
          "best[ext=mp4]",
          "best",
        ].join("/"),
        "--merge-output-format",
        "mp4",
        "--no-playlist",
        // Retry on fragment errors
        "--fragment-retries",
        "10",
        "--retries",
        "5",
        // Parallel fragment downloads for speed
        "-N",
        "4",
        "-o",
        tmpPath,
        videoUrl,
      ],
      { timeout: 600_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
    );

    // Pass 2 — remux with ffmpeg for sync + browser compatibility
    //   -c:v copy          stream-copy video (no re-encode, fast)
    //   -c:a copy          stream-copy audio
    //   -avoid_negative_ts make_zero  fix any negative timestamps from merge
    //   -fflags +genpts    regenerate PTS to eliminate drift
    //   -movflags +faststart  move moov atom to file start for progressive playback
    await execFileAsync(
      FFMPEG_BIN,
      [
        "-y",
        "-i",
        tmpPath,
        "-c:v",
        "copy",
        "-c:a",
        "copy",
        "-avoid_negative_ts",
        "make_zero",
        "-fflags",
        "+genpts",
        "-movflags",
        "+faststart",
        "-map_metadata",
        "0",
        outputPath,
      ],
      { timeout: 300_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
    );
  } finally {
    // Remove temp file regardless of success/failure
    await fs.unlink(tmpPath).catch(() => {});
  }
}

/**
 * Download MP3 and ensure it is:
 *   - Sourced from M4A/AAC where possible (avoids Opus → MP3 conversion artifacts)
 *   - Encoded at 192 kbps stereo 44.1 kHz with libmp3lame for consistent output
 *   - Free from cutouts caused by incomplete stream conversion
 *
 * Strategy: two-pass
 *   1. yt-dlp downloads the best audio to a temp file (no in-yt-dlp conversion)
 *   2. ffmpeg encodes to MP3 with explicit, safe parameters
 */
export async function downloadMp3(
  videoUrl: string,
  outputPath: string,
): Promise<void> {
  // Use a .audio extension so yt-dlp doesn't try to rename it
  const tmpPath = outputPath.replace(/\.mp3$/, ".tmp.audio");

  try {
    // Pass 1 — download best audio as-is (prefer M4A to avoid Opus conversion path)
    await execFileAsync(
      YTDLP_BIN,
      [
        "-f",
        "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
        "--no-playlist",
        "--fragment-retries",
        "10",
        "--retries",
        "5",
        "-N",
        "4",
        "-o",
        tmpPath,
        videoUrl,
      ],
      { timeout: 300_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
    );

    // Pass 2 — encode to MP3 with libmp3lame
    //   -vn              discard any video stream
    //   -c:a libmp3lame  use the LAME encoder (produces clean, compatible MP3)
    //   -b:a 192k        constant bitrate 192 kbps
    //   -ar 44100        standard sample rate (avoids rate-conversion artefacts)
    //   -ac 2            stereo output
    //   -write_xing 1    write Xing/Info header so players know total duration
    await execFileAsync(
      FFMPEG_BIN,
      [
        "-y",
        "-i",
        tmpPath,
        "-vn",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-write_xing",
        "1",
        outputPath,
      ],
      { timeout: 300_000, env: YTDLP_ENV, maxBuffer: 10 * 1024 * 1024 },
    );
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
}
