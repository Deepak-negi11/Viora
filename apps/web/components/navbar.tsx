"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Grid2X2 } from "lucide-react";
import { ModeToggle } from "./dark-mode";

type NavbarProps = {
  showThemeToggle?: boolean;
};

export function Navbar({ showThemeToggle = true }: NavbarProps) {
  const pathname = usePathname();
  const isSpaces = pathname === "/spaces";

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fbfbf9]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b5c40]">
          <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-[#171a18] text-[10px] font-extrabold tracking-[-0.1em] text-[#d9ff6f] transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden="true">2D</span>
          <span className="text-sm font-semibold tracking-[-0.025em] text-[#171a18]">Metaverse</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm" aria-label="Primary navigation">
          <Link
            href="/spaces"
            className={`hidden items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors sm:inline-flex ${isSpaces ? "bg-[#edf0ec] text-[#171a18]" : "text-[#5a615c] hover:bg-[#edf0ec] hover:text-[#171a18]"}`}
          >
            <Grid2X2 size={15} aria-hidden="true" />
            Spaces
          </Link>
          {!isSpaces && (
            <a href="#how-it-works" className="hidden rounded-md px-3 py-2 font-medium text-[#5a615c] transition-colors hover:bg-[#edf0ec] hover:text-[#171a18] sm:inline-flex">
              How it works
            </a>
          )}
          <Link href="/signin" className="rounded-md px-3 py-2 font-medium text-[#4c544e] transition-colors hover:bg-[#edf0ec] hover:text-[#171a18]">
            Sign in
          </Link>
          <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-md bg-[#171a18] px-3 py-2 font-semibold text-white transition-colors hover:bg-[#323934] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b5c40]">
            Get started
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          {showThemeToggle && <span className="hidden sm:inline-flex"><ModeToggle /></span>}
        </nav>
      </div>
    </header>
  );
}
