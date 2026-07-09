"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSpaceSocket } from "../../../hooks/use-space-socket";
import { ControlBar } from "../../../components/game-ui/control-bar";
import { PresenceBar } from "../../../components/game-ui/presence-bar";
import { ChatPanel } from "../../../components/game-ui/chat-panel";
import { getUsersMetadata } from "../../../lib/space-api";
import { getAuthToken } from "../../../lib/auth-token";
import dynamic from "next/dynamic";
import { isNearby } from "../../../lib/proximity";
//why this when we are doing the use client then 
const PhaserGame = dynamic(()=>
  import("../../../components/phaser/phaser-game").then((m) => m.PhaserGame),
  {ssr:false},
)
export default function SpacePage() {
  //what is this useParam what dooes this do explain this 
  const params = useParams<{ spaceId: string }>();
  const router = useRouter();
  const { status, error, selfId, self, others, move, messages, sendChat } = useSpaceSocket(params.spaceId);

  const othersRef = useRef(others);
  othersRef.current = others;
  const moveRef = useRef(move);
  moveRef.current = move;

  // userId -> username. We fetch names for whoever we see and hand them to Phaser.
  const [names, setNames] = useState<Record<string, string>>({});
  const namesRef = useRef(names);
  namesRef.current = names;
  // remembers which ids we've already asked for, so movement (which changes `others`
  // constantly) doesn't refetch the same names over and over
  const fetchedIds = useRef<Set<string>>(new Set());

  //why usememo 
  const nearbyIds = useMemo(()=>{
    const set = new Set<string>();
    ///explain this for loops 
    for (const [ id ,pos] of Object.entries(others)){
      if(isNearby(self,pos)) set.add(id);
    }
    return set;
  },[self ,others])
  const nearbyRef = useRef(nearbyIds);
  nearbyRef.current = nearbyIds;
  
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const ids = [selfId, ...Object.keys(others)].filter((v): v is string => !!v);
    const missing = ids.filter((id) => !fetchedIds.current.has(id));
    if (missing.length === 0) return;

    missing.forEach((id) => fetchedIds.current.add(id));
    getUsersMetadata(token, missing)
      .then((res) => {
        setNames((prev) => {
          const next = { ...prev };
          for (const user of res.avatars) next[user.userId] = user.username;
          return next;
        });
      })
      .catch(() => {
        // let it retry next time if the request failed
        missing.forEach((id) => fetchedIds.current.delete(id));
      });
  }, [selfId, others]);

  // everyone in the room (self first), for the presence bar
  const people = useMemo(() => {
    const list: { id: string; name: string; isSelf: boolean; isNearby: boolean }[] = [];
    if (selfId) list.push({ id: selfId, name: names[selfId] ?? "You", isSelf: true, isNearby: false });
    for (const id of Object.keys(others)) {
      list.push({ id, name: names[id] ?? id.slice(0, 5), isSelf: false, isNearby: nearbyIds.has(id) });
    }
    return list;
  }, [selfId, others, names, nearbyIds]);

  return (
    // relative so the ControlBar overlay can position itself over the canvas
    <div className="relative h-screen w-screen overflow-hidden
  bg-neutral-950 text-neutral-100">
        {status === "joined" ? (
          <>
            <PhaserGame othersRef={othersRef} moveRef={moveRef} namesRef={namesRef} nearbyRef={nearbyRef}
  />
            {/* React chrome on TOP of the Phaser canvas (Gather-style overlays) */}
            <PresenceBar people={people} />
            <ChatPanel messages={messages} names={names} selfId={selfId} onSend={sendChat} />
            <ControlBar
              displayName={(selfId ? names[selfId] : undefined) ?? "You"}
              onLeave={() => router.push("/spaces")}
            />
          </>
        ) : (
          <p className="p-6">{error ?? "Connecting…"}</p>
        )}
      </div>
  );
}
