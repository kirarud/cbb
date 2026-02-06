#!/usr/bin/env python3
import json
import os
import signal
import socket
import struct
import subprocess
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SERVER_PATH = os.path.join(ROOT, "local-bot-ui", "web", "server.py")
PID_PATH = os.path.join(os.path.dirname(__file__), "server.pid")

def is_running(host="127.0.0.1", port=5050, timeout=0.3):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def try_status():
    import json as _json
    import urllib.request as _req
    try:
        with _req.urlopen("http://127.0.0.1:5050/api/status", timeout=1) as res:
            return _json.loads(res.read().decode("utf-8"))
    except Exception:
        try:
            with _req.urlopen("http://localhost:5050/api/status", timeout=1) as res:
                return _json.loads(res.read().decode("utf-8"))
        except Exception:
            return None

def read_pid():
    try:
        with open(PID_PATH, "r", encoding="utf-8") as f:
            return int(f.read().strip())
    except Exception:
        return None

def write_pid(pid):
    try:
        with open(PID_PATH, "w", encoding="utf-8") as f:
            f.write(str(pid))
    except Exception:
        pass

def clear_pid():
    try:
        if os.path.exists(PID_PATH):
            os.remove(PID_PATH)
    except Exception:
        pass

def stop_server():
    st = try_status()
    pid = None
    if st and st.get("pid"):
        try:
            pid = int(st.get("pid"))
        except Exception:
            pid = None
    if not pid:
        pid = read_pid()
    if pid:
        try:
            if os.name == "nt":
                subprocess.call(["taskkill", "/PID", str(pid), "/F"])
            else:
                os.kill(pid, signal.SIGTERM)
        except Exception:
            pass
    else:
        if os.name == "nt":
            subprocess.call(["taskkill", "/IM", "python.exe", "/F"])
            subprocess.call(["taskkill", "/IM", "pythonw.exe", "/F"])
        else:
            subprocess.call(["pkill", "-f", "local-bot-ui/web/server.py"])
    # wait a bit for port to close
    for _ in range(10):
        if not is_running():
            clear_pid()
            return {"status": "stopped"}
        time.sleep(0.2)
    # force kill if still running
    if pid and os.name != "nt":
        try:
            os.kill(pid, signal.SIGKILL)
        except Exception:
            pass
    clear_pid()
    return {"status": "stopping"}

def start_server():
    if is_running():
        return {"status": "already_running"}
    if not os.path.exists(SERVER_PATH):
        return {"status": "error", "message": "server.py not found"}
    python = sys.executable or "python3"
    if os.name == "nt":
        creationflags = 0x08000000  # CREATE_NO_WINDOW
        proc = subprocess.Popen([python, SERVER_PATH], creationflags=creationflags)
    else:
        proc = subprocess.Popen([python, SERVER_PATH], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    write_pid(proc.pid)
    # give it a moment
    for _ in range(10):
        if is_running():
            st = try_status()
            if st and st.get("started_at"):
                return {"status": "started", "started_at": st.get("started_at")}
            return {"status": "started"}
        time.sleep(0.2)
    return {"status": "starting"}

def read_message():
    raw_len = sys.stdin.buffer.read(4)
    if not raw_len:
        return None
    msg_len = struct.unpack("<I", raw_len)[0]
    data = sys.stdin.buffer.read(msg_len).decode("utf-8")
    return json.loads(data)

def send_message(obj):
    data = json.dumps(obj).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(data)))
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.flush()

def main():
    while True:
        msg = read_message()
        if msg is None:
            break
        action = msg.get("action")
        if action == "start":
            res = start_server()
            send_message(res)
        elif action == "stop":
            res = stop_server()
            send_message(res)
        elif action == "restart":
            stop_server()
            res = start_server()
            send_message(res)
        elif action == "status":
            st = try_status()
            if st and st.get("ok"):
                send_message({
                    "status": "running",
                    "started_at": st.get("started_at"),
                    "uptime_sec": st.get("uptime_sec"),
                    "pid": st.get("pid")
                })
            else:
                send_message({"status": "running" if is_running() else "stopped"})
        else:
            send_message({"status": "error", "message": "unknown action"})

if __name__ == "__main__":
    main()
