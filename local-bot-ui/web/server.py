#!/usr/bin/env python3
import json
import os
import re
import sys
import threading
import subprocess
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHATS_DIR = os.path.join(DATA_DIR, "chats")
GLOBAL_GRAPH_PATH = os.path.join(DATA_DIR, "global_graph.json")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
BRIDGE_INBOX_PATH = os.path.join(DATA_DIR, "bridge_inbox.json")
BRIDGE_OUTBOX_PATH = os.path.join(DATA_DIR, "bridge_outbox.json")
SERVER_STARTED_AT = time.time()
SERVER_REF = {"server": None}

OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"
OLLAMA_GEN_URL = "http://127.0.0.1:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"
DEFAULT_SOURCES = [
    "Local (Ollama)",
    "ChatGPT",
    "Grok",
    "Qwen",
    "Gemini",
    "Perplexity",
    "DeepSeek"
]

MAX_GRAPH_FILE_BYTES = 8 * 1024 * 1024
MAX_GLOBAL_NODES = 120
MAX_GLOBAL_EDGES = 240
MAX_SESSION_NODES = 80
MAX_SESSION_EDGES = 160

STOPWORDS = set([
    "и","в","во","не","что","он","на","я","с","со","как","а","то","все","она",
    "так","его","но","да","ты","к","у","же","вы","за","бы","по","только","ее",
    "мне","было","вот","от","меня","еще","нет","о","из","ему","теперь","когда",
    "даже","ну","вдруг","ли","если","уже","или","ни","быть","был","него","до",
    "вас","нибудь","опять","уж","вам","ведь","там","потом","себя","ничего","ей",
    "может","они","тут","где","есть","надо","ней","для","мы","тебя","их","чем",
    "была","сам","чтоб","без","будто","чего","раз","тоже","себе","под","будет",
    "ж","тогда","кто","этот","того","потому","этого","какой","совсем","ним","здесь",
    "этом","один","почти","мой","тем","чтобы","нее","сейчас","были","куда","зачем",
    "сказать","всех","никогда","сегодня","можно","при","наконец","два","об","другой",
    "хоть","после","над","больше","тот","через","эти","нас","про","всего","них","какая",
    "много","разве","три","эту","моя","впрочем","хорошо","свою","этой","перед","иногда",
    "лучше","чуть","том","нельзя","такой","им","более","всегда","конечно","всю","между",
    "and","the","to","of","in","is","it","for","on","with","as","that","this",
    "are","be","or","an","by","from","at","was","were","but","not","we","you","your",
    "i","me","my","they","them","their","our","us","so","if","then","than","about"
])


def ensure_dirs():
    os.makedirs(CHATS_DIR, exist_ok=True)


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def new_chat_id():
    return time.strftime("%Y%m%d-%H%M%S")


def list_chats():
    files = [f for f in os.listdir(CHATS_DIR) if f.endswith(".json")]
    files.sort(reverse=True)
    return [f.replace(".json", "") for f in files]


def parse_source_from_assistant(text):
    if text.startswith("[") and "]" in text[:40]:
        return text[1:text.index("]")]
    return "Local"


def chat_preview(chat):
    messages = chat.get("messages", [])
    text = ""
    for m in messages:
        if m.get("role") == "user":
            text = m.get("content", "")
            break
    if not text and messages:
        text = messages[0].get("content", "")
    text = (text or "").replace("\n", " ").strip()
    if not text:
        return ""
    parts = re.split(r'(?<=[.!?])\s+', text)
    preview = " ".join(parts[:2]).strip()
    if len(preview) > 200:
        preview = preview[:200].rstrip() + "…"
    return preview


def chat_title(chat):
    preview = chat_preview(chat)
    if preview:
        words = preview.split()
        title = " ".join(words[:6]).strip()
        return title if title else "Новый чат"
    return chat.get("title") or "Новый чат"


def chat_sources(chat):
    sources = set()
    for m in chat.get("messages", []):
        if m.get("role") == "assistant":
            sources.add(parse_source_from_assistant(m.get("content", "")))
    return sorted(sources)


def list_chat_infos():
    infos = []
    for chat_id in list_chats():
        p = os.path.join(CHATS_DIR, f"{chat_id}.json")
        chat = load_json(p, {"id": chat_id, "title": "Новый чат", "messages": []})
        try:
            updated_ts = os.path.getmtime(p)
        except Exception:
            updated_ts = 0
        infos.append({
            "id": chat_id,
            "title": chat_title(chat),
            "preview": chat_preview(chat),
            "sources": chat_sources(chat),
            "updated_ts": updated_ts,
            "message_count": len(chat.get("messages", []))
        })
    return infos


def fetch_models_from_ollama():
    try:
        req = urllib.request.Request(OLLAMA_TAGS_URL, method="GET")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
        models = [m.get("name") for m in data.get("models", []) if m.get("name")]
        return sorted(models)
    except Exception:
        return []


def call_ollama(model, prompt):
    payload = json.dumps({"model": model, "prompt": prompt, "stream": False}).encode("utf-8")
    req = urllib.request.Request(OLLAMA_GEN_URL, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as res:
        data = json.loads(res.read().decode("utf-8"))
    return data.get("response", "")


def tokenize(text):
    out = []
    for raw in text.lower().replace("\n", " ").split(" "):
        t = "".join(ch for ch in raw if ch.isalnum() or ch in ("-", "_"))
        if len(t) < 3:
            continue
        if t in STOPWORDS:
            continue
        out.append(t)
    return out


def build_graph_from_texts(texts):
    nodes = {}
    edges = {}
    for text in texts:
        tokens = tokenize(text)
        unique = list(dict.fromkeys(tokens))
        for t in unique:
            nodes[t] = nodes.get(t, 0) + 1
        for i in range(len(unique)):
            for j in range(i + 1, len(unique)):
                a, b = unique[i], unique[j]
                key = "|".join(sorted([a, b]))
                edges[key] = edges.get(key, 0) + 1
    return {"nodes": nodes, "edges": edges}


def merge_graph(g1, g2):
    nodes = dict(g1.get("nodes", {}))
    edges = dict(g1.get("edges", {}))
    for k, v in g2.get("nodes", {}).items():
        nodes[k] = nodes.get(k, 0) + v
    for k, v in g2.get("edges", {}).items():
        edges[k] = edges.get(k, 0) + v
    return {"nodes": nodes, "edges": edges}

def compact_graph(graph, max_nodes, max_edges):
    nodes = dict(graph.get("nodes", {}))
    edges = dict(graph.get("edges", {}))
    if max_nodes and len(nodes) > max_nodes:
        top = sorted(nodes.items(), key=lambda kv: kv[1], reverse=True)[:max_nodes]
        keep = {k for k, _ in top}
        nodes = {k: v for k, v in nodes.items() if k in keep}
        edges = {k: v for k, v in edges.items() if all(part in keep for part in k.split("|"))}
    if max_edges and len(edges) > max_edges:
        edges = dict(sorted(edges.items(), key=lambda kv: kv[1], reverse=True)[:max_edges])
    return {"nodes": nodes, "edges": edges}

def rebuild_global_graph_from_chats(max_chats=60, max_chars=200000):
    texts = []
    total = 0
    for chat_id in list_chats()[:max_chats]:
        chat_path = os.path.join(CHATS_DIR, f"{chat_id}.json")
        chat = load_json(chat_path, {"messages": []})
        for m in chat.get("messages", []):
            t = (m.get("content") or "").strip()
            if not t:
                continue
            texts.append(t)
            total += len(t)
            if total >= max_chars:
                break
        if total >= max_chars:
            break
    graph = build_graph_from_texts(texts)
    return compact_graph(graph, MAX_GLOBAL_NODES, MAX_GLOBAL_EDGES)

def load_global_graph():
    if not os.path.exists(GLOBAL_GRAPH_PATH):
        return {"nodes": {}, "edges": {}}
    try:
        if os.path.getsize(GLOBAL_GRAPH_PATH) > MAX_GRAPH_FILE_BYTES:
            graph = rebuild_global_graph_from_chats()
            save_json(GLOBAL_GRAPH_PATH, graph)
            return graph
    except Exception:
        return {"nodes": {}, "edges": {}}
    return load_json(GLOBAL_GRAPH_PATH, {"nodes": {}, "edges": {}})


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, content_type="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            query = parse_qs(parsed.query or "")

            if path == "/":
                return self._send_file("index.html", "text/html")
            if path == "/app.js":
                return self._send_file("app.js", "application/javascript")
            if path == "/styles.css":
                return self._send_file("styles.css", "text/css")
            if path == "/api/models":
                config = load_json(CONFIG_PATH, {"manual_models": [DEFAULT_MODEL], "last_model": DEFAULT_MODEL})
                auto = fetch_models_from_ollama()
                manual = config.get("manual_models", [])
                models = []
                for m in auto + manual:
                    if m and m not in models:
                        models.append(m)
                if not models:
                    models = [DEFAULT_MODEL]
                return self._send(200, {"models": models, "last": config.get("last_model", models[0])})
            if path == "/api/sources":
                config = load_json(CONFIG_PATH, {"sources": DEFAULT_SOURCES, "last_source": DEFAULT_SOURCES[0], "bridge_target": ""})
                sources = config.get("sources") or DEFAULT_SOURCES
                last = config.get("last_source") or sources[0]
                return self._send(200, {"sources": sources, "last": last})
            if path == "/api/bridge/target":
                config = load_json(CONFIG_PATH, {"sources": DEFAULT_SOURCES, "last_source": DEFAULT_SOURCES[0], "bridge_target": ""})
                return self._send(200, {"bridge_target": config.get("bridge_target", "")})
            if path == "/api/bridge/outbox/next":
                source = (query.get("source", [""])[0] or "").strip()
                outbox = load_json(BRIDGE_OUTBOX_PATH, [])
                if not outbox:
                    return self._send(200, {"item": None})
                idx = None
                for i, item in enumerate(outbox):
                    if not source or item.get("source") == source:
                        idx = i
                        break
                if idx is None:
                    return self._send(200, {"item": None})
                item = outbox.pop(idx)
                save_json(BRIDGE_OUTBOX_PATH, outbox)
                print(f"[Outbox] dequeue: source={item.get('source')} remaining={len(outbox)}")
                return self._send(200, {"item": item})
            if path == "/api/bridge/outbox/count":
                outbox = load_json(BRIDGE_OUTBOX_PATH, [])
                return self._send(200, {"count": len(outbox)})
            if path == "/api/bridge/inbox/last":
                inbox = load_json(BRIDGE_INBOX_PATH, [])
                return self._send(200, {"last": inbox[-1] if inbox else None})
            if path == "/api/chats":
                return self._send(200, {"chats": list_chat_infos()})
            if path.startswith("/api/chat/"):
                chat_id = path.split("/api/chat/")[-1]
                p = os.path.join(CHATS_DIR, f"{chat_id}.json")
                data = load_json(p, None)
                if not data or not isinstance(data, dict):
                    return self._send(404, {"error": "not found"})
                texts = [m.get("content", "") for m in data.get("messages", [])]
                session_graph = build_graph_from_texts(texts)
                session_graph = compact_graph(session_graph, MAX_SESSION_NODES, MAX_SESSION_EDGES)
                global_graph = load_global_graph()
                global_graph = compact_graph(global_graph, MAX_GLOBAL_NODES, MAX_GLOBAL_EDGES)
                return self._send(200, {**data, "session_graph": session_graph, "global_graph": global_graph})
            if path == "/api/status":
                return self._send(200, {
                    "ok": True,
                    "started_at": SERVER_STARTED_AT,
                    "pid": os.getpid(),
                    "uptime_sec": max(0, time.time() - SERVER_STARTED_AT)
                })

            return self._send(404, {"error": "not found"})
        except Exception as e:
            return self._send(500, {"error": str(e)})

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception:
                payload = {}

            if path == "/api/control/shutdown":
                def _stop():
                    time.sleep(0.2)
                    srv = SERVER_REF.get("server")
                    if srv:
                        srv.shutdown()
                    os._exit(0)
                threading.Thread(target=_stop, daemon=True).start()
                return self._send(200, {"ok": True, "action": "shutdown"})

            if path == "/api/control/restart":
                def _restart():
                    time.sleep(0.2)
                    py = sys.executable or "python3"
                    os.execv(py, [py, os.path.abspath(__file__)])
                threading.Thread(target=_restart, daemon=True).start()
                return self._send(200, {"ok": True, "action": "restart"})

            if path == "/api/chat/new":
                chat_id = new_chat_id()
                chat = {"id": chat_id, "title": "Новый чат", "messages": []}
                save_json(os.path.join(CHATS_DIR, f"{chat_id}.json"), chat)
                return self._send(200, chat)

            if path == "/api/chat/send":
                chat_id = payload.get("chat_id")
                text = (payload.get("text") or "").strip()
                model = (payload.get("model") or DEFAULT_MODEL).strip()
                source = (payload.get("source") or "Local (Ollama)").strip()
                enqueue = bool(payload.get("enqueue"))
                if not chat_id or not text:
                    return self._send(400, {"error": "missing chat_id or text"})

                chat_path = os.path.join(CHATS_DIR, f"{chat_id}.json")
                chat = load_json(chat_path, {"id": chat_id, "title": "Новый чат", "messages": []})
                chat["messages"].append({"role": "user", "content": text})

                if source == "Local (Ollama)":
                    try:
                        response = call_ollama(model, text)
                    except urllib.error.URLError as e:
                        response = f"Ошибка подключения к Ollama: {e}"
                    except Exception as e:
                        response = f"Ошибка: {e}"
                    chat["messages"].append({"role": "assistant", "content": response})
                else:
                    response = f"[Ожидаю ответ из {source}. Вставьте ответ вручную через кнопку «Добавить ответ».]"
                    chat["messages"].append({"role": "assistant", "content": response})
                    if enqueue:
                        outbox = load_json(BRIDGE_OUTBOX_PATH, [])
                        outbox.append({"chat_id": chat_id, "source": source, "text": text, "ts": time.time()})
                        save_json(BRIDGE_OUTBOX_PATH, outbox)
                        print(f"[Outbox] enqueued: source={source} size={len(outbox)}")
                    else:
                        print(f"[Outbox] NOT enqueued: source={source} enqueue={enqueue}")

                save_json(chat_path, chat)

                # graphs
                texts = [m.get("content", "") for m in chat.get("messages", [])]
                session_graph = build_graph_from_texts(texts)
                session_graph = compact_graph(session_graph, MAX_SESSION_NODES, MAX_SESSION_EDGES)
                global_graph = load_global_graph()
                global_graph = merge_graph(global_graph, session_graph)
                global_graph = compact_graph(global_graph, MAX_GLOBAL_NODES, MAX_GLOBAL_EDGES)
                save_json(GLOBAL_GRAPH_PATH, global_graph)

                return self._send(200, {"response": response, "chat": chat, "session_graph": session_graph, "global_graph": global_graph})

            if path == "/api/models/add":
                name = (payload.get("name") or "").strip()
                if not name:
                    return self._send(400, {"error": "empty"})
                config = load_json(CONFIG_PATH, {"manual_models": [DEFAULT_MODEL], "last_model": DEFAULT_MODEL})
                manual = config.get("manual_models", [])
                if name not in manual:
                    manual.append(name)
                config["manual_models"] = manual
                save_json(CONFIG_PATH, config)
                return self._send(200, {"ok": True})

            if path == "/api/models/last":
                name = (payload.get("name") or "").strip()
                config = load_json(CONFIG_PATH, {"manual_models": [DEFAULT_MODEL], "last_model": DEFAULT_MODEL})
                if name:
                    config["last_model"] = name
                save_json(CONFIG_PATH, config)
                return self._send(200, {"ok": True})

            if path == "/api/sources/add":
                name = (payload.get("name") or "").strip()
                if not name:
                    return self._send(400, {"error": "empty"})
                config = load_json(CONFIG_PATH, {"sources": DEFAULT_SOURCES, "last_source": DEFAULT_SOURCES[0], "bridge_target": ""})
                sources = config.get("sources") or DEFAULT_SOURCES
                if name not in sources:
                    sources.append(name)
                config["sources"] = sources
                save_json(CONFIG_PATH, config)
                return self._send(200, {"ok": True})

            if path == "/api/sources/last":
                name = (payload.get("name") or "").strip()
                config = load_json(CONFIG_PATH, {"sources": DEFAULT_SOURCES, "last_source": DEFAULT_SOURCES[0], "bridge_target": ""})
                if name:
                    config["last_source"] = name
                save_json(CONFIG_PATH, config)
                return self._send(200, {"ok": True})

            if path == "/api/bridge/ingest":
                config = load_json(CONFIG_PATH, {"sources": DEFAULT_SOURCES, "last_source": DEFAULT_SOURCES[0], "bridge_target": ""})
                chat_id = (payload.get("chat_id") or config.get("bridge_target") or "").strip()
                if not chat_id:
                    chats = list_chats()
                    if chats:
                        chat_id = chats[0]
                source = (payload.get("source") or "Bridge").strip()
                text = (payload.get("text") or "").strip()
                if not chat_id or not text:
                    return self._send(400, {"error": "missing chat_id or text"})
                chat_path = os.path.join(CHATS_DIR, f"{chat_id}.json")
                chat = load_json(chat_path, {"id": chat_id, "title": "Новый чат", "messages": []})
                chat["messages"].append({"role": "assistant", "content": f"[{source}] {text}"})
                save_json(chat_path, chat)
                print(f"[Bridge] ingest: chat_id={chat_id} source={source} len={len(text)}")
                inbox = load_json(BRIDGE_INBOX_PATH, [])
                inbox.append({"chat_id": chat_id, "source": source, "text": text, "ts": time.time()})
                save_json(BRIDGE_INBOX_PATH, inbox)
                texts = [m.get("content", "") for m in chat.get("messages", [])]
                session_graph = build_graph_from_texts(texts)
                session_graph = compact_graph(session_graph, MAX_SESSION_NODES, MAX_SESSION_EDGES)
                global_graph = load_global_graph()
                global_graph = merge_graph(global_graph, session_graph)
                global_graph = compact_graph(global_graph, MAX_GLOBAL_NODES, MAX_GLOBAL_EDGES)
                save_json(GLOBAL_GRAPH_PATH, global_graph)
                return self._send(200, {"ok": True, "chat": chat, "session_graph": session_graph, "global_graph": global_graph})

            if path == "/api/bridge/target/set":
                chat_id = (payload.get("chat_id") or "").strip()
                config = load_json(CONFIG_PATH, {"sources": DEFAULT_SOURCES, "last_source": DEFAULT_SOURCES[0], "bridge_target": ""})
                if chat_id:
                    config["bridge_target"] = chat_id
                    save_json(CONFIG_PATH, config)
                return self._send(200, {"ok": True, "bridge_target": config.get("bridge_target", "")})

            if path == "/api/bridge/outbox/enqueue":
                chat_id = (payload.get("chat_id") or "").strip()
                source = (payload.get("source") or "").strip()
                text = (payload.get("text") or "").strip()
                if not chat_id or not source or not text:
                    return self._send(400, {"error": "missing chat_id/source/text"})
                outbox = load_json(BRIDGE_OUTBOX_PATH, [])
                outbox.append({"chat_id": chat_id, "source": source, "text": text, "ts": time.time()})
                save_json(BRIDGE_OUTBOX_PATH, outbox)
                return self._send(200, {"ok": True})

            if path == "/api/graph/reset":
                save_json(GLOBAL_GRAPH_PATH, {"nodes": {}, "edges": {}})
                return self._send(200, {"ok": True})

            return self._send(404, {"error": "not found"})
        except Exception as e:
            return self._send(500, {"error": str(e)})

    def _send_file(self, filename, content_type):
        path = os.path.join(BASE_DIR, filename)
        if not os.path.exists(path):
            return self._send(404, {"error": "file not found"})
        with open(path, "rb") as f:
            data = f.read()
        self._send(200, data, content_type)


def main():
    ensure_dirs()
    # auto-fix oversized global graph on startup
    try:
        load_global_graph()
    except Exception:
        pass
    server = HTTPServer(("0.0.0.0", 5050), Handler)
    SERVER_REF["server"] = server
    print("Local Bot UI running at http://127.0.0.1:5050 (listening on 0.0.0.0)")
    server.serve_forever()


if __name__ == "__main__":
    main()
