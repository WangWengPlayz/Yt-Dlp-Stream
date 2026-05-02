import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

router.get("/doc", (req: Request, res: Response) => {
  // Build the base URL so the Try-it button links to the correct domain
  const forwarded = req.get("x-forwarded-host");
  const forwProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  let base =
    forwarded && forwProto
      ? `${forwProto}://${forwarded}`
      : (() => {
          const domains = process.env["REPLIT_DOMAINS"];
          if (domains) return `https://${domains.split(",")[0]!.trim()}`;
          return `${req.protocol}://${req.get("host") ?? "localhost"}`;
        })();

  const apiBase = `${base}/api`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>YouTube Downloader API — Documentation</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0b0d14;
    --surface: #13161f;
    --surface2: #1a1e2b;
    --border: #252a38;
    --text: #e2e8f0;
    --muted: #7c8ba1;
    --accent: #6366f1;
    --accent-hover: #818cf8;
    --green: #10b981;
    --yellow: #f59e0b;
    --red: #ef4444;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.65;
    min-height: 100vh;
  }

  /* ── Top bar ── */
  header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(11,13,20,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 58px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 1rem;
    color: var(--text);
    text-decoration: none;
  }
  .logo-icon {
    width: 30px;
    height: 30px;
    background: var(--accent);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .version-badge {
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 2px 8px;
    border-radius: 20px;
  }
  .header-nav { display: flex; gap: 6px; }
  .nav-link {
    font-size: 0.82rem;
    color: var(--muted);
    text-decoration: none;
    padding: 5px 12px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }
  .nav-link:hover { color: var(--text); background: var(--surface2); }

  /* ── Layout ── */
  .page { max-width: 880px; margin: 0 auto; padding: 56px 24px 100px; }

  /* ── Hero ── */
  .hero { text-align: center; padding: 48px 0 56px; }
  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 20px;
  }
  .hero h1 {
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    font-weight: 800;
    line-height: 1.2;
    color: #fff;
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  .hero h1 span { color: var(--accent); }
  .hero-desc {
    font-size: 1.05rem;
    color: var(--muted);
    max-width: 580px;
    margin: 0 auto 32px;
  }
  .hero-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 40px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.78rem;
    font-weight: 500;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 4px 12px;
    border-radius: 20px;
  }
  .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0; }

  /* ── Try-it panel ── */
  .try-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px 28px 24px;
    margin-bottom: 60px;
    position: relative;
    overflow: hidden;
  }
  .try-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 60% -20%, rgba(99,102,241,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .try-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .try-form {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }
  .try-input {
    flex: 1;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 0.95rem;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s;
    font-family: inherit;
    min-width: 0;
  }
  .try-input::placeholder { color: var(--muted); }
  .try-input:focus { border-color: var(--accent); }
  .try-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 12px 22px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.15s, transform 0.1s;
    font-family: inherit;
  }
  .try-btn:hover { background: var(--accent-hover); }
  .try-btn:active { transform: scale(0.97); }
  .try-hint {
    margin-top: 10px;
    font-size: 0.78rem;
    color: var(--muted);
  }
  .try-hint code {
    background: var(--surface2);
    color: var(--accent-hover);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.78rem;
  }

  /* ── Section headings ── */
  .section { margin-bottom: 52px; }
  .section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #fff;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title .icon {
    width: 28px;
    height: 28px;
    background: var(--surface2);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
  }

  /* ── Purpose cards ── */
  .purpose-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .purpose-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px;
  }
  .purpose-card .card-icon { font-size: 1.4rem; margin-bottom: 10px; }
  .purpose-card h3 { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .purpose-card p { font-size: 0.82rem; color: var(--muted); line-height: 1.55; }

  /* ── Endpoint table ── */
  .endpoint-list { display: flex; flex-direction: column; gap: 8px; }
  .ep {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .ep-method {
    font-size: 0.7rem;
    font-weight: 700;
    background: rgba(16,185,129,0.12);
    color: var(--green);
    border: 1px solid rgba(16,185,129,0.25);
    padding: 3px 8px;
    border-radius: 5px;
    flex-shrink: 0;
    margin-top: 2px;
    letter-spacing: 0.05em;
  }
  .ep-path { font-family: monospace; font-size: 0.9rem; color: var(--accent-hover); }
  .ep-desc { font-size: 0.82rem; color: var(--muted); margin-top: 2px; }

  /* ── Response structure ── */
  pre.json-block {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px;
    overflow-x: auto;
    font-size: 0.82rem;
    line-height: 1.7;
    color: var(--text);
  }
  .jk { color: #94a3b8; }
  .js { color: #86efac; }
  .jn { color: #fca5a5; }
  .jb { color: var(--accent-hover); }

  /* ── Stack badges ── */
  .stack-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .stack-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 0.82rem;
    color: var(--text);
  }
  .stack-badge .sb-icon { font-size: 1rem; }

  /* ── Copyright ── */
  .copyright-box {
    background: linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(239,68,68,0.06) 100%);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 14px;
    padding: 26px 28px;
  }
  .copyright-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 1rem;
    color: var(--yellow);
    margin-bottom: 14px;
  }
  .copyright-body {
    font-size: 0.87rem;
    color: #cbd5e1;
    line-height: 1.75;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .copyright-body a { color: var(--yellow); text-decoration: none; }
  .copyright-body a:hover { text-decoration: underline; }
  .legal-note {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(245,158,11,0.15);
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.6;
  }

  /* ── Footer ── */
  footer {
    text-align: center;
    padding: 32px 24px;
    border-top: 1px solid var(--border);
    font-size: 0.8rem;
    color: var(--muted);
  }

  @media (max-width: 540px) {
    .try-form { flex-direction: column; }
    .header-nav { display: none; }
    .ep { flex-direction: column; gap: 6px; }
  }
</style>
</head>
<body>

<header>
  <a class="logo" href="/api/doc">
    <div class="logo-icon">▶</div>
    YT Downloader API
  </a>
  <nav class="header-nav">
    <a class="nav-link" href="#purpose">Purpose</a>
    <a class="nav-link" href="#endpoints">Endpoints</a>
    <a class="nav-link" href="#response">Response</a>
    <a class="nav-link" href="#copyright">Copyright</a>
    <a class="nav-link" href="/api/docs">Full Docs</a>
  </nav>
</header>

<main class="page">

  <!-- Hero -->
  <section class="hero">
    <div class="hero-eyebrow">&#9679; REST API &nbsp;·&nbsp; v1.0.0</div>
    <h1>YouTube <span>Downloader</span> API</h1>
    <p class="hero-desc">
      A production-ready API that extracts metadata and generates direct download &amp; inline preview
      links for any YouTube video — no browser extensions, no sign-in required.
    </p>
    <div class="hero-pills">
      <span class="pill"><span class="dot"></span> yt-dlp engine</span>
      <span class="pill"><span class="dot"></span> ffmpeg processing</span>
      <span class="pill"><span class="dot"></span> MP4 + MP3 output</span>
      <span class="pill"><span class="dot"></span> Auto file cleanup</span>
      <span class="pill"><span class="dot"></span> Rate limited</span>
    </div>
  </section>

  <!-- Try it -->
  <div class="try-panel">
    <div class="try-label">&#9654; Try it live</div>
    <div class="try-form">
      <input
        id="try-input"
        class="try-input"
        type="text"
        placeholder="Paste a YouTube URL or type a song title…"
        value=""
        autocomplete="off"
        spellcheck="false"
      />
      <button class="try-btn" onclick="tryApi()">
        Open in new tab
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </button>
    </div>
    <p class="try-hint">
      Opens <code>${apiBase}/v1/q?q=your+query</code> in a new tab and returns the full JSON response.
    </p>
  </div>

  <!-- Purpose -->
  <section class="section" id="purpose">
    <h2 class="section-title"><span class="icon">🎯</span> What This API Does</h2>
    <div class="purpose-grid">
      <div class="purpose-card">
        <div class="card-icon">🔍</div>
        <h3>Search or URL</h3>
        <p>Accepts a full YouTube URL, a short <code>youtu.be</code> link, or any plain-text search query like a song title.</p>
      </div>
      <div class="purpose-card">
        <div class="card-icon">📋</div>
        <h3>Rich Metadata</h3>
        <p>Returns title, duration, thumbnail, channel, view count, and upload date — all sourced directly from yt-dlp.</p>
      </div>
      <div class="purpose-card">
        <div class="card-icon">🎬</div>
        <h3>MP4 Video</h3>
        <p>Best available H.264 video merged with AAC audio via ffmpeg. Two-pass encoding ensures A/V sync and browser compatibility.</p>
      </div>
      <div class="purpose-card">
        <div class="card-icon">🎵</div>
        <h3>MP3 Audio</h3>
        <p>Encoded at 192 kbps stereo 44.1 kHz with libmp3lame. Clean extraction with no cutouts or conversion artefacts.</p>
      </div>
      <div class="purpose-card">
        <div class="card-icon">⬇️</div>
        <h3>Download Link</h3>
        <p>A direct link that triggers the browser's save-to-disk dialog with the correct video title as the filename.</p>
      </div>
      <div class="purpose-card">
        <div class="card-icon">▶️</div>
        <h3>Preview Link</h3>
        <p>An inline link that opens the video or audio directly in the browser's native media player without saving.</p>
      </div>
    </div>
  </section>

  <!-- Endpoints -->
  <section class="section" id="endpoints">
    <h2 class="section-title"><span class="icon">🔗</span> API Endpoints</h2>
    <div class="endpoint-list">
      <div class="ep">
        <span class="ep-method">GET</span>
        <div>
          <div class="ep-path">/api/v1/q?q=&lt;url_or_query&gt;</div>
          <div class="ep-desc">Main endpoint — fetches metadata and returns 4 links (MP4 download, MP4 preview, MP3 download, MP3 preview). Rate limited to 10 requests per 15 minutes per IP.</div>
        </div>
      </div>
      <div class="ep">
        <span class="ep-method">GET</span>
        <div>
          <div class="ep-path">/api/download/:filename</div>
          <div class="ep-desc">Serves the file as an attachment — browser immediately saves it to disk with the correct video title as the filename.</div>
        </div>
      </div>
      <div class="ep">
        <span class="ep-method">GET</span>
        <div>
          <div class="ep-path">/api/preview/:filename</div>
          <div class="ep-desc">Serves the file inline — browser opens its native video or audio player for instant playback without saving.</div>
        </div>
      </div>
      <div class="ep">
        <span class="ep-method">GET</span>
        <div>
          <div class="ep-path">/api/doc</div>
          <div class="ep-desc">This page — HTML documentation, purpose, and copyright disclaimer.</div>
        </div>
      </div>
      <div class="ep">
        <span class="ep-method">GET</span>
        <div>
          <div class="ep-path">/api/docs</div>
          <div class="ep-desc">Technical HTML reference — full endpoint specs, parameters, status codes, and response examples.</div>
        </div>
      </div>
      <div class="ep">
        <span class="ep-method">GET</span>
        <div>
          <div class="ep-path">/api/healthz</div>
          <div class="ep-desc">Health check — returns <code style="font-size:0.8rem;background:#1a1e2b;color:#818cf8;padding:1px 5px;border-radius:4px">{"status":"ok"}</code>.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Response -->
  <section class="section" id="response">
    <h2 class="section-title"><span class="icon">📦</span> Response Structure</h2>
    <pre class="json-block"><span class="jk">{</span>
  <span class="jk">"status":</span>    <span class="jb">true</span>,
  <span class="jk">"query":</span>     <span class="js">"Lady Gaga Abracadabra"</span>,
  <span class="jk">"title":</span>     <span class="js">"Lady Gaga - Abracadabra (Official Music Video)"</span>,
  <span class="jk">"thumbnail":</span> <span class="js">"https://i.ytimg.com/vi/.../maxresdefault.jpg"</span>,
  <span class="jk">"duration":</span>  <span class="js">"00:04:29"</span>,
  <span class="jk">"channel":</span>   <span class="js">"Lady Gaga"</span>,
  <span class="jk">"views":</span>     <span class="jn">244405572</span>,
  <span class="jk">"upload_date":</span> <span class="js">"2025-02-03"</span>,
  <span class="jk">"downloads":</span> <span class="jk">{</span>
    <span class="jk">"mp4":</span> <span class="jk">{</span>
      <span class="jk">"download":</span> <span class="js">"https://&lt;domain&gt;/api/download/&lt;uuid&gt;.mp4"</span>,  <span style="color:#4b5563">// ← saves file</span>
      <span class="jk">"preview":</span>  <span class="js">"https://&lt;domain&gt;/api/preview/&lt;uuid&gt;.mp4"</span>   <span style="color:#4b5563">// ← plays inline</span>
    <span class="jk">}</span>,
    <span class="jk">"mp3":</span> <span class="jk">{</span>
      <span class="jk">"download":</span> <span class="js">"https://&lt;domain&gt;/api/download/&lt;uuid&gt;.mp3"</span>,  <span style="color:#4b5563">// ← saves file</span>
      <span class="jk">"preview":</span>  <span class="js">"https://&lt;domain&gt;/api/preview/&lt;uuid&gt;.mp3"</span>   <span style="color:#4b5563">// ← plays inline</span>
    <span class="jk">}</span>
  <span class="jk">}</span>
<span class="jk">}</span></pre>
    <p style="font-size:0.82rem;color:var(--muted);margin-top:10px;">
      All four links use UUID-based storage filenames internally. The
      <code style="font-size:0.8rem;background:#1a1e2b;color:#818cf8;padding:1px 6px;border-radius:4px">Content-Disposition</code>
      header on each link delivers the proper video title as the save filename (RFC 5987 encoded for full Unicode support).
      Files expire automatically after <strong style="color:var(--text)">15 minutes</strong>.
    </p>
  </section>

  <!-- Stack -->
  <section class="section" id="stack">
    <h2 class="section-title"><span class="icon">⚙️</span> Technology Stack</h2>
    <div class="stack-grid">
      <div class="stack-badge"><span class="sb-icon">🟢</span> Node.js 24 + Express 5</div>
      <div class="stack-badge"><span class="sb-icon">🐍</span> yt-dlp (Python)</div>
      <div class="stack-badge"><span class="sb-icon">🎞️</span> ffmpeg 6</div>
      <div class="stack-badge"><span class="sb-icon">🎵</span> libmp3lame @ 192 kbps</div>
      <div class="stack-badge"><span class="sb-icon">🎬</span> H.264 + AAC (faststart)</div>
      <div class="stack-badge"><span class="sb-icon">🔐</span> No shell injection (execFile)</div>
      <div class="stack-badge"><span class="sb-icon">🕐</span> Auto-cleanup (15 min TTL)</div>
      <div class="stack-badge"><span class="sb-icon">🚦</span> Rate limiting (10 req / 15 min)</div>
    </div>
  </section>

  <!-- Copyright -->
  <section class="section" id="copyright">
    <h2 class="section-title"><span class="icon">⚖️</span> Copyright &amp; Disclaimer</h2>
    <div class="copyright-box">
      <div class="copyright-heading">
        ⚠️ Important Legal Notice
      </div>
      <div class="copyright-body">
        <p>
          This API is provided for <strong>personal and educational use only</strong>.
          Downloading copyrighted content from YouTube may violate YouTube's
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">Terms of Service</a>
          and applicable copyright laws in your jurisdiction.
        </p>
        <p>
          The operators of this API <strong>do not host, store permanently, or redistribute any copyrighted media</strong>.
          All generated files are held temporarily for a maximum of <strong>15 minutes</strong> and are then permanently
          and automatically deleted from the server.
        </p>
        <p>
          Users are solely responsible for ensuring their use of this service complies with all applicable laws,
          regulations, and the terms of service of any platforms involved. By using this API, you accept full
          legal responsibility for any consequences arising from your use.
        </p>
        <p>
          This service is <strong>not affiliated with, endorsed by, or sponsored by YouTube or Google LLC</strong>.
          YouTube® is a registered trademark of Google LLC.
        </p>
      </div>
      <div class="legal-note">
        Use of this API to download content you do not own the rights to may be illegal.
        This service is intended for downloading content you have the legal right to access —
        such as your own uploads, content licensed under Creative Commons, or public domain material.
      </div>
    </div>
  </section>

</main>

<footer>
  YouTube Downloader API &nbsp;·&nbsp; v1.0.0 &nbsp;·&nbsp; Built with yt-dlp + ffmpeg &nbsp;·&nbsp;
  <a href="/api/docs" style="color:var(--accent);text-decoration:none;">Technical Docs</a>
  &nbsp;·&nbsp;
  <a href="/api/healthz" style="color:var(--accent);text-decoration:none;">Health Check</a>
</footer>

<script>
  function tryApi() {
    const q = document.getElementById('try-input').value.trim();
    if (!q) {
      document.getElementById('try-input').focus();
      document.getElementById('try-input').style.borderColor = '#ef4444';
      setTimeout(() => {
        document.getElementById('try-input').style.borderColor = '';
      }, 1200);
      return;
    }
    const url = '${apiBase}/v1/q?q=' + encodeURIComponent(q);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  document.getElementById('try-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') tryApi();
  });
</script>

</body>
</html>`);
});

export default router;
