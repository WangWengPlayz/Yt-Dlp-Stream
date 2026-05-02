import { writeFileSync, existsSync } from "fs";
import { logger } from "./logger";

const COOKIES_PATH = "/tmp/yt-cookies.txt";

/**
 * Resolves the path to a Netscape-format cookies file that yt-dlp can use.
 *
 * Resolution order:
 *  1. YTDLP_COOKIES_FILE  — caller supplies a ready-made file path
 *  2. YTDLP_COOKIES_B64   — base64-encoded cookies.txt content; decoded and
 *                           written to /tmp/yt-cookies.txt at startup
 *  3. undefined           — no cookies; yt-dlp will run without authentication
 *
 * How to generate YTDLP_COOKIES_B64:
 *   - Install the "Get cookies.txt LOCALLY" browser extension
 *   - Open youtube.com while signed in to a Google account
 *   - Export cookies as cookies.txt (Netscape format)
 *   - On Linux/Mac:  base64 -w 0 cookies.txt   (copy the output)
 *   - On Windows:    certutil -encode cookies.txt enc.txt  (copy line 2+)
 *   - Paste the result as the YTDLP_COOKIES_B64 secret on your host
 */
export function resolveCookiesFile(): string | undefined {
  const explicitPath = process.env["YTDLP_COOKIES_FILE"];
  if (explicitPath) {
    if (existsSync(explicitPath)) {
      logger.info({ path: explicitPath }, "Using cookies file from YTDLP_COOKIES_FILE");
      return explicitPath;
    }
    logger.warn({ path: explicitPath }, "YTDLP_COOKIES_FILE path does not exist; ignoring");
  }

  const b64 = process.env["YTDLP_COOKIES_B64"];
  if (b64) {
    try {
      const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
      writeFileSync(COOKIES_PATH, decoded, { mode: 0o600 });
      // Also expose it via env so ytDlp.ts lazy-reads it at request time
      process.env["YTDLP_COOKIES_FILE"] = COOKIES_PATH;
      logger.info({ path: COOKIES_PATH }, "Decoded YTDLP_COOKIES_B64 and wrote cookies file");
      return COOKIES_PATH;
    } catch (err) {
      logger.error({ err }, "Failed to decode/write YTDLP_COOKIES_B64; requests may hit bot-detection");
    }
  }

  logger.warn(
    "No YouTube cookies configured. Requests from datacenter IPs may be blocked by YouTube. " +
    "Set YTDLP_COOKIES_B64 to fix this — see /api/doc for instructions."
  );
  return undefined;
}
