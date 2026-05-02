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
  .wrap { max-width: 860px; margin: 0 auto; padding: 48px 24px; }
  h1 { font-size: 2rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
  .sub { color: #94a3b8; margin-bottom: 40px; font-size: 1rem; }
  h2 { font-size: 1.2rem; font-weight: 600; color: #e2e8f0; margin: 36px 0 12px; border-left: 3px solid #6366f1; padding-left: 12px; }
  p { color: #94a3b8; margin-bottom: 12px; }
  code { background: #1e2432; color: #a5b4fc; padding: 2px 7px; border-radius: 4px; font-size: 0.88em; font-family: monospace; }
  pre { background: #1e2432; border: 1px solid #2d3748; border-radius: 8px; padding: 20px; overflow-x: auto; margin: 12px 0 20px; }
  pre code { background: transparent; color: #e2e8f0; padding: 0; font-size: 0.85em; }
  .badge { display: inline-block; background: #6366f1; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 8px; vertical-align: middle; }
  .get { background: #059669; }
  .endpoint { background: #161c2d; border: 1px solid #2d3748; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
  .endpoint-line { font-family: monospace; font-size: 0.95rem; color: #a5b4fc; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
  th { text-align: left; padding: 8px 12px; background: #1e2432; color: #94a3b8; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 8px 12px; border-bottom: 1px solid #1e2432; color: #cbd5e1; font-size: 0.9rem; }
  .tag { display: inline-block; background: #1e2432; color: #94a3b8; border: 1px solid #2d3748; padding: 2px 8px; border-radius: 20px; font-size: 0.78rem; margin-right: 4px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>YouTube Downloader API</h1>
  <p class="sub">Production-ready REST API for retrieving YouTube media and metadata</p>

  <h2>Overview</h2>
  <p>Submit a YouTube URL or plain-text search query and receive structured metadata alongside direct download links for MP4 (video) and MP3 (audio) files. Files are stored temporarily and expire after 15 minutes.</p>

  <h2>Base URL</h2>
  <div class="endpoint">
    <span class="endpoint-line">/api</span>
  </div>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/v1/q?q=&lt;url_or_query&gt;</span></p>
    <p style="margin-top:10px;">Fetches metadata and downloads both MP4 and MP3 for the specified video. Accepts full YouTube URLs, short URLs, or plain-text search queries.</p>
    <table>
      <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
      <tr><td><code>q</code></td><td>string</td><td>Yes</td><td>YouTube URL or search query (max 500 chars)</td></tr>
      <tr><td><code>quality</code></td><td>string</td><td>No</td><td>Reserved for future quality selection (e.g. 720)</td></tr>
    </table>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/download/:filename</span></p>
    <p style="margin-top:10px;">Streams a previously generated file. Filenames are UUID-based and expire after 15 minutes.</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/docs</span></p>
    <p style="margin-top:10px;">Returns this documentation page.</p>
  </div>

  <div class="endpoint">
    <p><span class="badge get">GET</span><span class="endpoint-line">/api/healthz</span></p>
    <p style="margin-top:10px;">Health check endpoint. Returns <code>{"status":"ok"}</code>.</p>
  </div>

  <h2>Example Requests</h2>
  <pre><code>GET /api/v1/q?q=https://www.youtube.com/watch?v=kXYiU_JCYtU
GET /api/v1/q?q=Imagine+Dragons+Believer
GET /api/v1/q?q=https://youtu.be/kXYiU_JCYtU</code></pre>

  <h2>Success Response</h2>
  <pre><code>{
  "status": true,
  "query": "Imagine Dragons Believer",
  "title": "Imagine Dragons - Believer",
  "thumbnail": "https://img.youtube.com/vi/W2TE0DjdNqI/maxresdefault.jpg",
  "duration": "00:03:24",
  "channel": "ImagineDragonsVEVO",
  "views": 1234567890,
  "upload_date": "2017-01-31",
  "downloads": {
    "mp4": "https://&lt;your-domain&gt;/api/download/&lt;uuid&gt;.mp4",
    "mp3": "https://&lt;your-domain&gt;/api/download/&lt;uuid&gt;.mp3"
  }
}</code></pre>

  <h2>Error Response</h2>
  <pre><code>{
  "status": false,
  "error": "Invalid input, video not found, or processing failed"
}</code></pre>

  <h2>Rate Limiting</h2>
  <p>Requests to <code>/api/v1/q</code> are limited to <strong>10 requests per 15 minutes</strong> per IP address to prevent abuse.</p>

  <h2>Error Codes</h2>
  <table>
    <tr><th>HTTP Code</th><th>Meaning</th></tr>
    <tr><td><code>400</code></td><td>Missing or invalid query parameter</td></tr>
    <tr><td><code>404</code></td><td>File not found or expired</td></tr>
    <tr><td><code>429</code></td><td>Rate limit exceeded</td></tr>
    <tr><td><code>500</code></td><td>Processing failed (video unavailable, unsupported format, etc.)</td></tr>
  </table>

  <h2>Notes</h2>
  <p><span class="tag">Duration</span> Sourced from metadata, not the generated file — always accurate.</p>
  <p><span class="tag">MP3</span> Encoded at 192 kbps using libmp3lame via ffmpeg.</p>
  <p><span class="tag">MP4</span> Best available video merged with best audio via ffmpeg.</p>
  <p><span class="tag">TTL</span> Download files are automatically deleted after 15 minutes.</p>
  <p><span class="tag">Security</span> All shell commands use argument arrays — no interpolation of user input.</p>
</div>
</body>
</html>`);
});

export default router;
