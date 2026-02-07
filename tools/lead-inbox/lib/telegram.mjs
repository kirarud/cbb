const baseUrl = "https://api.telegram.org";

export async function tgGetUpdates(token, { offset, timeoutSec }) {
  const url = new URL(`${baseUrl}/bot${token}/getUpdates`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("timeout", String(timeoutSec));
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Telegram getUpdates failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram getUpdates not ok: ${JSON.stringify(data)}`);
  return data.result ?? [];
}

export async function tgSendMessage(token, chatId, text) {
  const url = new URL(`${baseUrl}/bot${token}/sendMessage`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) throw new Error(`Telegram sendMessage failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram sendMessage not ok: ${JSON.stringify(data)}`);
  return data.result;
}

