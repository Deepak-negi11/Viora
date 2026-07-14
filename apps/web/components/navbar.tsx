"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LogOut, User, Settings } from "lucide-react";
import { ModeToggle } from "./dark-mode";
import { getAuthToken, removeAuthToken, getAuthEmail, removeAuthEmail } from "../lib/auth-token";
import { EditProfileModal } from "./edit-profile-modal";
import { getUserProfile } from "../lib/auth-api";

type NavbarProps = {
  showThemeToggle?: boolean;
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as { userId: string };
  } catch {
    return null;
  }
}

export function Navbar({ showThemeToggle = true }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    setEmail(getAuthEmail());

    const savedUsername = localStorage.getItem("metaverse:username");
    setUsername(savedUsername);

    if (token && !savedUsername) {
      const parsed = parseJwt(token);
      if (parsed?.userId) {
        getUserProfile(token, parsed.userId)
          .then((res) => {
            const userMeta = res.avatars[0];
            if (userMeta?.username) {
              localStorage.setItem("metaverse:username", userMeta.username);
              setUsername(userMeta.username);
            }
          })
          .catch((err) => console.error("Failed to load user profile:", err));
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    removeAuthToken();
    removeAuthEmail();
    localStorage.removeItem("metaverse:username");
    setIsLoggedIn(false);
    setEmail(null);
    setUsername(null);
    setIsDropdownOpen(false);
    router.replace("/");
  };

  const isSignIn = pathname === "/signin";
  const isSignUp = pathname === "/signup";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/5 bg-transparent backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b5c40]">
            <Image
              src="/viora-mark.svg"
              alt=""
              width={30}
              height={30}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none"
            />
            <span className="text-sm font-semibold tracking-[-0.025em] text-[#171a18] dark:text-white">Viora</span>
          </Link>

          <nav className="flex items-center gap-1.5 text-sm" aria-label="Primary navigation">
            {/* If on Auth pages, show clean toggle link */}
            {isSignIn && (
              <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-sm border-2 border-[#111827] dark:border-white bg-[#171a18] dark:bg-white px-3 py-1.5 font-bold text-white dark:text-black shadow-[2px_2px_0_#111827] dark:shadow-[2px_2px_0_#fff] transition hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#111827] dark:hover:shadow-[1px_1px_0_#fff]">
                Get started
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            )}
            {isSignUp && (
              <Link href="/signin" className="rounded-md px-3 py-2 font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white">
                Sign in
              </Link>
            )}

            {/* Normal flow */}
            {!isSignIn && !isSignUp && (
              <>
                {isLoggedIn ? (
                  <div className="flex items-center gap-4">
                    {/* Account Dropdown Trigger container */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-colors focus:outline-none"
                        aria-label="Account Settings"
                      >
                        <User size={22} className="stroke-[1.75]" />
                      </button>

                      {/* Account Dropdown Card */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-[#2d2d2d] dark:bg-[#1f1f1f] border border-neutral-700/60 dark:border-neutral-800 rounded-2xl p-4 shadow-xl z-50 text-white animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="px-1 pb-3 mb-2 border-b border-neutral-700/50">
                            <p className="text-sm font-bold truncate text-[#e1e1e6]">
                              {username || "User Account"}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {email}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsDropdownOpen(false);
                                setIsEditProfileOpen(true);
                              }}
                              className="w-full flex items-center gap-2.5 px-1 py-1.5 text-sm text-[#e1e1e6] hover:text-white rounded-lg transition-colors font-medium text-left"
                            >
                              <Settings size={18} className="stroke-[1.75]" />
                              <span>Edit Profile</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-1 py-1.5 text-sm text-[#e1e1e6] hover:text-white rounded-lg transition-colors font-medium text-left border-t border-neutral-700/30 pt-2.5 mt-1.5"
                            >
                              <LogOut size={18} className="stroke-[1.75]" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <a href="#how-it-works" className="hidden rounded-md px-3 py-2 font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white sm:inline-flex">
                      How it works
                    </a>
                    <Link href="/signin" className="rounded-md px-3 py-2 font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white">
                      Sign in
                    </Link>
                    <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-sm border-2 border-[#111827] dark:border-white bg-[#171a18] dark:bg-white px-3 py-1.5 font-bold text-white dark:text-black shadow-[2px_2px_0_#111827] dark:shadow-[2px_2px_0_#fff] transition hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#111827] dark:hover:shadow-[1px_1px_0_#fff]">
                      Get started
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </>
                )}
              </>
            )}
            {showThemeToggle && <span className="hidden sm:inline-flex ml-1"><ModeToggle /></span>}
          </nav>
        </div>
      </header>

      <EditProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onUpdated={(newUsername, newEmail) => {
          setUsername(newUsername);
          setEmail(newEmail);
        }}
      />
    </>
  );
}
