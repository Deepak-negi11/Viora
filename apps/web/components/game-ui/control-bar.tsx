"use client";

import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Smile, LogOut } from "lucide-react";

// The bottom control bar — the signature Gather-style chrome.
//
// IMPORTANT: this is a REACT OVERLAY that sits ON TOP of the Phaser <canvas>.
// It is NOT a game object. The world (floor/walls/avatars) is drawn by Phaser;
// this HTML bar floats above it, exactly like WorkAdventure/Gather do.
//
// For now the mic/camera buttons are visual toggles (local state only). They get
// wired to real WebRTC audio/video later (the HARD step you'll type by hand).
type ControlBarProps = {
  // the signed-in user's name, used for the little avatar circle (first letter)
  displayName?: string;
  // called when "Leave" is pressed — the page decides where to go (e.g. back to /spaces)
  onLeave?: () => void;
};

export function ControlBar({ displayName = "You", onLeave }: ControlBarProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // first letter for the avatar circle, e.g. "deepak" -> "D"
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    // Full-width strip pinned to the bottom. pointer-events-none means clicks
    // PASS THROUGH the empty areas to the Phaser canvas (so click-to-walk still works).
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
      {/* the actual bar re-enables pointer events so its buttons are clickable */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-neutral-900/90 px-3 py-2 shadow-xl ring-1 ring-white/10 backdrop-blur">
        {/* your avatar chip */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {initial}
        </div>

        <div className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />

        {/* microphone toggle */}
        <ControlButton
          label={micOn ? "Mute microphone" : "Unmute microphone"}
          pressed={micOn}
          danger={!micOn}
          onClick={() => setMicOn((v) => !v)}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </ControlButton>

        {/* camera toggle */}
        <ControlButton
          label={camOn ? "Turn camera off" : "Turn camera on"}
          pressed={camOn}
          danger={!camOn}
          onClick={() => setCamOn((v) => !v)}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </ControlButton>

        {/* emoji (does nothing yet) */}
        <ControlButton label="Send an emoji" onClick={() => {}}>
          <Smile size={18} />
        </ControlButton>

        <div className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />

        {/* leave the space */}
        <button
          type="button"
          onClick={onLeave}
          aria-label="Leave space"
          className="flex h-9 items-center gap-2 rounded-xl bg-red-500/90 px-3 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 motion-reduce:transition-none"
        >
          <LogOut size={18} />
          Leave
        </button>
      </div>
    </div>
  );
}

// A single round icon button used inside the bar.
// - `pressed` drives aria-pressed (for toggles like mic/camera).
// - `danger` tints it red when the feature is OFF (mic muted / camera off),
//   so state is never shown by colour ALONE — the icon changes too (WCAG).
type ControlButtonProps = {
  label: string;
  pressed?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ControlButton({ label, pressed, danger, onClick, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={
        "flex h-9 w-9 items-center justify-center rounded-xl text-white transition-colors " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 motion-reduce:transition-none " +
        (danger
          ? "bg-red-500/90 hover:bg-red-500"
          : "bg-white/5 hover:bg-white/15")
      }
    >
      {children}
    </button>
  );
}
