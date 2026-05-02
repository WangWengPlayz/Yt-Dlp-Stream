import app from "./app";
import { logger } from "./lib/logger";
import { resolveCookiesFile } from "./lib/cookies";

// Resolve YouTube cookies before the server starts accepting requests.
// Reads YTDLP_COOKIES_B64 or YTDLP_COOKIES_FILE and sets YTDLP_COOKIES_FILE
// in process.env so every yt-dlp call picks it up automatically.
resolveCookiesFile();

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
