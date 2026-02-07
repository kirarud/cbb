# Job Digest (opt‑in, no scraping)

Generate a personalized daily list of vacancies for a candidate **from vacancies you provide** (copy/paste or files).

This tool is designed to keep the project **legal and ToS‑friendly**:
- no scraping/crawling platforms
- no unsolicited outreach
- no collecting “bases” of personal contacts
- only opt‑in candidates + vacancies you already have access to

## Quick start (macOS)

### 1) Create candidate profile

Create a JSON file, e.g. `tools/job-digest/data/candidates/kira.json`:

```json
{
  "id": "kira",
  "name": "Кира",
  "city": "Москва",
  "role_targets": ["оператор поддержки", "менеджер по работе с клиентами"],
  "schedule": ["удаленно", "гибрид", "офис"],
  "salary_min_rub": 60000,
  "keywords_positive": ["CRM", "чат", "переписка", "Excel", "возражения"],
  "keywords_negative": ["ночные смены", "вахта", "холодные звонки"],
  "notes": "Готов(а) учиться, важно адекватное обучение/онбординг."
}
```

### 2) Add vacancy (copy/paste → clipboard)

Copy a vacancy text (and optionally its link) to clipboard, then:

```bash
node tools/job-digest/add-vacancy-from-clipboard.mjs --source avito --url "https://..."
```

### 3) Generate digest

```bash
node tools/job-digest/make-digest.mjs --candidate kira --count 10
```

It prints a ready message you can copy into TG/VK/Avito chat.

## Data

- `tools/job-digest/data/candidates/*.json`
- `tools/job-digest/data/vacancies.jsonl` (append-only)

