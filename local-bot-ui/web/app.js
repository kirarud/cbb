const chatList = document.getElementById('chatList');
const chatView = document.getElementById('chatView');
const statusEl = document.getElementById('status');
const modelSelect = document.getElementById('modelSelect');
const modelInput = document.getElementById('modelInput');
const addModelBtn = document.getElementById('addModelBtn');
const refreshModelsBtn = document.getElementById('refreshModelsBtn');
const sourceSelect = document.getElementById('sourceSelect');
const sourceInput = document.getElementById('sourceInput');
const addSourceBtn = document.getElementById('addSourceBtn');
const refreshSourcesBtn = document.getElementById('refreshSourcesBtn');
const newChatBtn = document.getElementById('newChatBtn');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const addBridgeBtn = document.getElementById('addBridgeBtn');
const queueCheckBtn = document.getElementById('queueCheckBtn');
const queueTestBtn = document.getElementById('queueTestBtn');
const refreshChatBtn = document.getElementById('refreshChatBtn');
const graphCanvas = document.getElementById('graphCanvas');
const ctx = graphCanvas.getContext('2d');
const pendingBtn = document.getElementById('pendingBtn');
const serverInfo = document.getElementById('serverInfo');
const serverRestartBtn = document.getElementById('serverRestartBtn');
const serverStopBtn = document.getElementById('serverStopBtn');
const showLogBtn = document.getElementById('showLogBtn');
const miniLog = document.getElementById('miniLog');
const resetGraphBtn = document.getElementById('resetGraphBtn');

let currentChatId = null;
let sessionGraph = { nodes: {}, edges: {} };
let globalGraph = { nodes: {}, edges: {} };
let lastInboxTs = 0;
let autoScroll = true;
const chatState = {};
const chatCache = {};
const logLines = [];

function isNearBottom() {
  const threshold = 48;
  return (chatView.scrollHeight - chatView.scrollTop - chatView.clientHeight) < threshold;
}

function setStatus(text) {
  statusEl.textContent = text;
  addLog(text);
}

function addLog(text) {
  if (!miniLog) return;
  const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  logLines.push(`[${ts}] ${text}`);
  while (logLines.length > 50) logLines.shift();
  miniLog.textContent = logLines.join('\n');
}

async function apiGet(path) {
  const res = await fetch(path, { cache: 'no-store' });
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? 'Пустой ответ сервера' : `HTTP ${res.status}`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Невалидный ответ: ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? 'Пустой ответ сервера' : `HTTP ${res.status}`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Невалидный ответ: ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function formatUptime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}ч ${m}м ${r}с`;
  if (m > 0) return `${m}м ${r}с`;
  return `${r}с`;
}

async function refreshServerStatus() {
  if (!serverInfo) return;
  try {
    const data = await apiGet('/api/status');
    const up = formatUptime(data.uptime_sec || 0);
    const auto = autoScroll ? 'автоскролл: вкл' : 'автоскролл: пауза';
    const pid = data.pid ? ` • pid ${data.pid}` : '';
    serverInfo.textContent = `Сервер: онлайн • аптайм ${up} • автообновление 3с • ${auto}${pid}`;
  } catch (e) {
    serverInfo.textContent = 'Сервер: нет связи';
  }
}

async function restartServer() {
  try {
    await apiPost('/api/control/restart');
    setStatus('Перезапуск сервера…');
    if (serverInfo) serverInfo.textContent = 'Сервер: перезапуск…';
    setTimeout(() => location.reload(), 1200);
  } catch (e) {
    setStatus('Не удалось перезапустить сервер');
  }
}

async function shutdownServer() {
  try {
    await apiPost('/api/control/shutdown');
    setStatus('Сервер остановлен');
    if (serverInfo) serverInfo.textContent = 'Сервер: остановлен';
  } catch (e) {
    setStatus('Не удалось остановить сервер');
  }
}

function renderChat(messages) {
  const prevScrollTop = chatView.scrollTop;
  const prevScrollHeight = chatView.scrollHeight;
  const shouldStickToBottom = autoScroll || isNearBottom();
  chatView.innerHTML = '';
  for (const msg of messages) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${msg.role || ''}`;
    const header = document.createElement('div');
    header.className = 'msg-header';
    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = (msg.role || 'assistant').toUpperCase();
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-btn';
    copyBtn.textContent = 'Копировать';
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(msg.content || '');
        setStatus('Скопировано');
      } catch (e) {
        setStatus('Не удалось скопировать');
      }
    };
    actions.appendChild(copyBtn);
    header.appendChild(role);
    header.appendChild(actions);
    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = msg.content;
    wrap.appendChild(header);
    wrap.appendChild(text);
    chatView.appendChild(wrap);
  }
  if (shouldStickToBottom) {
    chatView.scrollTop = chatView.scrollHeight;
  } else {
    const delta = chatView.scrollHeight - prevScrollHeight;
    chatView.scrollTop = prevScrollTop + delta;
  }
}

function setChatCache(id, messages) {
  chatCache[id] = messages || [];
  const state = getChatState(id);
  state.lastCount = (messages || []).length;
}

function formatChatDate(id) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(id || '');
  if (!m) return id;
  const dt = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6])
  );
  try {
    return dt.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return id;
  }
}

function sourceBadge(source) {
  const badge = document.createElement('span');
  badge.className = 'source-badge';
  const s = (source || '').toLowerCase();
  let label = source || 'Local';
  if (s.includes('chatgpt')) label = 'GPT';
  if (s.includes('grok')) label = 'G';
  if (s.includes('qwen')) label = 'Q';
  if (s.includes('gemini')) label = 'Ge';
  if (s.includes('perplexity')) label = 'P';
  if (s.includes('deepseek')) label = 'D';
  if (s.includes('local')) label = 'L';
  badge.textContent = label;
  badge.dataset.source = source || 'Local';
  return badge;
}

function renderChatsList(chats) {
  chatList.innerHTML = '';
  for (const entry of chats) {
    const id = typeof entry === 'string' ? entry : entry.id;
    const title = typeof entry === 'string' ? '' : (entry.title || '');
    const preview = typeof entry === 'string' ? '' : (entry.preview || '');
    const sources = typeof entry === 'string' ? [] : (entry.sources || []);
    const row = document.createElement('div');
    row.className = 'chat-item' + (id === currentChatId ? ' active' : '');
    row.dataset.chatId = id;
    row.onclick = () => loadChat(id, { force: true });

    const top = document.createElement('div');
    top.className = 'chat-top';
    const date = document.createElement('div');
    date.className = 'chat-date';
    date.textContent = formatChatDate(id);
    const icons = document.createElement('div');
    icons.className = 'chat-icons';
    sources.forEach((s) => icons.appendChild(sourceBadge(s)));
    top.appendChild(date);
    top.appendChild(icons);

    const titleEl = document.createElement('div');
    titleEl.className = 'chat-title';
    titleEl.textContent = title || 'Новый чат';
    const previewEl = document.createElement('div');
    previewEl.className = 'chat-preview';
    previewEl.textContent = preview;

    row.appendChild(top);
    row.appendChild(titleEl);
    if (preview) row.appendChild(previewEl);
    chatList.appendChild(row);
  }
}

function getChatState(id) {
  if (!chatState[id]) {
    chatState[id] = { lastCount: 0, pending: 0 };
  }
  return chatState[id];
}

function setPending(count) {
  if (!pendingBtn) return;
  if (count > 0) {
    pendingBtn.textContent = `Новые сообщения: ${count} — обновить`;
    pendingBtn.classList.remove('hidden');
  } else {
    pendingBtn.classList.add('hidden');
  }
}

async function loadChat(id, opts) {
  const options = opts || {};
  let data;
  try {
    data = await apiGet(`/api/chat/${id}`);
  } catch (e) {
    setStatus(`Ошибка загрузки чата: ${e.message || e}`);
    return;
  }
  if (data && data.error) {
    setStatus(`Чат не найден: ${id}`);
    return;
  }
  currentChatId = id;
  const messages = data.messages || [];
  const cached = chatCache[id] || [];
  const effectiveMessages = messages.length < cached.length ? cached : messages;
  const state = getChatState(id);
  const newCount = effectiveMessages.length - state.lastCount;
  if (!options.force && !autoScroll && !isNearBottom()) {
    if (newCount > 0) {
      state.pending = newCount;
      setPending(newCount);
      setStatus(`Новые сообщения: ${newCount}`);
      return;
    }
    if (newCount === 0) {
      return;
    }
  }
  state.pending = 0;
  state.lastCount = effectiveMessages.length;
  setPending(0);
  setChatCache(id, effectiveMessages);
  renderChat(effectiveMessages);
  try {
    await apiPost('/api/bridge/target/set', { chat_id: currentChatId });
  } catch (e) {
    // ignore
  }
  await refreshChats();
  sessionGraph = data.session_graph || sessionGraph;
  globalGraph = data.global_graph || globalGraph;
  drawGraph();
  setStatus(`Открыт чат ${id} • сообщений: ${effectiveMessages.length}`);
}

async function refreshChats() {
  try {
    const data = await apiGet('/api/chats');
    renderChatsList(data.chats || []);
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}

async function refreshModels() {
  try {
    const data = await apiGet('/api/models');
    modelSelect.innerHTML = '';
    (data.models || []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
    if (data.last) modelSelect.value = data.last;
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}

async function refreshSources() {
  try {
    const data = await apiGet('/api/sources');
    sourceSelect.innerHTML = '';
    (data.sources || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sourceSelect.appendChild(opt);
    });
    if (data.last) sourceSelect.value = data.last;
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}

async function newChat() {
  const data = await apiPost('/api/chat/new');
  currentChatId = data.id;
  setChatCache(currentChatId, []);
  renderChat([]);
  chatState[currentChatId] = { lastCount: 0, pending: 0 };
  await apiPost('/api/bridge/target/set', { chat_id: currentChatId });
  await refreshChats();
}

async function sendMessage() {
  const text = promptInput.value.trim();
  if (!text || !currentChatId) return;
  promptInput.value = '';
  const optimistic = (chatCache[currentChatId] || []).slice();
  optimistic.push({ role: 'user', content: text });
  setChatCache(currentChatId, optimistic);
  renderChat(optimistic);
  setStatus('Запрос...');
  const model = modelSelect.value;
  const source = sourceSelect.value || 'Local (Ollama)';
  try {
    await apiPost('/api/models/last', { name: model });
    await apiPost('/api/sources/last', { name: source });
    const res = await apiPost('/api/chat/send', {
      chat_id: currentChatId,
      text,
      model,
      source,
      enqueue: source !== 'Local (Ollama)'
    });
    if (res && res.chat && res.chat.messages) {
      setChatCache(currentChatId, res.chat.messages);
      renderChat(res.chat.messages || []);
    }
    sessionGraph = res.session_graph || sessionGraph;
    globalGraph = res.global_graph || globalGraph;
    drawGraph();
    setStatus('Готово');
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}

async function addModel() {
  const name = modelInput.value.trim();
  if (!name) return;
  await apiPost('/api/models/add', { name });
  modelInput.value = '';
  await refreshModels();
}

async function addSource() {
  const name = sourceInput.value.trim();
  if (!name) return;
  await apiPost('/api/sources/add', { name });
  sourceInput.value = '';
  await refreshSources();
}

async function addBridgeResponse() {
  const source = sourceSelect.value || 'Bridge';
  const text = prompt('Вставьте ответ от ' + source + ':');
  if (!text || !currentChatId) return;
  try {
    const res = await apiPost('/api/bridge/ingest', { chat_id: currentChatId, source, text });
    if (res && res.chat && res.chat.messages) {
      setChatCache(currentChatId, res.chat.messages);
      renderChat(res.chat.messages || []);
    }
    sessionGraph = res.session_graph || sessionGraph;
    globalGraph = res.global_graph || globalGraph;
    drawGraph();
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}
function drawGraph() {
  const w = graphCanvas.width;
  const h = graphCanvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0f1218';
  ctx.fillRect(0, 0, w, h);

  const merged = mergeGraphs(globalGraph, sessionGraph);
  const nodes = Object.entries(merged.nodes || {}).sort((a, b) => b[1] - a[1]).slice(0, 16);
  if (nodes.length === 0) return;

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w, h) / 2 - 30;
  const positions = {};

  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    positions[n[0]] = {
      x: centerX + Math.cos(angle) * radius * 0.8,
      y: centerY + Math.sin(angle) * radius * 0.8
    };
  });

  // edges
  for (const [key, weight] of Object.entries(merged.edges || {})) {
    const [a, b] = key.split('|');
    if (!positions[a] || !positions[b]) continue;
    ctx.strokeStyle = `rgba(0, 200, 140, ${Math.min(0.6, 0.1 + weight * 0.05)})`;
    ctx.beginPath();
    ctx.moveTo(positions[a].x, positions[a].y);
    ctx.lineTo(positions[b].x, positions[b].y);
    ctx.stroke();
  }

  const sessionSet = new Set(Object.keys(sessionGraph.nodes || {}));
  nodes.forEach(([name, weight]) => {
    const pos = positions[name];
    const size = Math.min(22, 6 + weight);
    ctx.fillStyle = sessionSet.has(name) ? '#ffd166' : '#5dd3ff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e6e6e6';
    ctx.font = '11px sans-serif';
    ctx.fillText(name.slice(0, 12), pos.x - size, pos.y - size - 4);
  });
}

async function checkQueue() {
  try {
    const data = await apiGet('/api/bridge/outbox/count');
    setStatus(`Очередь: ${data.count ?? 0}`);
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}

async function testQueue() {
  if (!currentChatId) return;
  const source = sourceSelect.value || 'Grok';
  try {
    await apiPost('/api/bridge/outbox/enqueue', { chat_id: currentChatId, source, text: 'TEST_QUEUE' });
    await checkQueue();
  } catch (e) {
    setStatus('Нет связи с сервером');
  }
}

function mergeGraphs(a, b) {
  const nodes = { ...(a.nodes || {}) };
  const edges = { ...(a.edges || {}) };
  for (const [k, v] of Object.entries(b.nodes || {})) nodes[k] = (nodes[k] || 0) + v;
  for (const [k, v] of Object.entries(b.edges || {})) edges[k] = (edges[k] || 0) + v;
  return { nodes, edges };
}

async function resetGraph() {
  try {
    await apiPost('/api/graph/reset');
    globalGraph = { nodes: {}, edges: {} };
    sessionGraph = { nodes: {}, edges: {} };
    drawGraph();
    setStatus('Граф сброшен');
  } catch (e) {
    setStatus('Не удалось сбросить граф');
  }
}

newChatBtn.onclick = newChat;
refreshModelsBtn.onclick = refreshModels;
addModelBtn.onclick = addModel;
refreshSourcesBtn.onclick = refreshSources;
addSourceBtn.onclick = addSource;
sendBtn.onclick = sendMessage;
addBridgeBtn.onclick = addBridgeResponse;
queueCheckBtn.onclick = checkQueue;
queueTestBtn.onclick = testQueue;
refreshChatBtn.onclick = async () => {
  if (currentChatId) await loadChat(currentChatId, { force: true });
};
if (serverRestartBtn) serverRestartBtn.onclick = restartServer;
if (serverStopBtn) serverStopBtn.onclick = shutdownServer;
if (resetGraphBtn) resetGraphBtn.onclick = resetGraph;

window.addEventListener('load', async () => {
  await refreshModels();
  await refreshSources();
  await refreshChats();
  if (!currentChatId) await newChat();
  setStatus('Готово (v2)');
  await refreshServerStatus();
});

chatView.addEventListener('scroll', () => {
  autoScroll = isNearBottom();
  if (autoScroll && currentChatId) {
    const state = getChatState(currentChatId);
    if (state.pending > 0) {
      loadChat(currentChatId, { force: true });
    }
  }
});

chatList.addEventListener('click', (e) => {
  const item = e.target.closest('.chat-item');
  if (!item) return;
  const id = item.dataset.chatId;
  if (!id) return;
  setStatus(`Открываю чат ${id}`);
  loadChat(id, { force: true });
});

if (pendingBtn) {
  pendingBtn.onclick = async () => {
    if (currentChatId) await loadChat(currentChatId, { force: true });
  };
}

if (showLogBtn && miniLog) {
  showLogBtn.onclick = () => {
    miniLog.classList.toggle('hidden');
  };
}

setInterval(async () => {
  if (currentChatId) {
    await loadChat(currentChatId, { force: false });
  }
}, 3000);

setInterval(async () => {
  await refreshServerStatus();
}, 3000);

setInterval(async () => {
  const data = await apiGet('/api/bridge/inbox/last');
  const last = data.last;
  if (!last) return;
  if (last.ts && last.ts > lastInboxTs) {
    lastInboxTs = last.ts;
    if (last.chat_id && last.chat_id !== currentChatId) {
      await loadChat(last.chat_id);
      setStatus(`Переключено на чат ${last.chat_id}`);
    }
  }
}, 3000);
