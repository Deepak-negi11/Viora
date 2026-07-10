"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight, Boxes, Plus, Search, Trash2, X } from "lucide-react";
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

  async function handleDelete(spaceId: string) {
    const token = getAuthToken();
    if (!token) return;

    if (!window.confirm("Delete this space? This cannot be undone.")) return;

    try {
      await deleteSpace(token, spaceId);
      setSpaces((current) => current.filter((space) => space.id !== spaceId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete the space");
    }
  }

  const visibleSpaces = spaces.filter((space) =>
    space.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#dbe8f8] text-[#111827]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:py-12">
        <section className="border-b-2 border-[#111827] pb-7 sm:pb-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.13em] text-[#183a8f]">YOUR TEAM SPACES</p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] text-[#111827] sm:text-5xl">Pick a room. Walk in.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4b5a70] sm:text-base">
                Every space has a purpose. Choose one to work alongside your team, or make a new place for what comes next.
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="gap-2 rounded-sm bg-[#183a8f] shadow-[3px_3px_0_#111827] hover:bg-[#2451b2]">
              <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              New space
            </Button>
          </div>
        </section>

        <section className="mt-7 flex flex-col gap-4 border-2 border-[#111827] bg-[#f8fbff] p-3 shadow-[5px_5px_0_#b3c4dc] sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60718c]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a room"
              aria-label="Find a room"
              className="h-11 w-full border-2 border-[#9eafc6] bg-white py-2 pl-10 pr-10 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#718198] focus:border-[#183a8f] focus:ring-2 focus:ring-[#183a8f]/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#60718c] transition-colors hover:bg-[#dbe8f8] hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#183a8f]"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>
          <p className="px-2 font-mono text-xs font-bold tracking-[0.08em] text-[#52627b]">
            {status === "ready" ? `${spaces.length} ${spaces.length === 1 ? "ROOM" : "ROOMS"}` : "LOADING ROOMS"}
          </p>
        </section>

        <section className="mt-8">
          {status === "loading" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading spaces">
              {[0, 1, 2].map((item) => (
                <div key={item} className="border-2 border-[#a7b5c9] bg-[#f8fbff] p-4">
                  <div className="h-32 animate-pulse bg-[#cad8e9] motion-reduce:animate-none" />
                  <div className="mt-5 h-5 w-3/5 animate-pulse bg-[#cad8e9] motion-reduce:animate-none" />
                  <div className="mt-3 h-3 w-2/5 animate-pulse bg-[#dce6f1] motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="border-2 border-[#b7483d] bg-[#fff5f3] p-5 text-sm text-[#8b2f29]">
              {error ?? "We could not load your spaces. Please refresh and try again."}
            </div>
          )}

          {status === "ready" && visibleSpaces.length === 0 && (
            <div className="grid min-h-80 place-items-center border-2 border-dashed border-[#7f91aa] bg-[#eff5fc] p-8 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid h-12 w-12 place-items-center bg-[#79e1ca] text-[#111827] shadow-[3px_3px_0_#111827]">
                  <Boxes size={23} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-[#111827]">
                  {query ? "Nothing matches that search" : "A blank floor plan is a good start"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#52627b]">
                  {query ? "Try another name, or clear the search to see every room." : "Create a space for focus, catch-ups, or the conversations that should not need a calendar invite."}
                </p>
                {!query && (
                  <Button variant="primary" className="mt-5 gap-2 rounded-sm bg-[#183a8f] shadow-[3px_3px_0_#111827] hover:bg-[#2451b2]" onClick={() => setIsCreateOpen(true)}>
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
                <article key={space.id} className="group border-2 border-[#111827] bg-[#f8fbff] shadow-[5px_5px_0_#b3c4dc] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none">
                  <div
                    className="relative flex h-36 items-end overflow-hidden border-b-2 border-[#111827] bg-[#bccce0] p-4"
                    style={{ backgroundImage: "linear-gradient(rgba(49, 67, 95, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(49, 67, 95, 0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
                  >
                    <div className="absolute inset-x-7 bottom-0 h-16 border-x-4 border-t-4 border-[#75839a] bg-[#e9d7ac] shadow-[inset_0_0_0_3px_#f7ebce]" aria-hidden="true" />
                    {space.thumbnail ? (
                      <Image src={space.thumbnail} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                    ) : (
                      <>
                        <span className="relative grid h-12 w-12 place-items-center bg-[#183a8f] text-xl font-bold text-white shadow-[3px_3px_0_#111827]">
                          {space.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="relative ml-3 border border-[#183a8f] bg-[#f8fbff] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[#183a8f]">ROOM</span>
                      </>
                    )}
                  </div>
                  <div className="flex min-h-36 flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold tracking-[-0.035em] text-[#111827]">{space.name}</h2>
                        <p className="mt-1 font-mono text-xs font-bold tracking-[0.07em] text-[#667891]">{space.dimensions ?? "CUSTOM SIZE"}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <button type="button" onClick={() => handleEnter(space.id)} className="inline-flex items-center gap-1.5 font-semibold text-[#183a8f] underline decoration-[#88a0c0] underline-offset-4 transition-colors hover:text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183a8f]">
                        Enter this room
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDelete(space.id)} className="inline-flex h-9 w-9 items-center justify-center border border-transparent text-[#718198] transition-colors hover:border-[#b7483d] hover:bg-[#fff4f2] hover:text-[#a23c33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b7483d]" aria-label={`Delete ${space.name}`} title="Delete space">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
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
    </div>
  );
}
