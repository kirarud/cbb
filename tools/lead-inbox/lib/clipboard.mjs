import { spawn } from "node:child_process";

export async function readClipboardText() {
  const res = await run("pbpaste", []);
  return res.stdout;
}

export async function writeClipboardText(text) {
  await run("pbcopy", [], { stdin: text });
}

function run(cmd, args, { stdin } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`${cmd} exited ${code}: ${stderr || stdout}`));
    });
    if (stdin != null) child.stdin.end(String(stdin));
    else child.stdin.end();
  });
}

