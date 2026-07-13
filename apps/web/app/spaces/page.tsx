"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight, Boxes, Plus, Search, Share2, Check, Trash2, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Navbar } from "../../components/navbar";
import { CreateSpaceModal } from "../../components/create-space-modal";
import { getAuthToken } from "../../lib/auth-token";
import { listSpaces, deleteSpace, type SpaceSummary } from "../../lib/space-api";

type Status = "loading" | "ready" | "error";

export default function SpacePage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteSpaceId, setDeleteSpaceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleShare = async (spaceId: string) => {
    try {
      const shareLink = `${window.location.origin}/space/${spaceId}`;
      await navigator.clipboard.writeText(shareLink);
      setCopiedId(spaceId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/signin");
      return;
    }

    listSpaces(token)
      .then((res) => {
        setSpaces(res.spaces);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load spaces");
        setStatus("error");
      });
  }, [router]);

  function handleEnter(spaceId: string) {
    router.push(`/space/${spaceId}`);
  }

  async function confirmDelete() {
    if (!deleteSpaceId) return;
    const token = getAuthToken();
    if (!token) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteSpace(token, deleteSpaceId);
      setSpaces((current) => current.filter((space) => space.id !== deleteSpaceId));
      setDeleteSpaceId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete the space");
    } finally {
      setIsDeleting(false);
    }
  }

  const visibleSpaces = spaces.filter((space) =>
    space.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative min-h-screen bg-background text-[#111827] dark:text-[#e1e1e6] transition-colors duration-300">
      {/* Background dot matrix grid */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]" />

      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:py-12 relative z-10">
        <section className="border-b-2 border-[#111827] dark:border-white/20 pb-7 sm:pb-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.13em] text-[#183a8f] dark:text-[#60a5fa]">YOUR TEAM SPACES</p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] text-[#111827] dark:text-white sm:text-5xl">Pick a room. Walk in.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b5a70] dark:text-[#a1a1aa] sm:text-base">
                Every space has a purpose. Choose one to work alongside your team, or make a new place for what comes next.
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="gap-2 rounded-sm bg-[#183a8f] dark:bg-[#3b82f6] shadow-[3px_3px_0_#111827] dark:shadow-[3px_3px_0_#000] hover:bg-[#2451b2] dark:hover:bg-[#60a5fa] text-white dark:text-black font-bold">
              <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              New space
            </Button>
          </div>
        </section>

        <section className="mt-7 flex flex-col gap-4 border-2 border-[#111827] dark:border-white bg-white dark:bg-[#1a1a1f] p-3 shadow-[5px_5px_0_#111827] dark:shadow-[5px_5px_0_#fff] sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60718c] dark:text-[#a1a1aa]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a room"
              aria-label="Find a room"
              className="h-11 w-full border-2 border-[#9eafc6] dark:border-[#2e2e38] bg-white dark:bg-[#1e1e24] py-2 pl-10 pr-10 text-sm text-[#111827] dark:text-[#e1e1e6] outline-none transition-colors placeholder:text-[#718198] focus:border-[#183a8f] dark:focus:border-white focus:ring-2 focus:ring-[#183a8f]/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#60718c] dark:text-[#a1a1aa] transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#111827] dark:hover:text-[#e1e1e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#183a8f]"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>
          <p className="px-2 font-mono text-xs font-bold tracking-[0.08em] text-[#52627b] dark:text-[#a1a1aa]">
            {status === "ready" ? `${spaces.length} ${spaces.length === 1 ? "ROOM" : "ROOMS"}` : "LOADING ROOMS"}
          </p>
        </section>

        <section className="mt-8">
          {status === "loading" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading spaces">
              {[0, 1, 2].map((item) => (
                <div key={item} className="border-2 border-[#a7b5c9] dark:border-[#2e2e38] bg-white dark:bg-[#1a1a1f] p-4 shadow-[4px_4px_0_#111827] dark:shadow-[4px_4px_0_#000]">
                  <div className="h-32 animate-pulse bg-gray-200 dark:bg-gray-800 motion-reduce:animate-none" />
                  <div className="mt-5 h-5 w-3/5 animate-pulse bg-gray-200 dark:bg-gray-800 motion-reduce:animate-none" />
                  <div className="mt-3 h-3 w-2/5 animate-pulse bg-gray-200 dark:bg-gray-800 motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="border-2 border-[#b7483d] bg-[#fff5f3] dark:bg-[#1a1111] p-5 text-sm text-[#8b2f29] dark:text-[#f87171]">
              {error ?? "We could not load your spaces. Please refresh and try again."}
            </div>
          )}

          {status === "ready" && visibleSpaces.length === 0 && (
            <div className="grid min-h-80 place-items-center border-2 border-dashed border-[#7f91aa] dark:border-[#2e2e38] bg-white dark:bg-[#1a1a1f] p-8 text-center shadow-[6px_6px_0_#111827] dark:shadow-[6px_6px_0_#000]">
              <div className="max-w-md">
                <span className="mx-auto grid h-12 w-12 place-items-center bg-[#79e1ca] dark:bg-[#0ea5e9] text-[#111827] dark:text-black shadow-[3px_3px_0_#111827] dark:shadow-[3px_3px_0_#000]">
                  <Boxes size={23} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-[#111827] dark:text-white">
                  {query ? "Nothing matches that search" : "A blank floor plan is a good start"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#52627b] dark:text-[#a1a1aa]">
                  {query ? "Try another name, or clear the search to see every room." : "Create a space for focus, catch-ups, or the conversations that should not need a calendar invite."}
                </p>
                {!query && (
                  <Button variant="primary" className="mt-5 gap-2 rounded-sm bg-[#183a8f] dark:bg-[#3b82f6] shadow-[3px_3px_0_#111827] dark:shadow-[3px_3px_0_#000] hover:bg-[#2451b2] dark:hover:bg-[#60a5fa] text-white dark:text-black font-bold" onClick={() => setIsCreateOpen(true)}>
                    <Plus size={16} aria-hidden="true" />
                    Create a space
                  </Button>
                )}
              </div>
            </div>
          )}

          {status === "ready" && visibleSpaces.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleSpaces.map((space) => (
                <article key={space.id} className="group border-2 border-[#111827] dark:border-white bg-white dark:bg-[#1a1a1f] shadow-[5px_5px_0_#111827] dark:shadow-[5px_5px_0_#fff] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none">
                  <div
                    className="relative flex h-36 items-end overflow-hidden border-b-2 border-[#111827] dark:border-white/20 bg-gray-100 dark:bg-[#25252d] p-4"
                    style={{ backgroundImage: "linear-gradient(rgba(49, 67, 95, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(49, 67, 95, 0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
                  >
                    <div className="absolute inset-x-7 bottom-0 h-16 border-x-4 border-t-4 border-[#75839a] dark:border-[#475569] bg-[#e9d7ac] dark:bg-[#b5a37a] shadow-[inset_0_0_0_3px_#f7ebce] dark:shadow-[inset_0_0_0_3px_#dcd1b5]" aria-hidden="true" />
                    {space.thumbnail ? (
                      <Image src={space.thumbnail} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                    ) : (
                      <>
                        <span className="relative grid h-12 w-12 place-items-center bg-[#183a8f] dark:bg-[#3b82f6] text-xl font-bold text-white dark:text-black shadow-[3px_3px_0_#111827] dark:shadow-[3px_3px_0_#000]">
                          {space.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="relative ml-3 border border-[#183a8f] dark:border-[#60a5fa] bg-white dark:bg-[#1a1a1f] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[#183a8f] dark:text-[#60a5fa]">ROOM</span>
                      </>
                    )}
                  </div>
                  <div className="flex min-h-36 flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold tracking-[-0.035em] text-[#111827] dark:text-white">{space.name}</h2>
                        <p className="mt-1 font-mono text-xs font-bold tracking-[0.07em] text-[#667891] dark:text-[#a1a1aa]">{space.dimensions ?? "CUSTOM SIZE"}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <button type="button" onClick={() => handleEnter(space.id)} className="inline-flex items-center gap-1.5 font-semibold text-[#183a8f] dark:text-[#60a5fa] underline decoration-[#88a0c0] dark:decoration-[#60a5fa]/60 underline-offset-4 transition-colors hover:text-[#111827] dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183a8f]">
                        Enter this room
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShare(space.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-sm border-2 border-[#111827] dark:border-white bg-white dark:bg-[#1a1a1f] px-2.5 text-xs font-bold text-[#111827] dark:text-[#e1e1e6] shadow-[2px_2px_0_#111827] dark:shadow-[2px_2px_0_#fff] transition hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#111827] dark:hover:shadow-[1px_1px_0_#fff]"
                          title="Copy share link"
                        >
                          {copiedId === space.id ? (
                            <>
                              <Check size={14} className="text-[#1aa385]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Share2 size={14} />
                              Share
                            </>
                          )}
                        </button>
                        <button type="button" onClick={() => setDeleteSpaceId(space.id)} className="inline-flex h-9 w-9 items-center justify-center border border-transparent text-[#718198] dark:text-[#a1a1aa] transition-colors hover:border-[#b7483d] hover:bg-[#fff4f2] dark:hover:bg-[#fff4f2]/10 hover:text-[#a23c33] dark:hover:text-[#f87171] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b7483d]" aria-label={`Delete ${space.name}`} title="Delete space">
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateSpaceModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(space) => setSpaces((previous) => [space, ...previous])}
      />

      <DeleteConfirmModal
        isOpen={deleteSpaceId !== null}
        spaceName={spaces.find((s) => s.id === deleteSpaceId)?.name ?? ""}
        isDeleting={isDeleting}
        error={deleteError}
        onCancel={() => {
          setDeleteSpaceId(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  spaceName: string;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ isOpen, spaceName, isDeleting, error, onCancel, onConfirm }: DeleteConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17243a]/55 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md border-2 border-[#111827] bg-[#f8fbff] p-5 shadow-[8px_8px_0_#b7483d] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b-2 border-[#111827] pb-4">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.12em] text-[#b7483d]">DANGER ZONE</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#111827]">Delete space?</h2>
          </div>
          <button type="button" onClick={onCancel} className="inline-flex h-8 w-8 items-center justify-center text-[#5e708a] transition-colors hover:bg-[#fff4f2] hover:text-[#b7483d]" aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm leading-6 text-[#4b5a70]">
            Are you sure you want to delete <strong className="text-[#111827]">{spaceName}</strong>? This action is permanent and cannot be undone.
          </p>
          {error && (
            <p className="mt-4 border border-[#b7483d] bg-[#fff4f2] px-3 py-2 text-sm text-[#8b2f29]">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[#b9c7d9] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-10 rounded-sm border border-[#9eafc6] bg-white px-4 text-sm font-semibold text-[#4b5a70] transition hover:bg-[#eff5fc] hover:text-[#111827] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-sm bg-[#b7483d] px-4 text-sm font-bold text-white shadow-[3px_3px_0_#111827] transition hover:translate-x-px hover:translate-y-px hover:bg-[#cb584d] hover:shadow-[2px_2px_0_#111827] disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete Space"}
          </button>
        </div>
      </div>
    </div>
  );
}
