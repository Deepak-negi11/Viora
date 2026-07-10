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
    <div className="pointer-events-auto absolute bottom-20 left-4 flex w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden border border-[#3a4962] bg-[#111827]/95 shadow-xl backdrop-blur sm:bottom-4">
      <div className="border-b border-[#3a4962] px-3 py-2 text-sm font-semibold text-white">Room chat</div>

      <div
        ref={listRef}
        className="flex max-h-56 flex-col gap-1.5 overflow-y-auto px-3 py-2"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-neutral-400">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => (
            <p key={m.id} className="text-sm leading-snug text-neutral-200">
              <span
                className={
                  "font-semibold " +
                  (m.userId === selfId ? "text-[#aebeff]" : "text-neutral-100")
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

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#3a4962] p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the room…"
          aria-label="Chat message"
          maxLength={500}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-[#26334a] px-3 py-1.5 text-sm text-white placeholder:text-neutral-400 focus:border-[#aebeff] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-md bg-[#183a8f] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#2451b2] disabled:opacity-40 motion-reduce:transition-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
