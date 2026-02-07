# Funnel Kit (opt‑in, multi-channel)

This kit helps you run an **inbound** funnel for “resume / cover letter” services:

- Short‑form videos/posts bring traffic
- A **free template** acts as a lead magnet
- A **questionnaire** collects details (opt‑in)
- Upsell to “individual resume + cover letter”

No scraping, no mass unsolicited DMs.

## 1) Landing (questionnaire → brief to copy)

Open locally:

```bash
open tools/funnel-kit/landing/index.html
```

Deploy as a static page (Netlify/Vercel/GitHub Pages) and put the link in Avito/VK/TG bio/posts.

## 2) Hooks & scripts for shorts

```bash
node tools/funnel-kit/print-hooks.mjs
```

## 3) Free template delivery

Host your template as:
- a public Google Docs “View only” link, or
- a PDF on your static site.

Call‑to‑action idea:
- “Напиши ‘ШАБЛОН’ — скину бесплатно. Если нужен индивидуальный — сделаю за 1000₽ сегодня.”

