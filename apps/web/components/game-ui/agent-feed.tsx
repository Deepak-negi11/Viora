"use client";

import { useState } from "react";
import type { AgentActivities } from "../../hooks/use-space-socket";

type AgentFeedProps = {
  agentActivities: AgentActivities;
  names: Record<string, string>;
  selfId: string | null;
};

function relativeTime(at: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AgentFeed({ agentActivities, names, selfId }: AgentFeedProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const entries = Object.entries(agentActivities).sort((a, b) => b[1].at - a[1].at);

  function nameFor(userId: string) {
    const name = names[userId] ?? (userId === selfId ? "You" : userId.slice(0, 5));
    return name.length > 18 ? `${name.slice(0, 18)}...` : name;
  }

  if (isCollapsed) {
    return (
      <div
        className="pointer-events-auto absolute left-4 top-24 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-[14px] bg-slate-900/90 text-lg shadow-2xl backdrop-blur-md transition hover:bg-slate-800"
        onClick={() => setIsCollapsed(false)}
        title="What agents are cooking"
      >
        🧑‍🍳
        {entries.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {entries.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute left-4 top-24 z-50 flex h-[300px] w-[min(19rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setIsCollapsed(true)}
        className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-slate-800 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          What agents are cooking
        </span>
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3" aria-live="polite">
        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-xs font-semibold text-slate-500">Nothing cooking right now</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              Connect your AI agent and its live activity shows up here for everyone in the space.
            </p>
          </div>
        ) : (
          entries.map(([userId, activity]) => (
            <div key={userId} className="rounded-2xl bg-slate-100 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <span className="animate-pulse">🧑‍🍳</span>
                  <span className="truncate">{nameFor(userId)}&apos;s agent</span>
                </span>
                <span className="shrink-0 text-[9px] text-slate-400">{relativeTime(activity.at)}</span>
              </div>
              <p className="mt-1 break-words text-xs leading-normal text-slate-800">{activity.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
