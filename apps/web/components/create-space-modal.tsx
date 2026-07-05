"use client";

import { type FormEvent, useState } from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-100">Create a space</h2>
        <p className="mt-1 text-sm text-neutral-400">Give it a name and a size.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="space-name" className="text-sm text-neutral-300">
              Name
            </label>
            <input
              id="space-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="math-class"
              required
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus-visible:border-neutral-600 focus-visible:outline-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="space-width" className="text-sm text-neutral-300">
                Width
              </label>
              <input
                id="space-width"
                type="number"
                min={1}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus-visible:border-neutral-600 focus-visible:outline-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="space-height" className="text-sm text-neutral-300">
                Height
              </label>
              <input
                id="space-height"
                type="number"
                min={1}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus-visible:border-neutral-600 focus-visible:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create space"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
