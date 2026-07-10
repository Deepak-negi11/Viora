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
  // called when you pick an emoji reaction
  onReact?: (emoji: string) => void;
  // real mic/camera state + toggles from the WebRTC hook (optional; falls back to local UI state)
  micOn?: boolean;
  camOn?: boolean;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
};

const REACTION_EMOJIS = ["👋", "👍", "❤️", "😂", "🎉", "🙌", "🔥", "👏"];

export function ControlBar({ displayName = "You", onLeave, onReact, micOn: micProp, camOn: camProp, onToggleMic, onToggleCam }: ControlBarProps) {
  const [localMic, setLocalMic] = useState(true);
  const [localCam, setLocalCam] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  // prefer the real WebRTC controls when the page passes them; otherwise use local UI state
  const micOn = micProp ?? localMic;
  const camOn = camProp ?? localCam;
  const toggleMic = onToggleMic ?? (() => setLocalMic((v) => !v));
  const toggleCam = onToggleCam ?? (() => setLocalCam((v) => !v));

  // first letter for the avatar circle, e.g. "deepak" -> "D"
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    // Full-width strip pinned to the bottom. pointer-events-none means clicks
    // PASS THROUGH the empty areas to the Phaser canvas (so click-to-walk still works).
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3">
      {/* the actual bar re-enables pointer events so its buttons are clickable */}
      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 border border-[#3a4962] bg-[#111827]/95 px-2 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur">
        {/* your avatar chip */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#183a8f] text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {initial}
        </div>

        <div className="mx-1 h-6 w-px bg-[#3a4962]" aria-hidden="true" />

        {/* microphone toggle */}
        <ControlButton
          label={micOn ? "Mute microphone" : "Unmute microphone"}
          pressed={micOn}
          danger={!micOn}
          onClick={toggleMic}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </ControlButton>

        {/* camera toggle */}
        <ControlButton
          label={camOn ? "Turn camera off" : "Turn camera on"}
          pressed={camOn}
          danger={!camOn}
          onClick={toggleCam}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </ControlButton>

        {/* emoji reactions */}
        <div className="relative">
          {pickerOpen && (
            <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1 border border-[#3a4962] bg-[#111827] p-2 shadow-xl">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact?.(emoji);
                    setPickerOpen(false);
                  }}
                  aria-label={`React with ${emoji}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-[#26334a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#aebeff]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <ControlButton
            label="Send a reaction"
            pressed={pickerOpen}
            onClick={() => setPickerOpen((v) => !v)}
          >
            <Smile size={18} />
          </ControlButton>
        </div>

        <div className="mx-1 h-6 w-px bg-[#3a4962]" aria-hidden="true" />

        {/* leave the space */}
        <button
          type="button"
          onClick={onLeave}
          aria-label="Leave space"
          className="flex h-9 items-center gap-2 rounded-md bg-[#b7483d] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#cb584d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200 motion-reduce:transition-none"
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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white transition-colors " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aebeff] motion-reduce:transition-none " +
        (danger
          ? "bg-[#b7483d] hover:bg-[#cb584d]"
          : "bg-[#26334a] hover:bg-[#344563]")
      }
    >
      {children}
    </button>
  );
}
