# Lead Inbox (local)

Local “inbox” to collect incoming requests from channels you control (start with Telegram).  
No scraping, no unsolicited mass messaging — only opt‑in inbound leads.

## No bots? Use clipboard capture (Avito/VK/TG chats)

If you can’t or don’t want to connect platform APIs right now, you can still centralize requests:

1) Copy a client message in Avito/VK/any chat
2) Run:

```bash
node tools/lead-inbox/capture-clipboard.mjs --source avito
```

This appends an item into `tools/lead-inbox/data/inbox.jsonl`.

### Fast replies (templates → clipboard)

```bash
node tools/lead-inbox/copy-template.mjs list
node tools/lead-inbox/copy-template.mjs copy intro
```

Edit templates in `tools/lead-inbox/templates.json`.

## Telegram (polling)

1) Create a bot in Telegram via **@BotFather** and copy the token.
2) From repo root:

```bash
node tools/lead-inbox/telegram-poll.mjs
```

Environment variables:

- `TG_BOT_TOKEN` (required) — bot token from BotFather
- `AUTO_REPLY` (optional) — if set, sends one auto‑reply per chat (first message only)

Example:

```bash
export TG_BOT_TOKEN="123:abc"
export AUTO_REPLY="Привет! Пришлите ссылку на вакансию + ваш опыт (3–7 пунктов). Сделаю резюме сегодня. Цена 1000₽."
node tools/lead-inbox/telegram-poll.mjs
```

Data files:

- `tools/lead-inbox/data/inbox.jsonl` — append-only events
- `tools/lead-inbox/data/state.json` — polling offset + auto-reply sent set

## View

```bash
node tools/lead-inbox/inbox-view.mjs
```

Then open `http://127.0.0.1:8787/`.

## Job Digest panel (opt‑in)

Inside the UI you can:

- save candidate profiles
- paste vacancies (manual input)
- generate a daily digest text

This keeps the workflow ToS‑friendly (no scraping, no unsolicited outreach).

## Quick report (CLI)

```bash
node tools/lead-inbox/report.mjs
```
