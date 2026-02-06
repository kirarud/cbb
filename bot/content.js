let overlay = null;
let overlayText = null;
let actionBtn = null;
let bridgeBtn = null;
let trainInputBtn = null;
let trainSendBtn = null;
let autoSendBtn = null;
let controlsWrap = null;
let statusBadge = null;
let openUiBtn = null;
let queueBadge = null;
let showSelectorsBtn = null;
let resetSelectorsBtn = null;
let trainAnswerBtn = null;
let autoAnswerBtn = null;
let showAnswerBtn = null;
let sendAnswerBtn = null;
let useAnswerABtn = null;
let useAnswerBBtn = null;
let lastPointerEl = null;
let pendingCount = 0;
let lastAssistantSnapshot = "";
let pendingSince = 0;
let pendingTimer = null;
let lastSeenText = "";
let lastSeenAt = 0;
const RESPONSE_STABLE_MS = 2000;
const RESPONSE_MAX_WAIT_MS = 25000;
let bridgeOn = false;
let autoSendOn = false;
let autoReceiveOn = false;
let lastCaptured = "";
let trainingMode = null;
let selectorsCache = { input: null, send: null, answer: null };
let settingsLoaded = false;
let contextAlive = true;
let lastSentKey = "";
let lastSentAt = 0;
let assistantDirty = false;

function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.right = "16px";
  overlay.style.top = "16px";
  overlay.style.zIndex = "999999";
  overlay.style.maxWidth = "420px";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.color = "#fff";
  overlay.style.padding = "12px 14px";
  overlay.style.borderRadius = "10px";
  overlay.style.font = "12px/1.4 monospace";
  overlay.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
  overlay.style.display = "none";
  overlay.style.pointerEvents = "none";

  overlayText = document.createElement("div");
  overlay.appendChild(overlayText);

  const hint = document.createElement("div");
  hint.style.marginTop = "8px";
  hint.style.opacity = "0.7";
  hint.textContent = "Ctrl+Shift+L: отправить выделенный текст в локального бота";
  overlay.appendChild(hint);

  document.body.appendChild(overlay);
}

function showOverlay(text) {
  ensureOverlay();
  overlayText.textContent = text;
  overlay.style.display = "block";
  clearTimeout(overlay._hideTimer);
  overlay._hideTimer = setTimeout(() => {
    overlay.style.display = "none";
  }, 5000);
}

console.log("[Local AI] content script loaded");
// Show a quick ready hint on page load
setTimeout(() => {
  showOverlay("Local AI готов. Ctrl+Shift+L отправляет выделенный текст.");
}, 500);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "response") {
    showOverlay(msg.text);
  }
});

function sendSelection() {
  const selection = window.getSelection();
  const text = selection ? selection.toString().trim() : "";
  if (!text) {
    showOverlay("Сначала выделите текст, затем нажмите Ctrl+Shift+L");
    return;
  }

  chrome.runtime.sendMessage({
    type: "prompt",
    text,
    url: location.href
  });

  showOverlay("Отправлено в локального бота...");
}

function sourceFromHost() {
  const host = location.host;
  if (host.includes("chatgpt.com")) return "ChatGPT";
  if (host.includes("grok.com")) return "Grok";
  if (host.includes("chat.qwen.ai")) return "Qwen";
  if (host.includes("gemini.google.com")) return "Gemini";
  if (host.includes("perplexity.ai")) return "Perplexity";
  if (host.includes("deepseek.com")) return "DeepSeek";
  return host;
}

async function sendToBridge(text) {
  if (!contextAlive || !chrome.runtime?.id) return;
  const key = `${text.slice(0, 200)}::${text.length}`;
  if (key === lastSentKey && Date.now() - lastSentAt < 30000) {
    return;
  }
  lastSentKey = key;
  lastSentAt = Date.now();
  const payload = { text, source: sourceFromHost() };
  try {
    chrome.runtime.sendMessage({ type: "bridge-ingest", payload }, (res) => {
      if (chrome.runtime.lastError) return;
      if (!res || !res.ok) {
        console.warn("[Local AI] bridge ingest failed", res && res.error);
        setStatus("Ошибка отправки в локальный чат");
      } else {
        setStatus("Ответ отправлен в локальный чат");
      }
    });
  } catch (e) {
    contextAlive = false;
  }
}

function ensureBridgeButton() {
  if (bridgeBtn) return;
  ensureControlsWrap();
  bridgeBtn = document.createElement("button");
  bridgeBtn.textContent = "Мост: ВЫКЛ";
  applyBtnStyle(bridgeBtn);
  bridgeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    bridgeOn = !bridgeOn;
    bridgeBtn.textContent = bridgeOn ? "Мост: ВКЛ" : "Мост: ВЫКЛ";
    updateToggleColors();
    chrome.storage.local.set({ bridgeOn });
    if (bridgeOn) {
      // baseline to avoid sending old ответа сразу
      lastCaptured = findLatestAssistantText();
      lastAssistantSnapshot = lastCaptured;
      lastSeenText = "";
      lastSeenAt = 0;
      pendingSince = 0;
    }
    showOverlay(bridgeOn ? "Мост включен: авто‑приём ответов" : "Мост выключен");
  });
  controlsWrap.appendChild(bridgeBtn);
}

function ensureTrainingButtons() {
  if (trainInputBtn) return;
  ensureControlsWrap();

  trainInputBtn = document.createElement("button");
  trainInputBtn.textContent = "Обучить ввод";
  applyBtnStyle(trainInputBtn);
  trainInputBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    trainingMode = "input";
    setStatus("Режим обучения: кликните по полю ввода");
  });

  trainSendBtn = document.createElement("button");
  trainSendBtn.textContent = "Обучить отправку";
  applyBtnStyle(trainSendBtn);
  trainSendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    trainingMode = "send";
    setStatus("Режим обучения: кликните по кнопке отправки");
  });

  autoSendBtn = document.createElement("button");
  autoSendBtn.textContent = "Автоотпр: ВЫКЛ";
  applyBtnStyle(autoSendBtn);
  autoSendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    autoSendOn = !autoSendOn;
    autoSendBtn.textContent = autoSendOn ? "Автоотпр: ВКЛ" : "Автоотпр: ВЫКЛ";
    updateToggleColors();
    chrome.storage.local.set({ autoSendOn });
    setStatus(autoSendOn ? "Авто‑отправка включена" : "Авто‑отправка выключена");
  });

  controlsWrap.appendChild(trainInputBtn);
  controlsWrap.appendChild(trainSendBtn);
  trainAnswerBtn = document.createElement("button");
  trainAnswerBtn.textContent = "Обучить ответ";
  applyBtnStyle(trainAnswerBtn);
  trainAnswerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    trainingMode = "answer";
    setStatus("Режим обучения: кликните по последнему ответу");
  });
  controlsWrap.appendChild(trainAnswerBtn);

  autoAnswerBtn = document.createElement("button");
  autoAnswerBtn.textContent = "Авто‑поиск ответа";
  applyBtnStyle(autoAnswerBtn);
  autoAnswerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = findLatestAssistantElement();
    if (el) {
      const sel = getSelector(el);
      if (sel) {
        saveSelector("answer", sel);
        setStatus("Обучено: ответ (авто)");
        return;
      }
    }
    setStatus("Не удалось авто‑найти ответ");
  });
  controlsWrap.appendChild(autoAnswerBtn);

  showAnswerBtn = document.createElement("button");
  showAnswerBtn.textContent = "Показать ответ";
  applyBtnStyle(showAnswerBtn);
  showAnswerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = findLatestAssistantText();
    if (text) {
      setStatus(`Ответ(фрагмент): ${text.slice(0, 200)}${text.length > 200 ? "…" : ""}`);
    } else {
      setStatus("Ответ не найден");
    }
  });
  controlsWrap.appendChild(showAnswerBtn);

  sendAnswerBtn = document.createElement("button");
  sendAnswerBtn.textContent = "Отправить ответ";
  applyBtnStyle(sendAnswerBtn);
  sendAnswerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = findLatestAssistantText();
    if (text) {
      sendToBridge(text);
      setStatus("Ответ отправлен вручную");
    } else {
      setStatus("Ответ не найден");
    }
  });
  controlsWrap.appendChild(sendAnswerBtn);

  useAnswerABtn = document.createElement("button");
  useAnswerABtn.textContent = "Использовать Ответ A";
  applyBtnStyle(useAnswerABtn);
  useAnswerABtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = findAnswerByHeading("Ответ A");
    if (el) {
      const sel = getSelector(el);
      if (sel) {
        saveSelector("answer", sel);
        setStatus("Обучено: Ответ A");
        return;
      }
    }
    setStatus("Ответ A не найден");
  });
  controlsWrap.appendChild(useAnswerABtn);

  useAnswerBBtn = document.createElement("button");
  useAnswerBBtn.textContent = "Использовать Ответ B";
  applyBtnStyle(useAnswerBBtn);
  useAnswerBBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = findAnswerByHeading("Ответ B");
    if (el) {
      const sel = getSelector(el);
      if (sel) {
        saveSelector("answer", sel);
        setStatus("Обучено: Ответ B");
        return;
      }
    }
    setStatus("Ответ B не найден");
  });
  controlsWrap.appendChild(useAnswerBBtn);
  controlsWrap.appendChild(autoSendBtn);
  updateToggleColors();
}

function ensureControlsWrap() {
  if (controlsWrap) return;
  controlsWrap = document.createElement("div");
  controlsWrap.style.position = "fixed";
  controlsWrap.style.left = "16px";
  controlsWrap.style.bottom = "16px";
  controlsWrap.style.zIndex = "999999";
  controlsWrap.style.display = "none";
  controlsWrap.style.gap = "6px";
  controlsWrap.style.display = "flex";
  controlsWrap.style.flexDirection = "column";
  controlsWrap.style.background = "rgba(0,0,0,0.5)";
  controlsWrap.style.padding = "8px";
  controlsWrap.style.borderRadius = "10px";
  controlsWrap.style.border = "1px solid rgba(255,255,255,0.15)";
  controlsWrap.style.minWidth = "220px";
  controlsWrap.style.maxWidth = "260px";
  document.body.appendChild(controlsWrap);

  statusBadge = document.createElement("div");
  statusBadge.style.color = "#ddd";
  statusBadge.style.font = "12px monospace";
  statusBadge.textContent = "Готово";
  controlsWrap.appendChild(statusBadge);

  queueBadge = document.createElement("div");
  queueBadge.style.color = "#9aa3b2";
  queueBadge.style.font = "11px monospace";
  queueBadge.textContent = "Очередь: 0";
  controlsWrap.appendChild(queueBadge);

  openUiBtn = document.createElement("button");
  openUiBtn.textContent = "Открыть чат";
  applyBtnStyle(openUiBtn);
  openUiBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "open-local-ui" });
  });
  controlsWrap.appendChild(openUiBtn);

  showSelectorsBtn = document.createElement("button");
  showSelectorsBtn.textContent = "Показать селекторы";
  applyBtnStyle(showSelectorsBtn);
  showSelectorsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadSelectors((sel) => {
      setStatus(`input=${sel.input ? sel.input.slice(0, 60) : "нет"} | send=${sel.send ? sel.send.slice(0, 60) : "нет"}`);
    });
  });
  controlsWrap.appendChild(showSelectorsBtn);

  resetSelectorsBtn = document.createElement("button");
  resetSelectorsBtn.textContent = "Сбросить обучение";
  applyBtnStyle(resetSelectorsBtn);
  resetSelectorsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const host = location.host;
    chrome.storage.local.get(["bridgeSelectors"], (res) => {
      const all = res.bridgeSelectors || {};
      delete all[host];
      chrome.storage.local.set({ bridgeSelectors: all }, () => {
        updateTrainingStatus();
        setStatus("Обучение сброшено");
      });
    });
  });
  controlsWrap.appendChild(resetSelectorsBtn);
}

function applyBtnStyle(btn) {
  btn.style.padding = "6px 10px";
  btn.style.borderRadius = "8px";
  btn.style.border = "1px solid rgba(255,255,255,0.2)";
  btn.style.background = "rgba(0,0,0,0.85)";
  btn.style.color = "#fff";
  btn.style.font = "12px monospace";
  btn.style.cursor = "pointer";
}

function updateToggleColors() {
  if (bridgeBtn) {
    bridgeBtn.style.borderColor = bridgeOn ? "#3ad37a" : "#ef4444";
    bridgeBtn.style.background = bridgeOn ? "rgba(58,211,122,0.15)" : "rgba(239,68,68,0.15)";
  }
  if (autoSendBtn) {
    autoSendBtn.style.borderColor = autoSendOn ? "#3ad37a" : "#ef4444";
    autoSendBtn.style.background = autoSendOn ? "rgba(58,211,122,0.15)" : "rgba(239,68,68,0.15)";
  }
}

function setStatus(text) {
  if (!statusBadge) ensureControlsWrap();
  statusBadge.textContent = text;
  showOverlay(text);
}

function updateTrainingStatus() {
  loadSelectors((sel) => {
    const hasInput = !!sel.input;
    const hasSend = !!sel.send;
    const hasAnswer = !!sel.answer;
    if (trainInputBtn) {
      trainInputBtn.style.borderColor = hasInput ? "#3ad37a" : "rgba(255,255,255,0.2)";
    }
    if (trainSendBtn) {
      trainSendBtn.style.borderColor = hasSend ? "#3ad37a" : "rgba(255,255,255,0.2)";
    }
    if (trainAnswerBtn) {
      trainAnswerBtn.style.borderColor = hasAnswer ? "#3ad37a" : "rgba(255,255,255,0.2)";
    }
    if (autoAnswerBtn) {
      autoAnswerBtn.style.borderColor = hasAnswer ? "#3ad37a" : "rgba(255,255,255,0.2)";
    }
    if (statusBadge) {
      if (hasInput && hasSend && hasAnswer) {
        statusBadge.style.color = "#3ad37a";
        statusBadge.textContent = "Обучено: ввод + отправка + ответ";
      } else if (hasInput || hasSend) {
        statusBadge.style.color = "#ffd166";
        statusBadge.textContent = "Частично обучено";
      } else {
        statusBadge.style.color = "#ddd";
        statusBadge.textContent = "Не обучено";
      }
    }
  });
}

function getSelector(el) {
  if (!el) return "";
  if (el.id) return `#${CSS.escape(el.id)}`;
  const testid = el.getAttribute && el.getAttribute("data-testid");
  if (testid) return `[data-testid=\"${testid}\"]`;
  const msgRole = el.getAttribute && el.getAttribute("data-message-author-role");
  if (msgRole) return `[data-message-author-role=\"${msgRole}\"]`;
  const aria = el.getAttribute && el.getAttribute("aria-label");
  if (aria) return `[aria-label=\"${aria}\"]`;
  const name = el.getAttribute && el.getAttribute("name");
  if (name) return `${el.tagName.toLowerCase()}[name=\"${name}\"]`;
  // fallback: tag + nth-of-type path (max 4 levels)
  let path = el.tagName.toLowerCase();
  let parent = el.parentElement;
  let depth = 0;
  while (parent && depth < 4) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el) + 1;
      path = `${path}:nth-of-type(${idx})`;
    }
    el = parent;
    parent = parent.parentElement;
    path = `${el.tagName.toLowerCase()} > ${path}`;
    depth++;
  }
  return path;
}

function getStableSelector(el) {
  let cur = el;
  for (let i = 0; i < 6 && cur; i++) {
    if (cur.id) return `#${CSS.escape(cur.id)}`;
    const testid = cur.getAttribute && cur.getAttribute("data-testid");
    if (testid) return `[data-testid=\"${testid}\"]`;
    const msgRole = cur.getAttribute && cur.getAttribute("data-message-author-role");
    if (msgRole) return `[data-message-author-role=\"${msgRole}\"]`;
    const aria = cur.getAttribute && cur.getAttribute("aria-label");
    if (aria) return `[aria-label=\"${aria}\"]`;
    cur = cur.parentElement;
  }
  return getSelector(el);
}

function saveSelector(kind, selector) {
  const host = location.host;
  chrome.storage.local.get(["bridgeSelectors"], (res) => {
    const all = res.bridgeSelectors || {};
    const entry = all[host] || {};
    entry[kind] = selector;
    all[host] = entry;
    chrome.storage.local.set({ bridgeSelectors: all });
    selectorsCache = { ...selectorsCache, ...entry };
    updateTrainingStatus();
  });
}

function loadSelectors(cb) {
  const host = location.host;
  chrome.storage.local.get(["bridgeSelectors"], (res) => {
    const all = res.bridgeSelectors || {};
    const entry = all[host] || {};
    selectorsCache = { ...selectorsCache, ...entry };
    cb(entry);
  });
}

function getSelectorsSync() {
  return selectorsCache || {};
}

function setInputValue(el, text) {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea" || tag === "input") {
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  const role = el.getAttribute && el.getAttribute("role");
  if (el.isContentEditable || role === "textbox") {
    el.focus();
    el.textContent = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  return false;
}

function tryAutoSend(item) {
  const sel = getSelectorsSync();
  let inputEl = sel.input ? document.querySelector(sel.input) : null;
  let sendEl = sel.send ? document.querySelector(sel.send) : null;
    if (!sendEl) {
      // heuristic fallback for send button
      const candidates = Array.from(document.querySelectorAll("button, [role=\"button\"]"));
      sendEl = candidates.find((b) => {
        const label = (b.getAttribute("aria-label") || b.textContent || "").toLowerCase();
        return label.includes("send") || label.includes("отправ") || label.includes("submit") || label.includes("↑");
      }) || null;
    }
    if (!inputEl) {
      const candidates = Array.from(document.querySelectorAll("textarea, input, [contenteditable=\"true\"], [role=\"textbox\"]"));
      inputEl = candidates.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 150 && rect.height > 30;
      }) || candidates[0] || null;
    }
    if (!inputEl || !sendEl) {
      setStatus(`Не найдены элементы. input=${!!inputEl} send=${!!sendEl}`);
      return;
    }
    const ok = setInputValue(inputEl, item.text);
    if (!ok) {
      setStatus("Не удалось вставить текст в поле ввода");
      return;
    }
    setStatus("Текст вставлен, пытаюсь отправить...");
    // snapshot current assistant text to avoid sending previous message
    lastAssistantSnapshot = findLatestAssistantText();
    pendingCount += 1;
    pendingSince = Date.now();
    setTimeout(() => {
      try {
        sendEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        sendEl.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        sendEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      } catch (e) {
        // ignore
      }
      // fallback: Enter
      try {
        inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
      } catch (e) {
        // ignore
      }
      setStatus("Команда отправки выполнена");
    }, 250);
}

async function pollOutbox() {
  if (!bridgeOn || !autoSendOn) return;
  const source = sourceFromHost();
  if (!contextAlive || !chrome.runtime?.id) return;
  try {
    chrome.runtime.sendMessage({ type: "outbox-next", source }, (res) => {
      if (chrome.runtime.lastError) return;
      if (!res || !res.ok) {
        setStatus("Ошибка связи с локальным UI");
        return;
      }
      const data = res.data;
      if (data && data.item) {
        setStatus(`Очередь → отправка в ${data.item.source}`);
        tryAutoSend(data.item);
      }
    });
  } catch (e) {
    contextAlive = false;
  }
}

async function pollQueueCount() {
  if (!bridgeOn) return;
  if (!contextAlive || !chrome.runtime?.id) return;
  try {
    chrome.runtime.sendMessage({ type: "outbox-count" }, (res) => {
      if (chrome.runtime.lastError) return;
      if (!res || !res.ok) {
        if (queueBadge) queueBadge.textContent = "Очередь: ?";
        return;
      }
      const data = res.data || {};
      if (queueBadge) queueBadge.textContent = `Очередь: ${data.count ?? 0}`;
    });
  } catch (e) {
    contextAlive = false;
  }
}

document.addEventListener("click", (e) => {
  if (!trainingMode) return;
  // ignore clicks on our own controls
  if (controlsWrap && controlsWrap.contains(e.target)) return;

  let el = lastPointerEl || e.target;
  if (trainingMode === "input") {
    el = e.target.closest("textarea, input, [contenteditable=\"true\"], [role=\"textbox\"]") || e.target;
  }
  if (trainingMode === "send") {
    el = e.target.closest("button, [role=\"button\"]") || e.target;
  }
  if (trainingMode === "answer") {
    el = e.target.closest("[data-message-author-role=\"assistant\"], [data-testid*=\"assistant\"], [data-testid*=\"message\"], article, .markdown, .prose, .message, .response") || e.target;
    // fallback by selection text
    const selText = (window.getSelection && window.getSelection().toString()) || "";
    if (selText && selText.length > 6) {
      const candidates = Array.from(document.querySelectorAll("[data-message-author-role=\"assistant\"], [data-testid*=\"assistant\"], [data-testid*=\"message\"], article, .markdown, .prose, .message, .response"));
      const found = candidates.find((c) => (c.textContent || "").includes(selText));
      if (found) el = found;
    }
  }
  const sel = trainingMode === "answer" ? getStableSelector(el) : getSelector(el);
  if (sel) {
    saveSelector(trainingMode, sel);
    setStatus(`Обучено: ${trainingMode === "input" ? "ввод" : trainingMode === "send" ? "отправка" : "ответ"}`);
    trainingMode = null;
  } else {
    setStatus("Не удалось определить элемент, попробуйте ещё раз");
  }
}, true);

document.addEventListener("pointerdown", (e) => {
  if (!trainingMode) return;
  lastPointerEl = e.target;
}, true);

function findLatestAssistantText() {
  const sel = getSelectorsSync();
  if (sel.answer) {
    const els = document.querySelectorAll(sel.answer);
    if (els && els.length > 0) {
      const el = els[els.length - 1];
      let text = (el.textContent || "").trim();
      if (text.length > 4000) {
        text = text.slice(-4000);
      }
      return text;
    }
  }

  const selectors = [
    '[data-message-author-role="assistant"]',
    '[data-testid*="assistant"]',
    '[data-testid*="message"]',
    'article',
    'main article',
    '.markdown',
    '.prose',
    '.message',
    '.response'
  ];
  let candidates = [];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent || "").trim();
      if (text.length > 40) {
        candidates.push(text);
      }
    });
  });
  if (candidates.length === 0) return "";
  let text = candidates[candidates.length - 1];
  if (text.length > 4000) {
    text = text.slice(-4000);
  }
  return text;
}

function findLatestAssistantElement() {
  const selectors = [
    '[data-message-author-role="assistant"]',
    '[data-testid*="assistant"]',
    '[data-testid*="message"]',
    'article',
    'main article',
    '.markdown',
    '.prose',
    '.message',
    '.response'
  ];
  let last = null;
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el.textContent || "").trim();
      if (text.length > 40) last = el;
    });
  });
  return last;
}

function findAnswerByHeading(label) {
  const headings = Array.from(document.querySelectorAll("*")).filter((el) => {
    const t = (el.textContent || "").trim();
    return t === label;
  });
  for (const h of headings) {
    // try next sibling blocks
    let el = h;
    for (let i = 0; i < 6; i++) {
      if (!el) break;
      const text = (el.textContent || "").trim();
      if (text.length > 80 && !text.includes(label)) {
        return el;
      }
      el = el.nextElementSibling;
    }
    // fallback to parent container
    if (h.parentElement) return h.parentElement;
  }
  return null;
}

function startBridgeObserver() {
  ensureBridgeButton();
  ensureTrainingButtons();
  const observer = new MutationObserver(() => {
    if (!bridgeOn || !autoReceiveOn) return;
    assistantDirty = true;
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

startBridgeObserver();
setInterval(pollOutbox, 2000);
setInterval(pollQueueCount, 2000);
setInterval(() => {
  if (!bridgeOn || !autoReceiveOn) return;
  if (!assistantDirty && Date.now() - pendingSince < RESPONSE_STABLE_MS) return;
  assistantDirty = false;
  const text = findLatestAssistantText();
  if (!text || text.length <= 40) return;
  if (text !== lastCaptured && text !== lastAssistantSnapshot) {
    if (text !== lastSeenText) {
      lastSeenText = text;
      lastSeenAt = Date.now();
      return;
    }
    if (Date.now() - lastSeenAt >= RESPONSE_STABLE_MS) {
      lastCaptured = text;
      lastAssistantSnapshot = text;
      if (pendingCount > 0) pendingCount -= 1;
      pendingSince = 0;
      sendToBridge(text);
      showOverlay("Ответ отправлен в локальный чат");
    }
    if (pendingSince && Date.now() - pendingSince > RESPONSE_MAX_WAIT_MS) {
      lastCaptured = text;
      lastAssistantSnapshot = text;
      if (pendingCount > 0) pendingCount -= 1;
      pendingSince = 0;
      sendToBridge(text);
      showOverlay("Ответ отправлен (таймаут)");
    }
  }
}, 1000);

function setControlsVisible(visible) {
  ensureControlsWrap();
  controlsWrap.style.display = visible ? "flex" : "none";
  if (visible) updateTrainingStatus();
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "bridge-ui-toggle") return;
  setControlsVisible(!!msg.visible);
});

chrome.storage.local.get(["bridgeUiVisible"], (res) => {
  setControlsVisible(!!res.bridgeUiVisible);
});

chrome.storage.local.get(["bridgeSelectors"], (res) => {
  const all = res.bridgeSelectors || {};
  const entry = all[location.host] || {};
  selectorsCache = { ...selectorsCache, ...entry };
  updateTrainingStatus();
});

chrome.storage.local.get(["bridgeOn", "autoSendOn", "autoReceiveOn"], (res) => {
  // default to ON if not set
  bridgeOn = res.bridgeOn !== undefined ? !!res.bridgeOn : true;
  autoSendOn = res.autoSendOn !== undefined ? !!res.autoSendOn : true;
  autoReceiveOn = res.autoReceiveOn !== undefined ? !!res.autoReceiveOn : true;
  chrome.storage.local.set({ bridgeOn, autoSendOn, autoReceiveOn });
  if (bridgeBtn) bridgeBtn.textContent = bridgeOn ? "Мост: ВКЛ" : "Мост: ВЫКЛ";
  if (autoSendBtn) autoSendBtn.textContent = autoSendOn ? "Автоотпр: ВКЛ" : "Автоотпр: ВЫКЛ";
  updateToggleColors();
  settingsLoaded = true;
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") {
    e.preventDefault();
    const visible = controlsWrap && controlsWrap.style.display !== "none";
    setControlsVisible(!visible);
    chrome.storage.local.set({ bridgeUiVisible: !visible });
  }
});

function ensureActionButton() {
  if (actionBtn) return;
  actionBtn = document.createElement("button");
  actionBtn.textContent = "Local AI";
  actionBtn.style.position = "fixed";
  actionBtn.style.zIndex = "999999";
  actionBtn.style.padding = "6px 10px";
  actionBtn.style.borderRadius = "8px";
  actionBtn.style.border = "1px solid rgba(255,255,255,0.2)";
  actionBtn.style.background = "rgba(0,0,0,0.85)";
  actionBtn.style.color = "#fff";
  actionBtn.style.font = "12px monospace";
  actionBtn.style.cursor = "pointer";
  actionBtn.style.display = "none";
  actionBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendSelection();
    hideActionButton();
  });
  document.body.appendChild(actionBtn);
}

function showActionButton() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    hideActionButton();
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    hideActionButton();
    return;
  }
  ensureActionButton();
  const top = Math.max(8, rect.top - 32);
  const left = Math.max(8, rect.right - 10);
  actionBtn.style.top = `${top}px`;
  actionBtn.style.left = `${left}px`;
  actionBtn.style.display = "block";
}

function hideActionButton() {
  if (actionBtn) actionBtn.style.display = "none";
}

document.addEventListener("mouseup", () => {
  setTimeout(showActionButton, 0);
});

document.addEventListener("selectionchange", () => {
  setTimeout(showActionButton, 0);
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    sendSelection();
  }
});
