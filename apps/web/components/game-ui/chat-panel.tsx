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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<ChatEntry | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep the newest message visible when expanded
  useEffect(() => {
    if (!isCollapsed) {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isCollapsed]);

  // Reset unread count & toast when expanding
  useEffect(() => {
    if (!isCollapsed) {
      setUnreadCount(0);
      setActiveToast(null);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    }
  }, [isCollapsed]);

  // Track unread messages and show toast when collapsed
  useEffect(() => {
    const prevLength = prevMessagesLengthRef.current;
    if (isCollapsed && messages.length > prevLength) {
      const newMessages = messages.slice(prevLength);
      // count messages not sent by self
      const incoming = newMessages.filter((m) => m.userId !== selfId);
      if (incoming.length > 0) {
        setUnreadCount((prev) => prev + incoming.length);

        // Trigger toast for the latest incoming message
        const latestMsg = incoming[incoming.length - 1];
        if (latestMsg) {
          setActiveToast(latestMsg);

          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          toastTimeoutRef.current = setTimeout(() => {
            setActiveToast(null);
          }, 4000);
        }
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isCollapsed, selfId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  // show real username (fall back to "You" if missing), and truncate to 20 chars max
  const nameFor = (userId: string) => {
    const rawName = names[userId] ?? (userId === selfId ? "You" : userId.slice(0, 5));
    return rawName.length > 20 ? rawName.slice(0, 20) + "..." : rawName;
  };

  return (
    <>
      {/* Self-contained CSS Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes chatSlideIn {
              0% { opacity: 0; transform: translateY(12px) scale(0.95); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-chat-slide-in {
              animation: chatSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes chatFadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            .animate-chat-fade-in {
              animation: chatFadeIn 0.25s ease-out forwards;
            }
          `,
        }}
      />

      {/* Floating message toast notification shown when collapsed */}
      {isCollapsed && activeToast && (
        <div
          onClick={() => setIsCollapsed(false)}
          className="pointer-events-auto absolute bottom-20 left-4 z-50 flex w-64 flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl hover:bg-slate-50/80 transition-all duration-200 animate-chat-slide-in cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              New Message
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-xs font-bold text-slate-800">
            {nameFor(activeToast.userId)}
          </div>
          <div className="text-xs text-slate-600 truncate">{activeToast.text}</div>
        </div>
      )}

      {/* Main morphing container */}
      <div
        className={`pointer-events-auto absolute bottom-4 left-4 flex flex-col shadow-2xl backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          isCollapsed
            ? "w-12 h-12 rounded-[14px] bg-gradient-to-b from-[#34c759] to-[#24b455] border border-transparent cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
            : "overflow-hidden w-[min(18rem,calc(100vw-2rem))] h-[360px] rounded-[22px] bg-white/95 border border-slate-200/80"
        }`}
        onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
      >
        {isCollapsed ? (
          /* Collapsed Green iMessage Button Content */
          <div className="relative flex items-center justify-center w-full h-full text-white animate-chat-fade-in select-none">
            <svg className="w-6.5 h-6.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.37 1.15 4.5 3 6.02L4 21l4.83-1.61c1 .35 2.08.61 3.17.61 5.52 0 10-3.82 10-8.5S17.52 2 12 2z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        ) : (
          /* Expanded Chat Window Content */
          <div className="flex flex-col h-full w-full animate-chat-fade-in">
            {/* Header (Clickable to collapse/expand) */}
            <div
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-800 cursor-pointer select-none hover:bg-slate-50/80 active:bg-slate-100/50 transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                {/* Status presence indicator dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Messages</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Chevron toggle icon */}
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Messages List */}
            <div
              ref={listRef}
              className="flex-1 flex flex-col gap-2.5 overflow-y-auto px-4 py-3"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center select-none">
                  <svg className="w-7 h-7 text-slate-300 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400">No messages yet</p>
                  <p className="text-[10px] text-slate-400/80">Say hello to the room!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isSelf = m.userId === selfId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col w-full ${isSelf ? "items-end" : "items-start"}`}
                    >
                      {!isSelf && (
                        <span className="text-[10px] font-medium text-slate-400 mb-0.5 px-2.5">
                          {nameFor(m.userId)}
                        </span>
                      )}
                      <div
                        className={`max-w-[85%] px-3 py-2 text-xs leading-normal shadow-xs break-words ${
                          isSelf
                            ? "bg-[#30d158] text-white rounded-2xl rounded-tr-sm"
                            : "bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-3 bg-white">
              {/* Plus Button (iMessage style) */}
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 cursor-pointer transition-all duration-200"
                aria-label="Add attachment"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Input Wrapper */}
              <div className="relative flex-1 flex items-center">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type message..."
                  aria-label="Chat message"
                  maxLength={500}
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 pr-9 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none transition-all duration-200"
                />
                {/* Circular Send Button inside input */}
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className={`absolute right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white transition-all duration-200 active:scale-90 ${
                    draft.trim()
                      ? "bg-[#30d158] hover:bg-[#28be4e] cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
