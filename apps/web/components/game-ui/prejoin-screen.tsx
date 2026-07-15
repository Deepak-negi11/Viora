"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, LoaderCircle, Mic, MicOff, TriangleAlert } from "lucide-react";
import type { LocalMediaController } from "../../hooks/use-local-media";

type PrejoinScreenProps = {
  media: LocalMediaController;
  spaceName: string;
  initialName: string;
  onEnter: (displayName: string) => Promise<void>;
};

const LEVEL_BARS = 12;

export function PrejoinScreen({ media, spaceName, initialName, onEnter }: PrejoinScreenProps) {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [displayName, setDisplayName] = useState(initialName);
  const [isEntering, setIsEntering] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const isRequesting = media.micStatus === "requesting" || media.camStatus === "requesting";
  const permissionBlocked = media.micStatus === "blocked" || media.camStatus === "blocked";

  useEffect(() => {
    if (previewRef.current) previewRef.current.srcObject = media.stream;
  }, [media.stream]);

  useEffect(() => {
    const audioTrack = media.stream?.getAudioTracks()[0];
    if (!media.micOn || !media.stream || !audioTrack) {
      setAudioLevel(0);
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const measure = () => {
      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      setAudioLevel(Math.min(1, average / 80));
      frame = requestAnimationFrame(measure);
    };
    measure();

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, [media.micOn, media.stream]);

  async function handleEnter() {
    const name = displayName.trim();
    if (!name) {
      setEntryError("Enter your name to continue.");
      return;
    }

    setEntryError(null);
    setIsEntering(true);
    try {
      await onEnter(name);
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : "Could not enter the space.");
      setIsEntering(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-5 py-10 font-sans text-[#202020] sm:px-8 lg:grid lg:place-items-center">
      <div className="mx-auto grid w-full max-w-[1060px] gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-center lg:gap-16">
        <section className="overflow-hidden rounded-[22px] bg-[#242424] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="relative aspect-[1.58/1] min-h-[300px]">
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full scale-x-[-1] object-cover ${media.camOn ? "block" : "hidden"}`}
            />

            {!media.camOn && (
              <div className="grid h-full place-items-center text-center text-[#d6d6d6]">
                <p className="text-base font-medium tracking-[-0.01em] text-[#d8d8d8] sm:text-lg">Your camera is off</p>
              </div>
            )}

            {media.micOn && (
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-[#292929]/90 px-2.5 py-2 shadow-lg backdrop-blur-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[#202020]">
                  <Mic size={12} strokeWidth={3} />
                </span>
                <div className="flex h-4 items-center gap-[4px]" aria-label="Microphone level">
                  {Array.from({ length: LEVEL_BARS }, (_, index) => {
                    const isActive = index < Math.max(1, Math.round(audioLevel * LEVEL_BARS));
                    return (
                      <span
                        key={index}
                        className={`h-3 w-[4px] rounded-full transition-colors ${isActive ? "bg-[#29d873]" : "bg-white"}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-3 flex justify-center sm:bottom-5">
              <div className="flex items-center gap-1.5 rounded-[20px] bg-[#303030]/95 p-2 shadow-xl backdrop-blur-md">
                <MediaButton
                  label={media.micOn ? "Turn microphone off" : "Turn microphone on"}
                  active={media.micOn}
                  loading={media.micStatus === "requesting"}
                  onClick={() => void media.toggleMic()}
                >
                  {media.micOn ? <Mic size={22} /> : <MicOff size={22} />}
                </MediaButton>
                <MediaButton
                  label={media.camOn ? "Turn camera off" : "Turn camera on"}
                  active={media.camOn}
                  loading={media.camStatus === "requesting"}
                  onClick={() => void media.toggleCam()}
                >
                  {media.camOn ? <Camera size={22} /> : <CameraOff size={22} />}
                </MediaButton>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[360px]">
          <h2 className="mb-1 text-xl font-semibold tracking-tight text-[#1a1a1a]">
            Join {spaceName}
          </h2>
          <p className="mb-5 text-sm text-[#606060]">
            Enter your display name to enter the space.
          </p>
          <label htmlFor="prejoin-name" className="sr-only">Display name</label>
          <input
            id="prejoin-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleEnter();
            }}
            maxLength={25}
            autoComplete="name"
            className="h-11 w-full rounded-[10px] border border-[#c9c9c9] bg-white px-3.5 text-[16px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#6771e9] focus:ring-2 focus:ring-[#dfe2ff]"
          />
          <button
            type="button"
            onClick={() => void handleEnter()}
            disabled={isRequesting || isEntering}
            className="mt-2.5 flex h-11 w-full items-center justify-center rounded-[10px] bg-[#3f4ae8] px-5 text-[16px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition hover:bg-[#3540d7] disabled:cursor-wait disabled:opacity-60"
          >
            {isEntering ? <LoaderCircle className="animate-spin" size={21} /> : "Next"}
          </button>

          {permissionBlocked && (
            <p className="mt-4 flex items-center gap-2 text-sm text-amber-700">
              <TriangleAlert size={16} /> Check your browser settings to allow a blocked device.
            </p>
          )}
          {entryError && <p className="mt-3 text-sm text-red-600">{entryError}</p>}
        </section>
      </div>
    </main>
  );
}

function MediaButton({
  label,
  active,
  loading,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={loading}
      onClick={onClick}
      className={`grid h-11 w-14 place-items-center rounded-[14px] transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70 ${
        active ? "bg-[#244a35] text-[#29df79]" : "bg-[#353535] text-[#ef5b62]"
      }`}
    >
      {loading ? <LoaderCircle className="animate-spin" size={20} /> : children}
    </button>
  );
}
