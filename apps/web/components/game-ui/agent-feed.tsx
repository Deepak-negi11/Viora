"use client";

import { useState } from "react";
import type { AgentActivities } from "../../hooks/use-space-socket";

type AgentFeedProps = {
  agentActivities: AgentActivities;
  names: Record<string, string>;
  selfId: string | null;
  onSelect?: (userId: string | null) => void;
};

function relativeTime(at: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AgentFeed({ agentActivities, names, selfId, onSelect }: AgentFeedProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const entries = Object.entries(agentActivities).sort((a, b) => b[1].at - a[1].at);

  function nameFor(userId: string) {
    const name = names[userId] ?? (userId === selfId ? "You" : userId.slice(0, 5));
    return name.length > 18 ? `${name.slice(0, 18)}...` : name;
  }

  function initialFor(userId: string) {
    return nameFor(userId).charAt(0).toUpperCase();
  }

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        className="pointer-events-auto absolute left-4 top-24 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-[14px] border border-white/10 bg-slate-900/85 text-lg shadow-2xl backdrop-blur-md transition hover:bg-slate-800/90"
        title="Agent activity"
      >
        <span className={entries.length > 0 ? "animate-pulse" : ""}>🤖</span>
        {entries.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {entries.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="pointer-events-auto absolute left-4 top-24 z-50 flex h-[320px] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/85 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full ${entries.length > 0 ? "animate-ping bg-orange-400 opacity-60" : "bg-slate-600"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${entries.length > 0 ? "bg-orange-500" : "bg-slate-600"}`} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">Agent activity</span>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          aria-label="Collapse agent activity"
          className="cursor-pointer text-slate-500 transition hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3" aria-live="polite">
        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-xs font-semibold text-slate-300">No agents running right now</p>
            <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
              Connect Claude Code and its live work shows up here. Tap a player to peek at their agent.
            </p>
          </div>
        ) : (
          entries.map(([userId, activity]) => (
            <button
              key={userId}
              type="button"
              onClick={() => onSelect?.(userId)}
              className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.04] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white">
                  {initialFor(userId)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-white">{nameFor(userId)}</span>
                    <span className="shrink-0 text-[9px] uppercase tracking-wider text-slate-500">{relativeTime(activity.at)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">Agent working</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-emerald-300/90">
                {activity.text}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
