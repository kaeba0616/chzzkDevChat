export const dashboardHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>chzzkDevChat — 아이디어 대시보드</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface-hover: #1a1a26;
    --border: #2a2a3a;
    --accent: #00e5a0;
    --accent-dim: #00e5a022;
    --accent-glow: #00e5a044;
    --sent: #6366f1;
    --sent-dim: #6366f122;
    --text: #e8e8ef;
    --text-dim: #6b6b80;
    --danger: #ef4444;
    --font-body: 'Noto Sans KR', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  body.obs-mode {
    background: transparent !important;
  }
  body.obs-mode .header,
  body.obs-mode .toolbar { display: none !important; }
  body.obs-mode .container { padding: 0; max-width: 100%; }
  body.obs-mode .ideas-list { gap: 6px; }
  body.obs-mode .idea-card {
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.06);
    padding: 10px 14px;
  }

  /* ── Scanline overlay ── */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    );
    z-index: 9999;
  }
  body.obs-mode::after { display: none; }

  /* ── Header ── */
  .header {
    padding: 28px 32px 20px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, #0f0f18 0%, var(--bg) 100%);
    position: relative;
  }
  .header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .logo {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .logo h1 {
    font-family: var(--font-mono);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--accent);
  }
  .logo .tag {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .status-bar {
    display: flex;
    gap: 16px;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-dim);
  }
  .status-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 5px;
    vertical-align: middle;
  }
  .status-dot.on {
    background: var(--accent);
    box-shadow: 0 0 6px var(--accent);
  }
  .status-dot.off {
    background: var(--danger);
    box-shadow: 0 0 6px var(--danger);
  }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .idea-count {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-dim);
  }
  .idea-count strong {
    color: var(--accent);
    font-weight: 700;
  }
  .btn-clear {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 6px 14px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-clear:hover {
    border-color: var(--danger);
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
  }

  /* ── Container ── */
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 32px 40px;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-dim);
  }
  .empty-state .icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }
  .empty-state p {
    font-size: 14px;
    line-height: 1.7;
  }
  .empty-state code {
    font-family: var(--font-mono);
    background: var(--surface);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--accent);
  }

  /* ── Ideas list ── */
  .ideas-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ── Idea card ── */
  .idea-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    transition: all 0.2s;
    animation: slideIn 0.3s ease-out;
  }
  .idea-card:hover {
    background: var(--surface-hover);
    border-color: var(--accent-glow);
  }
  .idea-card.sent {
    opacity: 0.5;
    border-color: var(--sent-dim);
  }
  .idea-card.sent:hover {
    opacity: 0.7;
    border-color: var(--sent);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .idea-content {
    flex: 1;
    min-width: 0;
  }
  .idea-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .idea-nickname {
    font-weight: 700;
    font-size: 13px;
    color: var(--accent);
  }
  .idea-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .idea-text {
    font-size: 15px;
    line-height: 1.6;
    word-break: break-word;
  }
  .idea-card.sent .idea-text {
    text-decoration: line-through;
    text-decoration-color: var(--text-dim);
  }
  .sent-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--sent);
    border: 1px solid var(--sent-dim);
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: 4px;
  }

  .btn-select {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    padding: 8px 16px;
    border: 1px solid var(--accent);
    background: var(--accent-dim);
    color: var(--accent);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    align-self: center;
  }
  .btn-select:hover {
    background: var(--accent);
    color: var(--bg);
    box-shadow: 0 0 16px var(--accent-glow);
  }
  .btn-select:disabled {
    border-color: var(--sent-dim);
    background: var(--sent-dim);
    color: var(--sent);
    cursor: default;
    box-shadow: none;
  }

  /* ── Connection toast ── */
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-dim);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s;
    z-index: 100;
  }
  .toast.show {
    opacity: 1;
    transform: translateY(0);
  }
  .toast.error {
    border-color: var(--danger);
    color: var(--danger);
  }

  body.obs-mode .toast { display: none; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div class="logo">
        <h1>chzzkDevChat</h1>
        <span class="tag">LIVE</span>
      </div>
      <div class="status-bar">
        <span><span class="status-dot off" id="chzzk-status"></span>치지직</span>
        <span><span class="status-dot off" id="ws-status"></span>대시보드</span>
      </div>
    </div>
  </div>

  <div class="toolbar">
    <span class="idea-count">아이디어 <strong id="idea-count">0</strong>개</span>
    <button class="btn-clear" onclick="clearAll()">전체 삭제</button>
  </div>

  <div class="container">
    <div id="ideas" class="ideas-list"></div>
    <div id="empty" class="empty-state">
      <div class="icon">&#x1f4a1;</div>
      <p>아직 아이디어가 없습니다<br>채팅에서 <code>!아이디어 내용</code>을 입력해보세요</p>
    </div>
  </div>

  <div class="toast" id="toast"></div>

<script>
const isObs = new URLSearchParams(location.search).has('obs');
if (isObs) document.body.classList.add('obs-mode');

let ideas = [];
let ws;
let reconnectDelay = 1000;

function connect() {
  ws = new WebSocket('ws://' + location.host);

  ws.onopen = () => {
    reconnectDelay = 1000;
    setWsStatus(true);
    showToast('대시보드 연결됨');
  };

  ws.onclose = () => {
    setWsStatus(false);
    showToast('연결 끊김 — 재연결 중...', true);
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
  };

  ws.onerror = () => ws.close();

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    switch (msg.type) {
      case 'ideas':
        ideas = msg.ideas;
        renderAll();
        break;
      case 'new_idea':
        ideas.push(msg.idea);
        renderAll();
        break;
      case 'idea_selected':
        const idea = ideas.find(i => i.id === msg.id);
        if (idea) { idea.selected = true; idea.sentToClaude = true; }
        renderAll();
        break;
      case 'clear_ideas':
        ideas = [];
        renderAll();
        break;
      case 'status':
        setChzzkStatus(msg.chzzk);
        break;
    }
  };
}

function renderAll() {
  const container = document.getElementById('ideas');
  const empty = document.getElementById('empty');
  document.getElementById('idea-count').textContent = ideas.length;

  if (ideas.length === 0) {
    container.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';

  container.innerHTML = ideas.slice().reverse().map(idea => {
    const time = new Date(idea.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const sentClass = idea.sentToClaude ? ' sent' : '';
    const sentBadge = idea.sentToClaude ? '<span class="sent-badge">SENT</span>' : '';
    const btnDisabled = idea.sentToClaude ? ' disabled' : '';
    const btnText = idea.sentToClaude ? '\\u2713 전달됨' : 'Claude에 전달';

    return '<div class="idea-card' + sentClass + '">' +
      '<div class="idea-content">' +
        '<div class="idea-meta">' +
          '<span class="idea-nickname">' + esc(idea.nickname) + '</span>' +
          '<span class="idea-time">' + time + '</span>' +
          sentBadge +
        '</div>' +
        '<div class="idea-text">' + esc(idea.ideaText) + '</div>' +
      '</div>' +
      '<button class="btn-select"' + btnDisabled + " onclick=\"selectIdea('" + idea.id + "')\">" + btnText + '</button>' +
    '</div>';
  }).join('');
}

function selectIdea(id) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'select_idea', id }));
  }
}

function clearAll() {
  if (!confirm('모든 아이디어를 삭제하시겠습니까?')) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'clear_ideas' }));
  }
}

function setChzzkStatus(on) {
  const dot = document.getElementById('chzzk-status');
  dot.className = 'status-dot ' + (on ? 'on' : 'off');
}

function setWsStatus(on) {
  const dot = document.getElementById('ws-status');
  dot.className = 'status-dot ' + (on ? 'on' : 'off');
}

function showToast(text, isError) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.className = 'toast', 3000);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

connect();
</script>
</body>
</html>`;
