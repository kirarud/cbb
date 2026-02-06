#!/usr/bin/env python3
import asyncio
import json
import urllib.request
import websockets

MODEL = "llama3.1:8b"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

async def handle(websocket):
    print("[Bridge] Client connected")
    async for message in websocket:
        try:
            data = json.loads(message)
            if data.get("type") != "prompt":
                continue

            prompt = data.get("text", "").strip()
            if not prompt:
                await websocket.send(json.dumps({"type": "response", "text": "Пустой запрос"}))
                continue

            payload = json.dumps({
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            }).encode("utf-8")

            req = urllib.request.Request(
                OLLAMA_URL,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=120) as res:
                response_data = json.loads(res.read().decode("utf-8"))

            text = response_data.get("response", "(пустой ответ)")
            await websocket.send(json.dumps({"type": "response", "text": text}))
            print("[Bridge] Response sent")

        except Exception as e:
            err = f"Ошибка: {e}"
            await websocket.send(json.dumps({"type": "response", "text": err}))
            print("[Bridge]", err)

async def main():
    print("[Bridge] Starting on ws://127.0.0.1:8765")
    async with websockets.serve(handle, "127.0.0.1", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
