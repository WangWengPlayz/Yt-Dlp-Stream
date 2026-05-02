import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.get("/doc", (_req: Request, res: Response) => {
  res.json({
    name: "YouTube Downloader API",
    version: "1.0.0",
    description:
      "A production-ready REST API for extracting metadata and downloadable media links from YouTube videos. Supports both full YouTube URLs and plain-text search queries. Returns MP4 (video) and MP3 (audio) links in two modes each: direct download and browser preview.",
    author: "YouTube Downloader API",
    base_path: "/api",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/q",
        description: "Fetch metadata and generate download/preview links for a YouTube video.",
        parameters: [
          { name: "q", type: "string", required: true, description: "YouTube URL or plain-text search query (max 500 chars)" },
        ],
        response: {
          status: true,
          query: "input value",
          title: "Video Title",
          thumbnail: "https://img.youtube.com/vi/.../maxresdefault.jpg",
          duration: "HH:MM:SS",
          channel: "Channel Name",
          views: 1234567,
          upload_date: "YYYY-MM-DD",
          downloads: {
            mp4: {
              download: "https://<domain>/api/download/<uuid>.mp4",
              preview: "https://<domain>/api/preview/<uuid>.mp4",
            },
            mp3: {
              download: "https://<domain>/api/download/<uuid>.mp3",
              preview: "https://<domain>/api/preview/<uuid>.mp3",
            },
          },
        },
      },
      {
        method: "GET",
        path: "/api/download/:filename",
        description: "Download a previously generated file. Sets Content-Disposition: attachment — browser will save the file immediately.",
      },
      {
        method: "GET",
        path: "/api/preview/:filename",
        description: "Open a previously generated file in the browser. Sets Content-Disposition: inline — video/audio plays directly in the browser.",
      },
      {
        method: "GET",
        path: "/api/docs",
        description: "Full HTML documentation page.",
      },
      {
        method: "GET",
        path: "/api/doc",
        description: "This endpoint — machine-readable API info and copyright disclaimer.",
      },
      {
        method: "GET",
        path: "/api/healthz",
        description: "Health check — returns { status: 'ok' }.",
      },
    ],
    rate_limiting: {
      route: "/api/v1/q",
      limit: 10,
      window: "15 minutes",
      per: "IP address",
    },
    file_management: {
      storage: "/tmp/yt-downloads",
      naming: "UUID-based (e.g. 550e8400-e29b-41d4-a716-446655440000.mp4)",
      ttl: "15 minutes — files are automatically deleted after expiry",
    },
    tech_stack: {
      runtime: "Node.js 24 + Express 5",
      downloader: "yt-dlp",
      media_processing: "ffmpeg",
      audio_codec: "libmp3lame @ 192kbps",
      video_format: "MP4 (best video + best audio, merged via ffmpeg)",
    },
    copyright_disclaimer:
      "This API is provided for personal and educational use only. " +
      "Downloading copyrighted content from YouTube may violate YouTube's Terms of Service " +
      "(https://www.youtube.com/t/terms) and applicable copyright laws. " +
      "The operators of this API do not host, store permanently, or redistribute any copyrighted media — " +
      "all files are held temporarily in memory for a maximum of 15 minutes and are then permanently deleted. " +
      "Users are solely responsible for ensuring their use of this service complies with all applicable laws " +
      "and the terms of service of the platforms involved. " +
      "This service is not affiliated with, endorsed by, or sponsored by YouTube or Google LLC.",
    legal_notice:
      "YouTube\u00ae is a registered trademark of Google LLC. " +
      "Use of this API to download content you do not own the rights to may be illegal in your jurisdiction. " +
      "By using this API you agree that you are solely responsible for any legal consequences arising from your use.",
  });
});

export default router;
