// WebSocket disabled: using HTTP bridge to local web UI
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "prompt") return;
  console.log("[Local AI] prompt received (WebSocket disabled)");
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;
  // Try to start local services via native host (if installed)
  try {
    chrome.runtime.sendNativeMessage(
      "com.localai.launcher",
      { action: "start" },
      () => {
        // ignore errors here; user may not have native host installed yet
      }
    );
  } catch (e) {
    // ignore
  }
  chrome.storage.local.get(["bridgeUiVisible"], (res) => {
    const visible = !!res.bridgeUiVisible;
    const next = !visible;
    chrome.storage.local.set({ bridgeUiVisible: next }, () => {
      chrome.tabs.sendMessage(tab.id, { type: "bridge-ui-toggle", visible: next }, () => {
        // Ignore if content script isn't available on this tab
        void chrome.runtime.lastError;
      });
    });
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "open-local-ui") return;
  const url = "http://127.0.0.1:5050/";
  chrome.tabs.query({ url: url + "*" }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      chrome.tabs.create({ url });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "native-start") return;
  chrome.runtime.sendNativeMessage(
    "com.localai.launcher",
    { action: "start" },
    (resp) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ ok: true, data: resp || {} });
      }
    }
  );
  return true;
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;
  const bases = ["http://127.0.0.1:5050", "http://localhost:5050"];
  const fetchWithFallback = async (path, options) => {
    let lastErr = null;
    for (const base of bases) {
      try {
        const res = await fetch(base + path, options);
        return res;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("fetch failed");
  };
  const toggleBridgeUi = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) {
        sendResponse({ ok: false, error: "no active tab" });
        return;
      }
      chrome.storage.local.get(["bridgeUiVisible"], (res) => {
        const visible = !!res.bridgeUiVisible;
        const next = !visible;
        chrome.storage.local.set({ bridgeUiVisible: next }, () => {
          chrome.tabs.sendMessage(tab.id, { type: "bridge-ui-toggle", visible: next }, () => {
            void chrome.runtime.lastError;
            sendResponse({ ok: true, visible: next });
          });
        });
      });
    });
  };
  if (msg.type === "bridge-ingest") {
    fetchWithFallback("/api/bridge/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg.payload || {})
    })
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "bridge-ui-toggle") {
    toggleBridgeUi();
    return true;
  }
  if (msg.type === "native-stop") {
    chrome.runtime.sendNativeMessage(
      "com.localai.launcher",
      { action: "stop" },
      (resp) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, data: resp || {} });
        }
      }
    );
    return true;
  }
  if (msg.type === "native-restart") {
    chrome.runtime.sendNativeMessage(
      "com.localai.launcher",
      { action: "restart" },
      (resp) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, data: resp || {} });
        }
      }
    );
    return true;
  }
  if (msg.type === "git-snapshot") {
    chrome.runtime.sendNativeMessage(
      "com.localai.launcher",
      { action: "git_snapshot" },
      (resp) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, data: resp || {} });
        }
      }
    );
    return true;
  }
  if (msg.type === "git-tags") {
    chrome.runtime.sendNativeMessage(
      "com.localai.launcher",
      { action: "git_tags" },
      (resp) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, data: resp || {} });
        }
      }
    );
    return true;
  }
  if (msg.type === "git-rollback") {
    chrome.runtime.sendNativeMessage(
      "com.localai.launcher",
      { action: "git_rollback", tag: msg.tag },
      (resp) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, data: resp || {} });
        }
      }
    );
    return true;
  }
  if (msg.type === "server-status") {
    fetchWithFallback("/api/status")
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "server-restart") {
    fetchWithFallback("/api/control/restart", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "server-stop") {
    fetchWithFallback("/api/control/shutdown", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "outbox-next") {
    const source = encodeURIComponent(msg.source || "");
    fetchWithFallback("/api/bridge/outbox/next?source=" + source)
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "outbox-count") {
    fetchWithFallback("/api/bridge/outbox/count")
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});
