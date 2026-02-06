#!/usr/bin/env python3
import tkinter as tk
from tkinter import scrolledtext

root = tk.Tk()
root.title("Local AI — Simple")
root.geometry("900x600")

label = tk.Label(root, text="Если это видно — Tk работает", bg="#222", fg="#fff")
label.pack(fill=tk.X, padx=8, pady=8)

chat = scrolledtext.ScrolledText(root, height=18)
chat.insert(tk.END, "Готово. Это поле чата.\n")
chat.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

entry = tk.Text(root, height=4)
entry.insert(tk.END, "Это поле ввода.\n")
entry.pack(fill=tk.X, padx=8, pady=8)

btn = tk.Button(root, text="Отправить")
btn.pack(pady=(0, 8))

root.mainloop()
