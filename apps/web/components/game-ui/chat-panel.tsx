"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatEntry } from "../../hooks/use-space-socket";

type ChatPanelProps = {
  messages: ChatEntry[];
  names: Record<string, string>;
  selfId: string | null;
  onSend: (text: string) => void;
};

// Bottom-left chat overlay (like ZEP/Gather). A React panel over the Phaser canvas.
export function ChatPanel({ messages, names, selfId, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // keep the newest message visible
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  // show "You" for yourself, real username for others, short id as fallback
  const nameFor = (userId: string) =>
    userId === selfId ? "You" : names[userId] ?? userId.slice(0, 5);

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 flex w-72 flex-col overflow-hidden rounded-xl bg-neutral-900/90 shadow-xl ring-1 ring-white/10 backdrop-blur">
      <div className="border-b border-white/10 px-3 py-2 text-sm font-medium text-white">Chat</div>

      <div
        ref={listRef}
        className="flex max-h-56 flex-col gap-1.5 overflow-y-auto px-3 py-2"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-neutral-500">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => (
            <p key={m.id} className="text-sm leading-snug text-neutral-200">
              <span
                className={
                  "font-semibold " +
                  (m.userId === selfId ? "text-indigo-300" : "text-neutral-100")
                }
              >
                {nameFor(m.userId)}
              </span>
              <span className="text-neutral-400">: </span>
              {m.text}
            </p>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/10 p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Chat message"
          maxLength={500}
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-40 motion-reduce:transition-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
