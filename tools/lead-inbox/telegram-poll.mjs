import { appendMessage } from "./lib/store.mjs";
import { loadState, saveState } from "./lib/state.mjs";
import { tgGetUpdates, tgSendMessage } from "./lib/telegram.mjs";

const token = process.env.TG_BOT_TOKEN;
if (!token) {
  // eslint-disable-next-line no-console
  console.error("Missing env: TG_BOT_TOKEN");
  process.exit(1);
}

const autoReply = (process.env.AUTO_REPLY ?? "").trim();
const pollTimeoutSec = Number(process.env.TG_POLL_TIMEOUT_SEC ?? "15");

const state = await loadState();

// eslint-disable-next-line no-console
console.log("Telegram polling started.");

while (true) {
  try {
    const updates = await tgGetUpdates(token, { offset: state.offset, timeoutSec: pollTimeoutSec });
    if (updates.length) {
      for (const update of updates) {
        state.offset = Math.max(state.offset, Number(update.update_id ?? 0) + 1);
        const msg = update.message ?? update.edited_message;
        if (!msg) continue;

        const chatId = msg.chat?.id;
        const username = msg.from?.username ?? null;
        const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || null;
        const text = msg.text ?? msg.caption ?? null;

        await appendMessage({
          ts: new Date().toISOString(),
          platform: "telegram",
          chat_id: chatId,
          username,
          name,
          text,
          message_id: msg.message_id ?? null,
        });

        if (autoReply && chatId != null) {
          const key = String(chatId);
          if (!state.autoReplySent.has(key)) {
            await tgSendMessage(token, chatId, autoReply);
            state.autoReplySent.add(key);
          }
        }
      }
      await saveState(state);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(String(err?.stack ?? err));
    await sleep(1500);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
