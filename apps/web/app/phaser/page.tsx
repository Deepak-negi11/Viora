 "use client";
  
  import dynamic from "next/dynamic";
  
  // load PhaserGame in the browser only (never on the server)
  const PhaserGame = dynamic(
    () =>
  import("../../components/phaser/phaser-game").then((m) =>
  m.PhaserGame),
    { ssr: false },
  );
  
  export default function PhaserTestPage() {
    return (
      <div className="flex min-h-screen items-center
  justify-center bg-neutral-950">
        <PhaserGame />
      </div>
    );
  }
