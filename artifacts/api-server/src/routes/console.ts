import { Router, type IRouter, type Request, type Response } from "express";
import { bus, type LogEvent } from "../lib/eventBus.js";

const router: IRouter = Router();

router.get("/console/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: LogEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  for (const event of bus.getRecent()) send(event);

  bus.on("log", send);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20_000);

  req.on("close", () => {
    bus.off("log", send);
    clearInterval(heartbeat);
  });
});

router.get("/console", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Live Console — YT Downloader API</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0b0d14;--surface:#0f1117;--border:#1e2330;
    --text:#e2e8f0;--muted:#4b5563;--green:#10b981;
    --yellow:#f59e0b;--red:#ef4444;--blue:#60a5fa;--purple:#a78bfa;
    --accent:#6366f1;
  }
  html,body{height:100%;overflow:hidden}
  body{font-family:'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,monospace;
    background:var(--bg);color:var(--text);display:flex;flex-direction:column}

  header{
    flex-shrink:0;padding:0 20px;height:52px;
    display:flex;align-items:center;justify-content:space-between;
    background:rgba(11,13,20,0.9);border-bottom:1px solid var(--border);
    backdrop-filter:blur(8px);
  }
  .header-left{display:flex;align-items:center;gap:12px}
  .logo{font-size:0.85rem;font-weight:700;color:var(--text);text-decoration:none;
    display:flex;align-items:center;gap:8px}
  .logo-icon{width:24px;height:24px;background:var(--accent);border-radius:6px;
    display:flex;align-items:center;justify-content:center;font-size:11px}
  .page-title{font-size:0.78rem;color:var(--muted);font-family:inherit}
  .status-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);
    transition:background 0.3s;flex-shrink:0}
  .status-dot.connected{background:var(--green);box-shadow:0 0 6px var(--green)}
  .status-dot.error{background:var(--red)}
  .status-label{font-size:0.72rem;color:var(--muted)}
  .header-right{display:flex;align-items:center;gap:8px}

  .btn{
    font-family:inherit;font-size:0.72rem;font-weight:600;
    padding:5px 12px;border-radius:6px;cursor:pointer;border:none;
    transition:opacity 0.15s;
  }
  .btn:hover{opacity:0.85}
  .btn-ghost{background:var(--surface);color:var(--muted);border:1px solid var(--border)}
  .btn-ghost:hover{color:var(--text)}

  .terminal{
    flex:1;overflow-y:auto;padding:16px 20px 24px;
    scroll-behavior:smooth;
  }
  .terminal::-webkit-scrollbar{width:6px}
  .terminal::-webkit-scrollbar-track{background:transparent}
  .terminal::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

  .entry{
    display:flex;align-items:flex-start;gap:10px;
    padding:4px 0;font-size:0.8rem;line-height:1.55;
    border-bottom:1px solid rgba(30,35,48,0.4);
  }
  .entry:last-child{border-bottom:none}

  .ts{color:var(--muted);flex-shrink:0;font-size:0.72rem;padding-top:1px;min-width:80px}
  .badge{
    flex-shrink:0;font-size:0.65rem;font-weight:700;letter-spacing:0.05em;
    padding:2px 6px;border-radius:4px;text-transform:uppercase;min-width:42px;
    text-align:center;margin-top:1px;
  }
  .badge-info{background:rgba(96,165,250,0.12);color:var(--blue);border:1px solid rgba(96,165,250,0.25)}
  .badge-step{background:rgba(167,139,250,0.12);color:var(--purple);border:1px solid rgba(167,139,250,0.25)}
  .badge-done{background:rgba(16,185,129,0.12);color:var(--green);border:1px solid rgba(16,185,129,0.25)}
  .badge-warn{background:rgba(245,158,11,0.12);color:var(--yellow);border:1px solid rgba(245,158,11,0.25)}
  .badge-error{background:rgba(239,68,68,0.12);color:var(--red);border:1px solid rgba(239,68,68,0.25)}

  .msg{flex:1;color:var(--text);word-break:break-all}
  .msg .key{color:var(--muted)}
  .msg .val{color:#86efac}

  .empty{
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    height:100%;color:var(--muted);gap:10px;text-align:center;
  }
  .empty-icon{font-size:2.5rem;opacity:0.3}
  .empty-text{font-size:0.82rem}

  footer{
    flex-shrink:0;padding:8px 20px;
    display:flex;align-items:center;justify-content:space-between;
    border-top:1px solid var(--border);font-size:0.7rem;color:var(--muted);
  }
  .count{transition:color 0.2s}
</style>
</head>
<body>

<header>
  <div class="header-left">
    <a class="logo" href="/api/doc">
      <div class="logo-icon">▶</div>
      YT API
    </a>
    <span class="page-title">/ live console</span>
  </div>
  <div class="header-right">
    <div class="status-dot" id="dot"></div>
    <span class="status-label" id="status-label">Connecting…</span>
    <button class="btn btn-ghost" onclick="clearLog()">Clear</button>
    <button class="btn btn-ghost" id="scroll-btn" onclick="toggleScroll()">Auto-scroll ON</button>
  </div>
</header>

<div class="terminal" id="terminal">
  <div class="empty" id="empty">
    <div class="empty-icon">⬛</div>
    <div class="empty-text">Waiting for events…<br/>Make a request to <code style="color:var(--purple)">/api/v1/q</code> to see it here.</div>
  </div>
</div>

<footer>
  <span>Live SSE stream from <code>/api/console/stream</code></span>
  <span><span id="count">0</span> events</span>
</footer>

<script>
  let autoScroll = true;
  let count = 0;
  const terminal = document.getElementById('terminal');
  const empty = document.getElementById('empty');
  const dot = document.getElementById('dot');
  const statusLabel = document.getElementById('status-label');
  const countEl = document.getElementById('count');

  function fmtTime(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,'0');
    return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }

  function fmtData(data) {
    if (!data) return '';
    const parts = Object.entries(data).map(([k,v]) =>
      ' <span class="key">'+escHtml(k)+'=</span><span class="val">'+escHtml(String(v))+'</span>'
    );
    return parts.join('');
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function addEntry(event) {
    if (empty.parentNode) empty.remove();
    count++;
    countEl.textContent = count;

    const badgeClass = {
      info:'badge-info', step:'badge-step', done:'badge-done',
      warn:'badge-warn', error:'badge-error'
    }[event.level] || 'badge-info';

    const entry = document.createElement('div');
    entry.className = 'entry';
    entry.innerHTML =
      '<span class="ts">'+fmtTime(event.ts)+'</span>'+
      '<span class="badge '+badgeClass+'">'+escHtml(event.level)+'</span>'+
      '<span class="msg">'+escHtml(event.msg)+fmtData(event.data)+'</span>';

    terminal.appendChild(entry);
    if (autoScroll) terminal.scrollTop = terminal.scrollHeight;
  }

  function clearLog() {
    terminal.innerHTML = '';
    terminal.appendChild(empty);
    count = 0;
    countEl.textContent = '0';
  }

  function toggleScroll() {
    autoScroll = !autoScroll;
    document.getElementById('scroll-btn').textContent =
      'Auto-scroll ' + (autoScroll ? 'ON' : 'OFF');
  }

  function connect() {
    const es = new EventSource('/api/console/stream');

    es.onopen = () => {
      dot.className = 'status-dot connected';
      statusLabel.textContent = 'Connected';
    };

    es.onmessage = e => {
      try { addEntry(JSON.parse(e.data)); } catch {}
    };

    es.onerror = () => {
      dot.className = 'status-dot error';
      statusLabel.textContent = 'Reconnecting…';
    };
  }

  connect();
</script>
</body>
</html>`);
});

export default router;
