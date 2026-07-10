"use client";

import { useEffect, useRef } from "react";

// A <video> element can't accept a MediaStream via a normal prop —
// you must assign el.srcObject in an effect. This little wrapper does that.
function VideoTile({ stream, label, muted }: { stream: MediaStream; label: string; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative h-28 w-40 overflow-hidden rounded-xl bg-neutral-800 shadow-lg ring-1 ring-white/10">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
        {label}
      </span>
    </div>
  );
}

// Top-right stack of video tiles: your own (muted) + everyone currently near you.
export function VideoLayer({
  localStream,
  remoteStreams,
  names,
  selfId,
}: {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  names: Record<string, string>;
  selfId: string | null;
}) {
  const remotes = Object.entries(remoteStreams);
  if (!localStream && remotes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 flex flex-col gap-2">
      {/* your own tile is muted so you don't hear yourself echo */}
      {localStream && <VideoTile stream={localStream} label={selfId ? "You" : "You"} muted />}
      {remotes.map(([id, stream]) => (
        <VideoTile key={id} stream={stream} label={names[id] ?? id.slice(0, 5)} />
      ))}
    </div>
  );
}
