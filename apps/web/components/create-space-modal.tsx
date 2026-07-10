"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { getAuthToken } from "../lib/auth-token";
import { createSpace, type SpaceSummary } from "../lib/space-api";

type CreateSpaceModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (space: SpaceSummary) => void;
};

export function CreateSpaceModal({ open, onClose, onCreated }: CreateSpaceModalProps) {
  const [name, setName] = useState("");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError("You are not signed in.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dimensions = `${width}x${height}`;
      const { spaceId } = await createSpace(token, { name, dimensions });

      onCreated({ id: spaceId, name, dimensions, thumbnail: null });
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243a]/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-space-title"
        className="w-full max-w-lg border-2 border-[#111827] bg-[#f8fbff] p-5 shadow-[8px_8px_0_#183a8f] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#111827] pb-5">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.12em] text-[#183a8f]">NEW TEAM SPACE</p>
            <h2 id="create-space-title" className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#111827]">Start with a floor plan.</h2>
            <p className="mt-2 text-sm leading-6 text-[#52627b]">Name the room and pick its working dimensions. You can make it yours from there.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-[#5e708a] transition-colors hover:bg-[#dbe8f8] hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#183a8f]" aria-label="Close create space dialog">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="space-name" className="font-mono text-xs font-bold tracking-[0.08em] text-[#344866]">
              ROOM NAME
            </label>
            <input
              id="space-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Design studio"
              required
              className="h-11 border-2 border-[#9eafc6] bg-white px-3 text-sm text-[#111827] outline-none placeholder:text-[#718198] transition-colors focus:border-[#183a8f] focus:ring-2 focus:ring-[#183a8f]/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="space-width" className="font-mono text-xs font-bold tracking-[0.08em] text-[#344866]">
                WIDTH
              </label>
              <input
                id="space-width"
                type="number"
                min={1}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="h-11 border-2 border-[#9eafc6] bg-white px-3 text-sm text-[#111827] outline-none transition-colors focus:border-[#183a8f] focus:ring-2 focus:ring-[#183a8f]/20"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="space-height" className="font-mono text-xs font-bold tracking-[0.08em] text-[#344866]">
                HEIGHT
              </label>
              <input
                id="space-height"
                type="number"
                min={1}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="h-11 border-2 border-[#9eafc6] bg-white px-3 text-sm text-[#111827] outline-none transition-colors focus:border-[#183a8f] focus:ring-2 focus:ring-[#183a8f]/20"
              />
            </div>
          </div>

          {error && <p className="border border-[#b7483d] bg-[#fff4f2] px-3 py-2 text-sm text-[#8b2f29]">{error}</p>}

          <div className="mt-1 flex flex-wrap items-center justify-end gap-3 border-t border-[#b9c7d9] pt-5">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-sm text-[#4b5a70] hover:bg-[#dbe8f8] hover:text-[#111827]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2 rounded-sm bg-[#183a8f] shadow-[3px_3px_0_#111827] hover:bg-[#2451b2]">
              {isSubmitting ? "Creating…" : "Create space"}
              {!isSubmitting && <ArrowRight size={16} aria-hidden="true" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
