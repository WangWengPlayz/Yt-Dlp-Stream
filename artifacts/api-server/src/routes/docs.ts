import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.get("/docs", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>YouTube Downloader API – Docs</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f1117; color: #e2e8f0; line-height: 1.6; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
  h1 { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
  .sub { color: #94a3b8; margin-bottom: 40px; font-size: 1rem; }
  h2 { font-size: 1.15rem; font-weight: 600; color: #e2e8f0; margin: 36px 0 12px; border-left: 3px solid #6366f1; padding-left: 12px; }
  p { color: #94a3b8; margin-bottom: 12px; }
  code { background: #1e2432; color: #a5b4fc; padding: 2px 7px; border-radius: 4px; font-size: 0.88em; font-family: monospace; }
  pre { background: #1e2432; border: 1px solid #2d3748; border-radius: 8px; padding: 20px; overflow-x: auto; margin: 12px 0 20px; }
  pre code { background: transparent; color: #e2e8f0; padding: 0; font-size: 0.85em; }
  .badge { display: inline-block; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 2px 9px; border-radius: 4px; margin-right: 8px; vertical-align: middle; }
  .get { background: #059669; }
  .endpoint { background: #161c2d; border: 1px solid #2d3748; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; }
  .endpoint-line { font-family: monospace; font-size: 0.95rem; color: #a5b4fc; }
  .endpoint-desc { color: #94a3b8; font-size: 0.88rem; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 0.88rem; }
  th { text-align: left; padding: 8px 12px; background: #1e2432; color: #94a3b8; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 8px 12px; border-bottom: 1px solid #1e2432; color: #cbd5e1; }
  .chip { display: inline-block; background: #1e2432; color: #94a3b8; border: 1px solid #2d3748; padding: 2px 9px; border-radius: 20px; font-size: 0.78rem; margin-right: 4px; margin-bottom: 6px; }
  .notice { background: #1a1200; border: 1px solid #78350f; border-radius: 8px; padding: 14px 18px; color: #fbbf24; font-size: 0.85rem; margin-top: 8px; }
  .link-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0 20px; }
  .link-card { background: #161c2d; border: 1px solid #2d3748; border-radius: 8px; padding: 14px 16px; }
  .link-card .label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6366f1; margin-bottom: 4px; }
  .link-card .desc { font-size: 0.84rem; color: #94a3b8; }
</style>
</head>
<body>
<div class="wrap">
  <h1>YouTube Downloader API</h1>
  <p class="sub">Production-ready REST API · yt-dlp + ffmpeg · Node.js 24 + Express 5</p>

  <h2>Overview</h2>
  <p>Submit a YouTube URL or plain-text search query and receive structured metadata alongside four direct links — two for MP4 (video) and two for MP3 (audio). One link in each pair triggers an immediate browser download; the other opens the file inline for preview directly in the browser. All files expire automatically after 15 minutes.</p>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/v1/q?q=&lt;url_or_query&gt;</span></p>
    <p class="endpoint-desc">Fetches metadata and produces four links (MP4 download, MP4 preview, MP3 download, MP3 preview). Accepts full YouTube URLs, short URLs (<code>youtu.be</code>), or plain-text search queries.</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/download/:filename</span></p>
    <p class="endpoint-desc">Serves the file with <code>Content-Disposition: attachment</code> — the browser saves it immediately to disk.</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/preview/:filename</span></p>
    <p class="endpoint-desc">Serves the file with <code>Content-Disposition: inline</code> — the browser plays it directly (video player or audio player).</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/doc</span></p>
    <p class="endpoint-desc">Machine-readable JSON: API info, endpoint list, and copyright disclaimer.</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/docs</span></p>
    <p class="endpoint-desc">This documentation page.</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/healthz</span></p>
    <p class="endpoint-desc">Health check — returns <code>{"status":"ok"}</code>.</p>
  </div>

  <h2>Query Parameter</h2>
  <table>
    <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>q</code></td><td>string</td><td>Yes</td><td>YouTube URL or search query (max 500 chars)</td></tr>
  </table>

  <h2>Example Requests</h2>
  <pre><code>GET /api/v1/q?q=https://www.youtube.com/watch?v=kXYiU_JCYtU
GET /api/v1/q?q=Imagine+Dragons+Believer
GET /api/v1/q?q=https://youtu.be/kXYiU_JCYtU</code></pre>

  <h2>The 4 Download Links Explained</h2>
  <div class="link-grid">
    <div class="link-card">
      <div class="label">MP4 — Download</div>
      <div class="desc"><code>downloads.mp4.download</code><br/>Video file — browser saves it to disk immediately (attachment).</div>
    </div>
    <div class="link-card">
      <div class="label">MP4 — Preview</div>
      <div class="desc"><code>downloads.mp4.preview</code><br/>Video file — opens in the browser's built-in video player (inline).</div>
    </div>
    <div class="link-card">
      <div class="label">MP3 — Download</div>
      <div class="desc"><code>downloads.mp3.download</code><br/>Audio file — browser saves it to disk immediately (attachment).</div>
    </div>
    <div class="link-card">
      <div class="label">MP3 — Preview</div>
      <div class="desc"><code>downloads.mp3.preview</code><br/>Audio file — opens in the browser's built-in audio player (inline).</div>
    </div>
  </div>

  <h2>Success Response</h2>
  <pre><code>{
  "status": true,
  "query": "Imagine Dragons Believer",
  "title": "Imagine Dragons - Believer (Official Music Video)",
  "thumbnail": "https://i.ytimg.com/vi/7wtfhZwyrcc/maxresdefault.jpg",
  "duration": "00:03:37",
  "channel": "ImagineDragons",
  "views": 2982421456,
  "upload_date": "2017-03-07",
  "downloads": {
    "mp4": {
      "download": "https://&lt;domain&gt;/api/download/&lt;uuid&gt;.mp4",
      "preview":  "https://&lt;domain&gt;/api/preview/&lt;uuid&gt;.mp4"
    },
    "mp3": {
      "download": "https://&lt;domain&gt;/api/download/&lt;uuid&gt;.mp3",
      "preview":  "https://&lt;domain&gt;/api/preview/&lt;uuid&gt;.mp3"
    }
  }
}</code></pre>

  <h2>Error Response</h2>
  <pre><code>{
  "status": false,
  "error": "Invalid input, video not found, or processing failed"
}</code></pre>

  <h2>Rate Limiting</h2>
  <p>Requests to <code>/api/v1/q</code> are limited to <strong>10 requests per 15 minutes</strong> per IP to prevent abuse.</p>

  <h2>HTTP Status Codes</h2>
  <table>
    <tr><th>Code</th><th>Meaning</th></tr>
    <tr><td><code>200</code></td><td>Success</td></tr>
    <tr><td><code>400</code></td><td>Missing or invalid query / filename</td></tr>
    <tr><td><code>403</code></td><td>Forbidden (path traversal attempt)</td></tr>
    <tr><td><code>404</code></td><td>File not found or expired (TTL: 15 min)</td></tr>
    <tr><td><code>429</code></td><td>Rate limit exceeded</td></tr>
    <tr><td><code>500</code></td><td>Processing failed — video unavailable, private, or format unsupported</td></tr>
  </table>

  <h2>Technical Details</h2>
  <p>
    <span class="chip">Duration from metadata</span>
    <span class="chip">MP3 @ 192 kbps libmp3lame</span>
    <span class="chip">MP4 best video + audio merged</span>
    <span class="chip">UUID filenames</span>
    <span class="chip">Auto-cleanup 15 min</span>
    <span class="chip">No shell injection</span>
  </p>

  <h2>Copyright Disclaimer</h2>
  <div class="notice">
    This API is provided for personal and educational use only. Downloading copyrighted content from YouTube may violate
    YouTube's <a href="https://www.youtube.com/t/terms" style="color:#fbbf24;">Terms of Service</a> and applicable copyright laws.
    All files are held temporarily for a maximum of 15 minutes and then permanently deleted — no content is stored or redistributed.
    Users are solely responsible for ensuring their use complies with all applicable laws and platform terms of service.
    This service is not affiliated with, endorsed by, or sponsored by YouTube or Google LLC.
    YouTube® is a registered trademark of Google LLC.
  </div>
</div>
</body>
</html>`);
});

export default router;
