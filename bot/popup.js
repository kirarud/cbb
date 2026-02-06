const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const stopBtn = document.getElementById("stopBtn");
const openUiBtn = document.getElementById("openUiBtn");
const togglePanelBtn = document.getElementById("togglePanelBtn");
const snapshotBtn = document.getElementById("snapshotBtn");
const refreshTagsBtn = document.getElementById("refreshTagsBtn");
const rollbackBtn = document.getElementById("rollbackBtn");
const tagsSelect = document.getElementById("tagsSelect");
const gitLog = document.getElementById("gitLog");
const versionsToggle = document.getElementById("versionsToggle");
const gitPanel = document.getElementById("gitPanel");

function setStatus(text) {
  statusEl.textContent = text;
}

function setGitLog(text) {
  if (gitLog) gitLog.textContent = text;
}

function setVersionsOpen(open) {
  if (!gitPanel || !versionsToggle) return;
  gitPanel.classList.toggle("hidden", !open);
  versionsToggle.textContent = open ? "Версии ▾" : "Версии ▸";
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

async function refreshTags() {
  setGitLog("Загрузка тегов…");
  const res = await send({ type: "git-tags" });
  if (!res.ok) {
    setGitLog("Не удалось получить теги");
    return;
  }
  const data = res.data || {};
  if (data.status !== "ok") {
    setGitLog(data.message || "Ошибка при чтении тегов");
    return;
  }
  const tags = data.tags || [];
  tagsSelect.innerHTML = "";
  if (tags.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Тегов нет";
    tagsSelect.appendChild(opt);
    setGitLog("Тегов нет");
    return;
  }
  tags.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagsSelect.appendChild(opt);
  });
  setGitLog(`Тегов: ${tags.length}`);
}

async function snapshotToGithub() {
  setGitLog("Снимок и push в GitHub…");
  const res = await send({ type: "git-snapshot" });
  if (!res.ok) {
    setGitLog("Не удалось сделать снимок");
    return;
  }
  const data = res.data || {};
  if (data.status !== "ok") {
    setGitLog(data.message || "Ошибка снимка");
    return;
  }
  setGitLog(`Готово: ${data.tag || "tag"}`);
  await refreshTags();
}

async function rollbackToTag() {
  const tag = tagsSelect && tagsSelect.value;
  if (!tag) {
    setGitLog("Выберите тег");
    return;
  }
  setGitLog(`Откат к ${tag}…`);
  const res = await send({ type: "git-rollback", tag });
  if (!res.ok) {
    setGitLog("Не удалось откатиться");
    return;
  }
  const data = res.data || {};
  if (data.status !== "ok") {
    setGitLog(data.message || "Ошибка отката");
    return;
  }
  setGitLog(`Откат к ${tag} • backup: ${data.backup || "-"}`);
}

startBtn.onclick = startServer;
restartBtn.onclick = restartServer;
stopBtn.onclick = stopServer;
openUiBtn.onclick = openUi;
togglePanelBtn.onclick = togglePanel;
if (snapshotBtn) snapshotBtn.onclick = snapshotToGithub;
if (refreshTagsBtn) refreshTagsBtn.onclick = refreshTags;
if (rollbackBtn) rollbackBtn.onclick = rollbackToTag;
if (versionsToggle) {
  versionsToggle.onclick = () => {
    const open = gitPanel && gitPanel.classList.contains("hidden");
    setVersionsOpen(open);
  };
}

refreshStatus();
setInterval(refreshStatus, 2000);
refreshTags();
setVersionsOpen(false);
