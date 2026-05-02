import app from "./app";
import { logger } from "./lib/logger";
import { resolveCookiesFile } from "./lib/cookies";
import { prewarmYtDlp } from "./utils/ytDlp";
import { bus } from "./lib/eventBus";

// Resolve cookies first so YTDLP_COOKIES_FILE is set before any yt-dlp call.
resolveCookiesFile();

// Pre-warm yt-dlp in the background — verifies the binary is reachable and
// warms up the process loader so the first real request is faster.
prewarmYtDlp()
  .then(() => {
    bus.push("info", "yt-dlp pre-warm OK");
    logger.info("yt-dlp pre-warm OK");
  })
  .catch((err) => {
    bus.push("warn", "yt-dlp pre-warm failed — check installation");
    logger.warn({ err }, "yt-dlp pre-warm failed");
  });

const rawPort = process.env["PORT"] ?? "10000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
