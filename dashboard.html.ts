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

  /* ── Vote Section ── */
  .vote-section {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 32px 0;
    display: none;
  }
  .vote-section.active { display: block; }
  .vote-card {
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 20px;
    animation: slideIn 0.3s ease-out;
  }
  .vote-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--bg);
    background: var(--accent);
    padding: 2px 8px;
    border-radius: 3px;
    margin-bottom: 10px;
    display: inline-block;
  }
  .vote-question {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--text);
  }
  .vote-option {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .vote-option-num {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }
  .vote-option-label {
    font-size: 14px;
    min-width: 80px;
    flex-shrink: 0;
  }
  .vote-bar-bg {
    flex: 1;
    height: 24px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .vote-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .vote-bar-fill.winner { background: #f59e0b; }
  .vote-bar-count {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
    width: 50px;
    text-align: right;
    flex-shrink: 0;
  }
  .vote-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .vote-total {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
  }
  .vote-total strong { color: var(--accent); }
  .btn-end-vote {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    padding: 8px 16px;
    border: 1px solid var(--danger);
    background: rgba(239, 68, 68, 0.08);
    color: var(--danger);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-end-vote:hover {
    background: var(--danger);
    color: white;
  }
  .vote-result {
    text-align: center;
    padding: 10px;
    font-weight: 700;
    color: #f59e0b;
    font-size: 14px;
    display: none;
  }
  body.obs-mode .vote-section { padding: 0; max-width: 100%; }
  body.obs-mode .vote-card {
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(12px);
  }
  body.obs-mode .btn-end-vote { display: none; }
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

  <div class="vote-section" id="vote-section">
    <div class="vote-card">
      <span class="vote-label">VOTE</span>
      <div class="vote-question" id="vote-question"></div>
      <div id="vote-options"></div>
      <div class="vote-footer">
        <span class="vote-total">총 <strong id="vote-total">0</strong>표</span>
        <button class="btn-end-vote" id="btn-end-vote">투표 종료</button>
      </div>
      <div class="vote-result" id="vote-result"></div>
    </div>
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
let currentVote = null;
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
      case 'vote_created':
        currentVote = msg.vote;
        renderVote();
        showToast('새 투표가 생성되었습니다');
        break;
      case 'vote_updated':
        currentVote = msg.vote;
        renderVote();
        break;
      case 'vote_ended':
        currentVote = msg.vote;
        currentVote.active = false;
        renderVoteEnded(msg.winnerIndex, msg.winnerLabel);
        showToast('투표가 종료되었습니다');
        setTimeout(function() {
          currentVote = null;
          document.getElementById('vote-section').classList.remove('active');
        }, 10000);
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

  container.innerHTML = ideas.slice().reverse().map(function(idea) {
    var time = new Date(idea.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    var sentClass = idea.sentToClaude ? ' sent' : '';
    var sentBadge = idea.sentToClaude ? '<span class="sent-badge">SENT</span>' : '';
    var btnDisabled = idea.sentToClaude ? ' disabled' : '';
    var btnText = idea.sentToClaude ? '\\u2713 전달됨' : 'Claude에 전달';
    var html = '<div class="idea-card' + sentClass + '">';
    html += '<div class="idea-content">';
    html += '<div class="idea-meta">';
    html += '<span class="idea-nickname">' + esc(idea.nickname) + '</span>';
    html += '<span class="idea-time">' + time + '</span>';
    html += sentBadge;
    html += '</div>';
    html += '<div class="idea-text">' + esc(idea.ideaText) + '</div>';
    html += '</div>';
    html += '<button class="btn-select" data-id="' + idea.id + '"' + btnDisabled + '>' + btnText + '</button>';
    html += '</div>';
    return html;
  }).join('');
}

document.getElementById('ideas').addEventListener('click', function(e) {
  var btn = e.target.closest('.btn-select');
  if (!btn || btn.disabled) return;
  selectIdea(btn.getAttribute('data-id'));
});

function selectIdea(id) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'select_idea', id: id }));
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

function renderVote() {
  if (!currentVote) return;
  var section = document.getElementById('vote-section');
  section.classList.add('active');
  document.getElementById('vote-question').textContent = currentVote.question;
  document.getElementById('vote-total').textContent = currentVote.totalVotes;
  document.getElementById('btn-end-vote').style.display = currentVote.active ? '' : 'none';
  document.getElementById('vote-result').style.display = 'none';

  var html = '';
  currentVote.options.forEach(function(opt) {
    var count = currentVote.votes[opt.index] || 0;
    var pct = currentVote.totalVotes > 0 ? (count / currentVote.totalVotes * 100) : 0;
    html += '<div class="vote-option">';
    html += '<span class="vote-option-num">' + opt.index + '</span>';
    html += '<span class="vote-option-label">' + esc(opt.label) + '</span>';
    html += '<div class="vote-bar-bg"><div class="vote-bar-fill" style="width:' + pct + '%"></div></div>';
    html += '<span class="vote-bar-count">' + count + '</span>';
    html += '</div>';
  });
  document.getElementById('vote-options').innerHTML = html;
}

function renderVoteEnded(winnerIndex, winnerLabel) {
  renderVote();
  document.getElementById('btn-end-vote').style.display = 'none';
  var result = document.getElementById('vote-result');
  result.style.display = '';
  result.textContent = winnerIndex + '번 "' + winnerLabel + '" 선택됨';
  // Highlight winner bar
  var options = document.querySelectorAll('#vote-options .vote-option');
  options.forEach(function(el, i) {
    if (i === winnerIndex - 1) {
      var bar = el.querySelector('.vote-bar-fill');
      if (bar) bar.classList.add('winner');
    }
  });
}

document.getElementById('btn-end-vote').addEventListener('click', function() {
  if (!confirm('투표를 종료하시겠습니까?')) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'end_vote' }));
  }
});

function esc(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

connect();
</script>
</body>
</html>`;
