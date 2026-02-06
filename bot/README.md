# Local AI Bridge (MVP)

Минимальный локальный мост: браузерное расширение отправляет выделенный текст в Ollama через WebSocket и показывает ответ.

## Что нужно
- Запущенный Ollama на `127.0.0.1:11434`
- Python 3
- Пакет `websockets`

## Установка
1. Установить зависимость:
   `python3 -m pip install websockets`
2. Запустить мост:
   `python3 bridge.py`
3. Открыть Chrome/Brave → `chrome://extensions` → включить `Developer mode` → `Load unpacked` → выбрать папку `bot`.

## Использование
- На поддерживаемых сайтах выделите текст и нажмите `Ctrl+Shift+Y`.
- Ответ появится в оверлее справа внизу.

## Настройка модели
В файле `bridge.py` измените `MODEL` на название вашей модели Ollama.
