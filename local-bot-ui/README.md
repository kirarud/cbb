# Local Bot UI (Offline)

Desktop‑клиент для локальных моделей Ollama. Работает полностью офлайн.

## Функции
- Чат и история чатов
- Выбор моделей (авто из Ollama + ручное добавление)
- Память‑граф: сессия + глобальная
- Локальное хранение данных

## Запуск
1. Убедитесь, что Ollama запущен (порт 11434).
2. Запустите приложение:

```bash
python3 /Users/kirarud/Projects/codex/local-bot-ui/app.py
```

## Данные
- История чатов: `data/chats/*.json`
- Глобальный граф: `data/global_graph.json`
- Конфиг: `data/config.json`
