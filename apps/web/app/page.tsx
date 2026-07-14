import { ArrowDown, AudioLines, History, MapPinned, MessageCircleMore, MousePointer2, Star } from "lucide-react";
import Image from "next/image";
import { LandingHeader, LandingPrimaryCta } from "../components/landing/landing-header";
import { GlobalCursorAvatar } from "../components/landing/global-cursor-avatar";
import { InteractiveHowItWorks } from "../components/landing/interactive-how-it-works";
import styles from "./landing.module.css";

const features = [
  { index: "01", title: "Move together", body: "See teammates move through the same shared 2D room in real time.", icon: MapPinned },
  { index: "02", title: "Talk when nearby", body: "Start voice and video naturally when you walk up to someone.", icon: AudioLines },
  { index: "03", title: "Pick up where you left off", body: "Return through one link to the same room and recent conversation.", icon: History },
  { index: "04", title: "Stay in the flow", body: "Use chat, reactions, and keyboard controls without opening another meeting tool.", icon: MessageCircleMore },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://vioraa.tech/#organization",
      name: "Viora",
      url: "https://vioraa.tech",
      logo: "https://vioraa.tech/viora-mark.svg",
      sameAs: ["https://github.com/Deepak-negi11/2D-Metaverse"],
    },
    {
      "@type": "WebSite",
      "@id": "https://vioraa.tech/#website",
      name: "Viora",
      url: "https://vioraa.tech",
      description: "A shared 2D spatial workspace for remote teams.",
      publisher: { "@id": "https://vioraa.tech/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Viora",
      url: "https://vioraa.tech",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "A shared 2D spatial workspace where remote teams move together, talk by proximity, chat, and return to the same persistent room.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: { "@id": "https://vioraa.tech/#organization" },
    },
  ],
};

export default function Home() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <LandingHeader />
      <GlobalCursorAvatar />

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroImage} aria-hidden="true" />
          <div className={styles.heroWash} aria-hidden="true" />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}><i /> Viora · Spatial workspace for remote teams</p>
            <h1 id="hero-title">
              <span>Work together like you&apos;re</span>
              <em>in the same room.</em>
            </h1>
            <p className={styles.heroLead}>Move through a shared 2D space, talk when teammates are nearby, and return to the same room anytime.</p>
            <div className={styles.heroActions}>
              <LandingPrimaryCta />
              <a href="#how-it-works" className={styles.secondaryCta}>See how Viora works <ArrowDown size={17} /></a>
            </div>
          </div>
          <div className={styles.heroNote} aria-hidden="true"><MouseHint /> Move your cursor</div>
        </section>

        <section id="how-it-works" className={styles.howSection} aria-labelledby="how-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-title">One room.<br /><em>Three simple steps.</em></h2>
            <p>Create a room, invite your team, and walk over when you want to talk.</p>
          </div>
          <InteractiveHowItWorks />
        </section>

        <section id="features" className={styles.featureSection} aria-labelledby="feature-title">
          <div className={styles.featureIntro}>
            <p className={styles.eyebrow}>Built for presence</p>
            <h2 id="feature-title">Everything your team needs to feel present.</h2>
          </div>
          <div className={styles.featureRows}>
            {features.map(({ index, title, body, icon: Icon }) => (
              <article key={index}>
                <span>{index}</span>
                <Icon size={23} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-title">
          <p className={styles.eyebrow}>Your team has enough tools</p>
          <h2 id="final-title">Now give them <em>a place.</em></h2>
          <p>Bring your team into one shared room where conversation feels visible, immediate, and human.</p>
          <LandingPrimaryCta />
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/viora-logo.svg" alt="Viora" width={112} height={30} className={styles.footerLogo} />
        </div>
        <p>Open source and built for teams that want a place—not another dashboard.</p>
        <a
          href="https://github.com/Deepak-negi11/2D-Metaverse"
          target="_blank"
          rel="noreferrer"
          className={styles.footerGithub}
        >
          <svg
            className="lucide lucide-github inline-block mr-1 align-text-bottom"
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
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
          View on GitHub
          <Star size={14} />
        </a>
        <small>© {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}

function MouseHint() {
  return <MousePointer2 size={14} />;
}
