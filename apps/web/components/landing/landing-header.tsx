"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuthToken } from "../../lib/auth-token";
import styles from "../../app/landing.module.css";

export function LandingHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getAuthToken()));
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const destination = isLoggedIn ? "/spaces" : "/signup";
  const label = isLoggedIn ? "Open your spaces" : "Create a space";

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label="Viora home">
          <Image
            src="/viora-logo.svg"
            alt="Viora"
            width={120}
            height={32}
            priority
            className={styles.brandLogo}
          />
        </Link>
        <div className={styles.headerActions}>
          <nav className={styles.desktopNav} aria-label="Landing page navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
          </nav>
          <a
            href="https://github.com/Deepak-negi11/2D-Metaverse"
            target="_blank"
            rel="noreferrer"
            className={styles.githubLink}
            aria-label="Star Viora on GitHub"
          >
            <svg
              className="lucide lucide-github"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
          {!isLoggedIn && <Link href="/signin" className={styles.signInLink}>Sign in</Link>}
          <Link href={destination} className={styles.headerCta}>{label}<ArrowUpRight size={16} /></Link>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="landing-mobile-nav" className={styles.mobileNav} aria-label="Mobile navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          {!isLoggedIn && <Link href="/signin">Sign in</Link>}
          <Link href={destination} className={styles.mobileNavCta} onClick={() => setMenuOpen(false)}>{label}</Link>
        </nav>
      )}
    </header>
  );
}

export function LandingPrimaryCta({ className = "" }: { className?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => setIsLoggedIn(Boolean(getAuthToken())), []);

  return (
    <Link href={isLoggedIn ? "/spaces" : "/signup"} className={`${styles.primaryCta} ${className}`}>
      {isLoggedIn ? "Open your spaces" : "Create a space"}
      <ArrowUpRight size={18} />
    </Link>
  );
}
