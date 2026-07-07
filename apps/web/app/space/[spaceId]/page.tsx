"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSpaceSocket } from "../../../hooks/use-space-socket";
import { ArenaBoard } from "../../../components/arena-board";

export default function SpacePage() {
  //what is this useParam what dooes this do explain this 
  const params = useParams<{ spaceId: string }>();
  const { status, error, selfId, self, others, move } = useSpaceSocket(params.spaceId);

  useEffect(() => {
    //what is this function used for 
    function onKeyDown(event: KeyboardEvent) {
      let dx = 0;
      let dy = 0;
      if (event.key === "ArrowUp") dy = -1;
      else if (event.key === "ArrowDown") dy = 1;
      else if (event.key === "ArrowLeft") dx = -1;
      else if (event.key === "ArrowRight") dx = 1;
      else return;

      event.preventDefault();
      //what does it even do in this 
      const nextX = Math.max(0, self.x + dx);
      const nextY = Math.max(0, self.y + dy);
      if (nextX === self.x && nextY === self.y) return;
      move({ x: nextX, y: nextY });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [self, move]);

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-neutral-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Space: {params.spaceId}</h1>
        <p className="text-sm text-neutral-400">
          {status === "joined" ? `${Object.keys(others).length + 1} online` : status}
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {status === "joined" && <ArenaBoard selfId={selfId} self={self} others={others} />}

      {status === "joined" && (
        <p className="mt-4 text-sm text-neutral-500">Use the arrow keys to move.</p>
      )}
    </div>
  );
}
