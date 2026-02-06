const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const stopBtn = document.getElementById("stopBtn");
const openUiBtn = document.getElementById("openUiBtn");
const togglePanelBtn = document.getElementById("togglePanelBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (resp) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(resp || {});
    });
  });
}

async function fetchStatusDirect() {
  const bases = ["http://127.0.0.1:5050", "http://localhost:5050"];
  for (const base of bases) {
    try {
      const res = await fetch(base + "/api/status", { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch (e) {
      // try next
    }
  }
  throw new Error("no status");
}

async function refreshStatus() {
  try {
    const data = await fetchStatusDirect();
    const up = data.uptime_sec || 0;
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);
    const uptime = h > 0 ? `${h}ч ${m}м ${s}с` : m > 0 ? `${m}м ${s}с` : `${s}с`;
    setStatus(`Сервер: онлайн • аптайм ${uptime}`);
    return;
  } catch (e) {
    const res = await send({ type: "server-status" });
    if (res.ok && res.data && res.data.uptime_sec != null) {
      const up = res.data.uptime_sec || 0;
      const h = Math.floor(up / 3600);
      const m = Math.floor((up % 3600) / 60);
      const s = Math.floor(up % 60);
      const uptime = h > 0 ? `${h}ч ${m}м ${s}с` : m > 0 ? `${m}м ${s}с` : `${s}с`;
      setStatus(`Сервер: онлайн • аптайм ${uptime}`);
      return;
    }
    setStatus("Сервер: нет связи");
  }
}

async function startServer() {
  try {
    const data = await fetchStatusDirect();
    if (data && data.ok) {
      setStatus("Сервер уже запущен");
      return;
    }
  } catch (e) {
    // not running, continue
  }
  const res = await send({ type: "native-start" });
  if (!res.ok) {
    setStatus("Не удалось запустить сервер");
    return;
  }
  setStatus("Сервер запускается…");
  setTimeout(refreshStatus, 800);
}

async function restartServer() {
  const res = await send({ type: "native-restart" });
  if (!res.ok) {
    setStatus("Не удалось перезапустить сервер");
    return;
  }
  setStatus("Перезапуск сервера…");
  setTimeout(refreshStatus, 1200);
}

async function stopServer() {
  const res = await send({ type: "native-stop" });
  if (!res.ok) {
    setStatus("Не удалось выключить сервер");
    return;
  }
  setStatus("Сервер остановлен");
}

async function openUi() {
  await send({ type: "open-local-ui" });
}

async function togglePanel() {
  await send({ type: "bridge-ui-toggle" });
}

startBtn.onclick = startServer;
restartBtn.onclick = restartServer;
stopBtn.onclick = stopServer;
openUiBtn.onclick = openUi;
togglePanelBtn.onclick = togglePanel;

refreshStatus();
setInterval(refreshStatus, 2000);
