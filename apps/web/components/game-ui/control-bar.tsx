"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Smile, LogOut } from "lucide-react";









type ControlBarProps = {

  displayName?: string;

  onLeave?: () => void;

  onReact?: (emoji: string) => void;

  micOn?: boolean;
  camOn?: boolean;
  onToggleMic?: () => void;
  onToggleCam?: () => void;

  onUpdateName?: (newName: string) => Promise<void>;
};

const REACTION_EMOJIS = ["👋", "👍", "❤️", "😂", "🎉", "🙌", "🔥", "👏"];

export function ControlBar({
  displayName = "You",
  onLeave,
  onReact,
  micOn: micProp,
  camOn: camProp,
  onToggleMic,
  onToggleCam,
  onUpdateName,
}: ControlBarProps) {
  const [localMic, setLocalMic] = useState(true);
  const [localCam, setLocalCam] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);


  useEffect(() => {
    setNewName(displayName);
  }, [displayName]);


  const micOn = micProp ?? localMic;
  const camOn = camProp ?? localCam;
  const toggleMic = onToggleMic ?? (() => setLocalMic((v) => !v));
  const toggleCam = onToggleCam ?? (() => setLocalCam((v) => !v));


  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (


    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3 z-50">

      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs pointer-events-auto">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes nameSlideIn {
              0% { opacity: 0; transform: translateY(12px) scale(0.95); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-name-slide-in {
              animation: nameSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = newName.trim();
              if (name && name !== displayName && onUpdateName) {
                await onUpdateName(name);
              }
              setIsEditingName(false);
            }}
            className="w-full max-w-sm rounded-[22px] border border-slate-200/80 bg-white p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-name-slide-in"
          >
            <div className="flex flex-col gap-1 select-none">
              <h3 className="text-sm font-bold text-slate-800">Change Display Name</h3>
              <p className="text-xs text-slate-400">Enter a display name to represent you in the space.</p>
            </div>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Display Name"
              maxLength={25}
              required
              autoFocus
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none transition-all duration-200"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 border border-transparent bg-transparent px-0 py-0 shadow-none backdrop-blur-none transition-all duration-300">

        <button
          type="button"
          onClick={() => {
            setNewName(displayName);
            setIsEditingName(true);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/90 text-sm font-semibold text-white shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
          title="Change display name"
        >
          {initial}
        </button>

        <div className="mx-1 h-6 w-px bg-slate-400/30" aria-hidden="true" />


        <ControlButton
          label={micOn ? "Mute microphone" : "Unmute microphone"}
          pressed={micOn}
          danger={!micOn}
          onClick={toggleMic}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </ControlButton>


        <ControlButton
          label={camOn ? "Turn camera off" : "Turn camera on"}
          pressed={camOn}
          danger={!camOn}
          onClick={toggleCam}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </ControlButton>


        <div className="relative">
          {pickerOpen && (
            <div className="absolute bottom-13 left-1/2 flex -translate-x-1/2 gap-1 border border-slate-700/40 bg-slate-900/80 p-2 rounded-xl shadow-2xl backdrop-blur-md">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact?.(emoji);
                    setPickerOpen(false);
                  }}
                  aria-label={`React with ${emoji}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#aebeff]"
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

        <div className="mx-1 h-6 w-px bg-slate-400/30" aria-hidden="true" />


        <button
          type="button"
          onClick={onLeave}
          aria-label="Leave space"
          className="flex h-9 items-center gap-2 rounded-xl bg-red-500/80 px-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-600 active:scale-95 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200 motion-reduce:transition-none cursor-pointer"
        >
          <LogOut size={16} />
          Leave
        </button>
      </div>
    </div>
  );
}





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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200 active:scale-95 cursor-pointer " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 motion-reduce:transition-none " +
        (danger
          ? "bg-red-500/80 hover:bg-red-600 shadow-sm"
          : "bg-slate-800/60 hover:bg-slate-700/80 shadow-sm")
      }
    >
      {children}
    </button>
  );
}
