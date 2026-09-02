#!/usr/bin/env node
/**
 * Viora agent hook for Claude Code
 *
 * Broadcasts what your AI agent is doing to everyone in your current Viora space.
 * Setup guide: tools/agent-hook/README.md
 *
 * Reads Claude Code hook events from stdin and POSTs activity to
 * POST /api/v1/agent-activity on your Viora server. Exits 0 silently on any
 * failure so it never blocks your agent session.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_PATH = join(homedir(), ".viora", "agent.json");
const THROTTLE_MS = 2000;
const STATE_PATH = join(homedir(), ".viora", ".agent-hook-state");

function readStdin() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (raw += chunk));
    process.stdin.on("end", () => resolve(raw));
    setTimeout(() => resolve(raw), 1500);
  });
}

function loadConfig() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    if (config?.token && config?.apiUrl) return config;
  } catch {
  }
  return null;
}

function lastSentAt() {
  try {
    return Number(readFileSync(STATE_PATH, "utf8")) || 0;
  } catch {
    return 0;
  }
}

function describe(event) {
  const tool = typeof event.tool_name === "string" ? event.tool_name : "";
  if (event.hook_event_name === "Stop") return { state: "done", text: "" };
  if (event.hook_event_name === "SessionEnd") return { state: "done", text: "" };

  const toolLabel = tool.replace(/^(mcp__|LambdaResponse)/, "").slice(0, 40);
  let detail = "";
  if (tool === "Edit" || tool === "Write" || tool === "MultiEdit") {
    const filePath = event?.tool_input?.file_path;
    if (typeof filePath === "string") {
      const parts = filePath.split("/");
      detail = ` ${parts[parts.length - 1]}`;
    }
  }
  if (tool === "Bash" && typeof event?.tool_input?.command === "string") {
    detail = ` $ ${event.tool_input.command.slice(0, 60)}`;
  }
  return { state: "cooking", text: `Claude is using ${toolLabel || "a tool"}${detail}` };
}

async function main() {
  const config = loadConfig();
  if (!config) process.exit(0);

  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const { state, text } = describe(event);
  if (state === "cooking" && !text) process.exit(0);

  // Client-side throttle: hook events fire per tool use and can be chatty.
  const now = Date.now();
  if (state === "cooking" && now - lastSentAt() < THROTTLE_MS) process.exit(0);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    await fetch(`${config.apiUrl.replace(/\/$/, "")}/api/v1/agent-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ text, state }),
      signal: controller.signal,
    });
    if (state === "cooking") {
      const { writeFileSync, mkdirSync } = await import("node:fs");
      try {
        mkdirSync(join(homedir(), ".viora"), { recursive: true });
        writeFileSync(STATE_PATH, String(now));
      } catch {
      }
    }
  } catch {
    // Never let analytics failures disturb the agent session.
  } finally {
    clearTimeout(timer);
  }

  process.exit(0);
}

main();
