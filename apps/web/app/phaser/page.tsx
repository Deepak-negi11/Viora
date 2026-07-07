 "use client";
  
  import dynamic from "next/dynamic";
  
  // load PhaserGame in the browser only (never on the server)
  const PhaserGame = dynamic(
    () => import("../../components/phaser/phaser-game").then((m) => m.PhaserGame),
    { ssr: false },
  );
  
  export default function PhaserTestPage() {
    return (
      <div className="h-screen w-screen overflow-hidden bg-neutral-950">
        <PhaserGame />
      </div>
    );
  }
