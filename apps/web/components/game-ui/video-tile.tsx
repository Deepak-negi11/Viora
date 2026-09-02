"use client";

import { useEffect, useRef } from "react";



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

export function VideoLayer({
  localStream,
  remoteStreams,
  names,
}: {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  names: Record<string, string>;
}) {
  const remotes = Object.entries(remoteStreams);

  if (remotes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 flex flex-col gap-2">

      {localStream && <VideoTile stream={localStream} label="You" muted />}
      {remotes.map(([id, stream]) => (
        <VideoTile key={id} stream={stream} label={names[id] ?? id.slice(0, 5)} />
      ))}
    </div>
  );
}

function ScreenTile({ stream, label, muted }: { stream: MediaStream; label: string; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative h-[min(38vh,300px)] w-[min(46vw,540px)] overflow-hidden rounded-xl bg-neutral-900 shadow-2xl ring-1 ring-white/15">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-contain" />
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
        {label}
      </span>
    </div>
  );
}

export function ScreenLayer({
  localScreenStream,
  remoteScreenStreams,
  names,
}: {
  localScreenStream: MediaStream | null;
  remoteScreenStreams: Record<string, MediaStream>;
  names: Record<string, string>;
}) {
  const remotes = Object.entries(remoteScreenStreams);

  if (!localScreenStream && remotes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 flex -translate-x-1/2 flex-col gap-2">
      {localScreenStream && <ScreenTile stream={localScreenStream} label="Your screen" muted />}
      {remotes.map(([id, stream]) => (
        <ScreenTile key={id} stream={stream} label={`${names[id] ?? id.slice(0, 5)}'s screen`} />
      ))}
    </div>
  );
}
