import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "../components/navbar";
import { PresenceDemo } from "../components/presence-demo";
import styles from "./landing.module.css";

const waysOfWorking = [
  ["Focus without disappearing", "Pick a quiet desk when you need room to think. Your team can see that you are there, just heads-down."],
  ["Talk without a calendar", "Move to the shared table when a quick question is easier than another meeting invite."],
  ["Keep the in-between", "Leave space for the small moments that make a team feel close, even when everyone is far apart."],
];

export default function Home() {
  return (
    <div className={styles.page}>
      <Navbar showThemeToggle={false} />

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>The virtual office for distributed teams.</p>
            <h1 id="hero-title">Make space for the work between meetings.</h1>
            <p className={styles.intro}>
              2D Metaverse gives your team a shared place for focused time, quick questions, and the everyday conversations that should never need another link.
            </p>
            <div className={styles.actions}>
              <Link href="/signup" className={styles.primaryAction}>
                Create a space
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/signin" className={styles.secondaryAction}>Sign in to your room</Link>
            </div>
          </div>

          <PresenceDemo />
        </section>

        <section id="how-it-works" className={styles.working} aria-labelledby="working-title">
          <div className={styles.workingLead}>
            <p>Presence, without the performance.</p>
            <h2 id="working-title">The room keeps your team in context.</h2>
          </div>
          <div className={styles.workingList}>
            {waysOfWorking.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
