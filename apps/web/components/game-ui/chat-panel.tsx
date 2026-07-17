"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatRoomZone } from "@repo/shared";
import type { ChatScope } from "../../lib/space-api";
import type { ChatEntry } from "../../hooks/use-space-socket";

type ChatPanelProps = {
  generalMessages: ChatEntry[];
  roomMessages: ChatEntry[];
  currentRoom: ChatRoomZone | null;
  names: Record<string, string>;
  selfId: string | null;
  onSend: (text: string, scope: ChatScope) => void;
};

export function ChatPanel({
  generalMessages,
  roomMessages,
  currentRoom,
  names,
  selfId,
  onSend,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeScope, setActiveScope] = useState<ChatScope>("general");
  const [generalUnread, setGeneralUnread] = useState(0);
  const [roomUnread, setRoomUnread] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const previousGeneralCount = useRef(generalMessages.length);
  const previousRoomCount = useRef(roomMessages.length);

  const messages = activeScope === "general" ? generalMessages : roomMessages;
  const roomEnabled = !!currentRoom;

  useEffect(() => {
    if (!roomEnabled && activeScope === "room") setActiveScope("general");
  }, [roomEnabled, activeScope]);

  useEffect(() => {
    const incoming = generalMessages.length - previousGeneralCount.current;
    if (incoming > 0 && (isCollapsed || activeScope !== "general")) {
      setGeneralUnread((count) => count + incoming);
    }
    previousGeneralCount.current = generalMessages.length;
  }, [generalMessages.length, isCollapsed, activeScope]);

  useEffect(() => {
    const incoming = roomMessages.length - previousRoomCount.current;
    if (incoming > 0 && (isCollapsed || activeScope !== "room")) {
      setRoomUnread((count) => count + incoming);
    }
    previousRoomCount.current = roomMessages.length;
  }, [roomMessages.length, isCollapsed, activeScope]);

  useEffect(() => {
    if (!isCollapsed) {
      if (activeScope === "general") setGeneralUnread(0);
      else setRoomUnread(0);
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isCollapsed, activeScope]);

  const totalUnread = generalUnread + roomUnread;
  const roomLabel = currentRoom?.name ?? "Room";
  const emptyCopy = useMemo(() => {
    if (activeScope === "general") {
      return { title: "No messages yet", body: "General chat reaches everyone in this space." };
    }
    if (!currentRoom) {
      return { title: "Enter a room", body: "Room chat becomes available inside a named room." };
    }
    return { title: `No messages in ${currentRoom.name}`, body: "Messages here stay with this room." };
  }, [activeScope, currentRoom]);

  function nameFor(userId: string) {
    const name = names[userId] ?? (userId === selfId ? "You" : userId.slice(0, 5));
    return name.length > 20 ? `${name.slice(0, 20)}...` : name;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || (activeScope === "room" && !currentRoom)) return;
    onSend(text, activeScope);
    setDraft("");
  }

  return (
    <div
      className={`pointer-events-auto absolute bottom-4 left-4 z-50 flex flex-col shadow-2xl backdrop-blur-md transition-all duration-300 ${
        isCollapsed
          ? "h-12 w-12 cursor-pointer rounded-[14px] bg-[#30d158]"
          : "h-[390px] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95"
      }`}
      onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
    >
      {isCollapsed ? (
        <div className="relative flex h-full w-full items-center justify-center text-white">
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.37 1.15 4.5 3 6.02L4 21l4.83-1.61c1 .35 2.08.61 3.17.61 5.52 0 10-3.82 10-8.5S17.52 2 12 2z" />
          </svg>
          {totalUnread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
              {totalUnread}
            </span>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-slate-800 hover:bg-slate-50"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Messages
            </span>
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/70 p-1.5">
            <ChannelTab
              label="General"
              active={activeScope === "general"}
              unread={generalUnread}
              onClick={() => setActiveScope("general")}
            />
            <ChannelTab
              label={roomLabel}
              active={activeScope === "room"}
              unread={roomUnread}
              disabled={!roomEnabled}
              onClick={() => setActiveScope("room")}
            />
          </div>

          <div ref={listRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3" aria-live="polite">
            {messages.length === 0 || (activeScope === "room" && !currentRoom) ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <p className="text-xs font-semibold text-slate-500">{emptyCopy.title}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">{emptyCopy.body}</p>
              </div>
            ) : (
              messages.map((message) => {
                const isSelf = message.userId === selfId;
                return (
                  <div key={message.id} className={`flex w-full flex-col ${isSelf ? "items-end" : "items-start"}`}>
                    {!isSelf && (
                      <span className="mb-0.5 px-2.5 text-[10px] font-medium text-slate-400">
                        {nameFor(message.userId)}
                      </span>
                    )}
                    <div className={`max-w-[85%] break-words px-3 py-2 text-xs leading-normal ${
                      isSelf
                        ? "rounded-2xl rounded-tr-sm bg-[#30d158] text-white"
                        : "rounded-2xl rounded-tl-sm bg-slate-100 text-slate-800"
                    }`}>
                      {message.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeScope === "room" && !currentRoom ? "Enter a room to chat" : `Message ${activeScope === "general" ? "General" : roomLabel}`}
              aria-label="Chat message"
              maxLength={500}
              disabled={activeScope === "room" && !currentRoom}
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || (activeScope === "room" && !currentRoom)}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#30d158] text-white transition hover:bg-[#28be4e] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function ChannelTab({
  label,
  active,
  unread,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  unread: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative truncate rounded-lg px-2 py-2 text-xs font-semibold transition ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
      } disabled:cursor-not-allowed disabled:opacity-45`}
      title={label}
    >
      {label}
      {unread > 0 && <span className="ml-1 text-[10px] text-indigo-600">{unread}</span>}
    </button>
  );
}
