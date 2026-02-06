#!/usr/bin/env python3
import json
import os
import time
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import ttk
from tkinter import scrolledtext

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")
CHATS_DIR = os.path.join(DATA_DIR, "chats")
GLOBAL_GRAPH_PATH = os.path.join(DATA_DIR, "global_graph.json")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")

OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"
OLLAMA_GEN_URL = "http://127.0.0.1:11434/api/generate"

DEFAULT_MODEL = "llama3.1:8b"

STOPWORDS = set([
    "и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то", "все", "она",
    "так", "его", "но", "да", "ты", "к", "у", "же", "вы", "за", "бы", "по", "только", "ее",
    "мне", "было", "вот", "от", "меня", "еще", "нет", "о", "из", "ему", "теперь", "когда",
    "даже", "ну", "вдруг", "ли", "если", "уже", "или", "ни", "быть", "был", "него", "до",
    "вас", "нибудь", "опять", "уж", "вам", "ведь", "там", "потом", "себя", "ничего", "ей",
    "может", "они", "тут", "где", "есть", "надо", "ней", "для", "мы", "тебя", "их", "чем",
    "была", "сам", "чтоб", "без", "будто", "чего", "раз", "тоже", "себе", "под", "будет",
    "ж", "тогда", "кто", "этот", "того", "потому", "этого", "какой", "совсем", "ним", "здесь",
    "этом", "один", "почти", "мой", "тем", "чтобы", "нее", "сейчас", "были", "куда", "зачем",
    "сказать", "всех", "никогда", "сегодня", "можно", "при", "наконец", "два", "об", "другой",
    "хоть", "после", "над", "больше", "тот", "через", "эти", "нас", "про", "всего", "них", "какая",
    "много", "разве", "три", "эту", "моя", "впрочем", "хорошо", "свою", "этой", "перед", "иногда",
    "лучше", "чуть", "том", "нельзя", "такой", "им", "более", "всегда", "конечно", "всю", "между",
    "и", "a", "the", "to", "of", "in", "is", "it", "for", "on", "with", "as", "that", "this",
    "are", "be", "or", "an", "by", "from", "at", "was", "were", "but", "not", "we", "you", "your",
    "i", "me", "my", "they", "them", "their", "our", "us", "so", "if", "then", "than", "about"
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


def list_chat_files():
    if not os.path.exists(CHATS_DIR):
        return []
    files = [f for f in os.listdir(CHATS_DIR) if f.endswith(".json")]
    files.sort(reverse=True)
    return files


def new_chat_id():
    return time.strftime("%Y%m%d-%H%M%S")


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
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False
    }).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_GEN_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
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


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Local AI — Desktop")
        self.root.geometry("1200x720")
        self.root.minsize(900, 600)

        ensure_dirs()
        self.config = load_json(CONFIG_PATH, {"manual_models": [DEFAULT_MODEL], "last_model": DEFAULT_MODEL})
        self.global_graph = load_json(GLOBAL_GRAPH_PATH, {"nodes": {}, "edges": {}})

        self.current_chat_id = None
        self.current_chat = {"id": None, "title": "Новый чат", "messages": []}

        self._build_ui()
        self._load_chat_list()
        self._refresh_models()
        self._new_chat()

    def _build_ui(self):
        self.root.configure(bg="#111")

        self.main = tk.Frame(self.root, bg="#111")
        self.main.pack(fill=tk.BOTH, expand=True)

        self.left = tk.Frame(self.main, width=240, bg="#161616", highlightbackground="#2a2a2a", highlightthickness=1)
        self.center = tk.Frame(self.main, bg="#1a1a1a", highlightbackground="#2a2a2a", highlightthickness=1)
        self.right = tk.Frame(self.main, width=320, bg="#161616", highlightbackground="#2a2a2a", highlightthickness=1)

        self.left.pack(side=tk.LEFT, fill=tk.Y)
        self.center.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.right.pack(side=tk.RIGHT, fill=tk.Y)
        self.left.pack_propagate(False)
        self.right.pack_propagate(False)

        # Left: chat list
        tk.Label(self.left, text="Чаты", fg="#ddd", bg="#161616").pack(anchor="w", padx=8, pady=(8, 4))
        self.chat_list = tk.Listbox(self.left, height=18, bg="#0f0f0f", fg="#ddd")
        self.chat_list.pack(fill=tk.BOTH, expand=True, padx=8)
        self.chat_list.bind("<<ListboxSelect>>", self._on_chat_select)
        tk.Button(self.left, text="Новый чат", command=self._new_chat).pack(fill=tk.X, padx=8, pady=6)
        tk.Button(self.left, text="Удалить чат", command=self._delete_chat).pack(fill=tk.X, padx=8, pady=(0, 8))

        # Center: chat
        top_bar = tk.Frame(self.center, bg="#111")
        top_bar.pack(fill=tk.X, padx=8, pady=(8, 4))

        tk.Label(top_bar, text="Модель:", fg="#ddd", bg="#111").pack(side=tk.LEFT)
        self.model_var = tk.StringVar(value=DEFAULT_MODEL)
        self.model_combo = ttk.Combobox(top_bar, textvariable=self.model_var, state="readonly", width=28)
        self.model_combo.pack(side=tk.LEFT, padx=(6, 8))
        self.model_entry = tk.Entry(top_bar, width=20)
        self.model_entry.pack(side=tk.LEFT, padx=(0, 6))
        tk.Button(top_bar, text="Добавить", command=self._add_model).pack(side=tk.LEFT)
        tk.Button(top_bar, text="Обновить", command=self._refresh_models).pack(side=tk.LEFT, padx=(6, 0))

        self.chat_view = scrolledtext.ScrolledText(
            self.center,
            wrap=tk.WORD,
            state=tk.NORMAL,
            bg="#0f0f0f",
            fg="#ddd",
            insertbackground="#ddd",
            relief=tk.GROOVE,
            bd=2
        )
        self.chat_view.insert(tk.END, "Готово. Здесь будет история чата.\n")
        self.chat_view.configure(state=tk.DISABLED)
        self.chat_view.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

        input_bar = tk.Frame(self.center, bg="#111")
        input_bar.pack(fill=tk.X, padx=8, pady=(0, 8))
        self.input_text = tk.Text(
            input_bar,
            height=4,
            bg="#0f0f0f",
            fg="#ddd",
            insertbackground="#ddd",
            relief=tk.GROOVE,
            bd=2
        )
        self.input_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(input_bar, text="Отправить", command=self._send).pack(side=tk.LEFT, padx=6)

        # Right: graph
        tk.Label(self.right, text="Память‑граф", fg="#ddd", bg="#161616").pack(anchor="w", padx=8, pady=(8, 4))
        self.graph_canvas = tk.Canvas(self.right, width=280, height=600, bg="#111")
        self.graph_canvas.pack(fill=tk.BOTH, expand=True, padx=8, pady=(0, 8))
        self.graph_canvas.create_text(140, 20, text="Граф памяти", fill="#ddd")

        # Status
        self.status = tk.StringVar(value="Готово")
        tk.Label(self.root, textvariable=self.status, fg="#aaa", bg="#111").pack(anchor="w", padx=8, pady=(0, 6))

    def _set_status(self, text):
        self.status.set(text)
        self.root.update_idletasks()

    def _load_chat_list(self):
        self.chat_list.delete(0, tk.END)
        for f in list_chat_files():
            self.chat_list.insert(tk.END, f.replace(".json", ""))

    def _save_current_chat(self):
        if not self.current_chat_id:
            return
        path = os.path.join(CHATS_DIR, f"{self.current_chat_id}.json")
        save_json(path, self.current_chat)

    def _new_chat(self):
        self.current_chat_id = new_chat_id()
        self.current_chat = {"id": self.current_chat_id, "title": "Новый чат", "messages": []}
        self._save_current_chat()
        self._load_chat_list()
        self._render_chat()
        self._render_graph(session_graph={"nodes": {}, "edges": {}})

    def _delete_chat(self):
        if not self.current_chat_id:
            return
        path = os.path.join(CHATS_DIR, f"{self.current_chat_id}.json")
        if os.path.exists(path):
            os.remove(path)
        self._new_chat()

    def _on_chat_select(self, _evt):
        sel = self.chat_list.curselection()
        if not sel:
            return
        chat_id = self.chat_list.get(sel[0])
        path = os.path.join(CHATS_DIR, f"{chat_id}.json")
        data = load_json(path, None)
        if not data:
            return
        self.current_chat_id = chat_id
        self.current_chat = data
        self._render_chat()
        self._render_graph_from_chat()

    def _render_chat(self):
        self.chat_view.configure(state=tk.NORMAL)
        self.chat_view.delete("1.0", tk.END)
        for msg in self.current_chat.get("messages", []):
            role = msg.get("role", "user")
            content = msg.get("content", "")
            self.chat_view.insert(tk.END, f"{role.upper()}: {content}\n\n")
        self.chat_view.configure(state=tk.DISABLED)
        self.chat_view.see(tk.END)

    def _refresh_models(self):
        auto = fetch_models_from_ollama()
        manual = self.config.get("manual_models", [])
        models = []
        for m in auto + manual:
            if m and m not in models:
                models.append(m)
        if not models:
            models = [DEFAULT_MODEL]
        self.model_combo["values"] = models
        last = self.config.get("last_model", models[0])
        if last in models:
            self.model_var.set(last)
        else:
            self.model_var.set(models[0])
        self.config["last_model"] = self.model_var.get()
        save_json(CONFIG_PATH, self.config)

    def _add_model(self):
        name = self.model_entry.get().strip()
        if not name:
            return
        manual = self.config.get("manual_models", [])
        if name not in manual:
            manual.append(name)
        self.config["manual_models"] = manual
        self.model_entry.delete(0, tk.END)
        save_json(CONFIG_PATH, self.config)
        self._refresh_models()

    def _send(self):
        prompt = self.input_text.get("1.0", tk.END).strip()
        if not prompt:
            return
        self.input_text.delete("1.0", tk.END)
        model = self.model_var.get().strip() or DEFAULT_MODEL
        self.config["last_model"] = model
        save_json(CONFIG_PATH, self.config)

        self.current_chat["messages"].append({"role": "user", "content": prompt})
        self._render_chat()
        self._save_current_chat()

        self._set_status("Запрос к Ollama...")
        try:
            response = call_ollama(model, prompt)
        except urllib.error.URLError as e:
            response = f"Ошибка подключения к Ollama: {e}"
        except Exception as e:
            response = f"Ошибка: {e}"

        self.current_chat["messages"].append({"role": "assistant", "content": response})
        self._render_chat()
        self._save_current_chat()
        self._update_graphs_from_chat()
        self._set_status("Готово")

    def _render_graph_from_chat(self):
        texts = [m.get("content", "") for m in self.current_chat.get("messages", [])]
        session_graph = build_graph_from_texts(texts)
        self._render_graph(session_graph=session_graph)

    def _update_graphs_from_chat(self):
        texts = [m.get("content", "") for m in self.current_chat.get("messages", [])]
        session_graph = build_graph_from_texts(texts)
        self.global_graph = merge_graph(self.global_graph, session_graph)
        save_json(GLOBAL_GRAPH_PATH, self.global_graph)
        self._render_graph(session_graph=session_graph)

    def _render_graph(self, session_graph):
        self.graph_canvas.delete("all")
        # Merge session + global for display, highlight session nodes
        merged = merge_graph(self.global_graph, session_graph)
        nodes = merged.get("nodes", {})
        edges = merged.get("edges", {})

        # top N nodes by weight
        top = sorted(nodes.items(), key=lambda x: x[1], reverse=True)[:18]
        if not top:
            return

        w = int(self.graph_canvas.winfo_width()) or 280
        h = int(self.graph_canvas.winfo_height()) or 600
        cx, cy = w // 2, h // 2
        r = min(w, h) // 2 - 20

        positions = {}
        for i, (name, _weight) in enumerate(top):
            angle = (i / len(top)) * 6.28318
            x = cx + int(r * 0.85 * (1 + 0.02) * (1.0) * __import__("math").cos(angle))
            y = cy + int(r * 0.85 * (1 + 0.02) * (1.0) * __import__("math").sin(angle))
            positions[name] = (x, y)

        # draw edges
        for key, weight in edges.items():
            a, b = key.split("|")
            if a not in positions or b not in positions:
                continue
            x1, y1 = positions[a]
            x2, y2 = positions[b]
            alpha = max(40, min(180, 40 + weight * 10))
            color = f"#00{alpha:02x}66"
            self.graph_canvas.create_line(x1, y1, x2, y2, fill=color)

        # draw nodes
        session_nodes = set(session_graph.get("nodes", {}).keys())
        for name, weight in top:
            x, y = positions[name]
            size = 6 + min(16, weight)
            fill = "#ffd166" if name in session_nodes else "#7dd3fc"
            self.graph_canvas.create_oval(x - size, y - size, x + size, y + size, fill=fill, outline="")
            self.graph_canvas.create_text(x, y - size - 8, text=name[:12], fill="#ddd", font=("Helvetica", 9))


def main():
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
