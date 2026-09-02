"use client";

/*//User opens URL
        │
        ▼
Load space information
        │
        ▼
Check login
        │
        ▼
Show pre-join screen
        │
        ▼
User enters name
        │
        ▼
Join WebSocket
        │
        ▼
Load Phaser game
        │
        ▼
Show chat
Show players
Show video
Show controls
*/

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { MapTemplateId } from "@repo/shared";
import { useSpaceSocket } from "../../../hooks/use-space-socket";
import { useProximityVideo } from "../../../hooks/use-proximity-video";
import { useLocalMedia, type LocalMediaController } from "../../../hooks/use-local-media";
import { ControlBar } from "../../../components/game-ui/control-bar";
import { PresenceBar } from "../../../components/game-ui/presence-bar";
import { ChatPanel } from "../../../components/game-ui/chat-panel";
import { AgentFeed } from "../../../components/game-ui/agent-feed";
import { VideoLayer, ScreenLayer } from "../../../components/game-ui/video-tile";
import { PrejoinScreen } from "../../../components/game-ui/prejoin-screen";
import { getSpace, getUsersMetadata } from "../../../lib/space-api";
import { updateProfile } from "../../../lib/auth-api";
import { getAuthToken } from "../../../lib/auth-token";
import { isNearby } from "../../../lib/proximity";

const PhaserGame = dynamic(
  () => import("../../../components/phaser/phaser-game").then((module) => module.PhaserGame),
  { ssr: false },
);

export default function SpacePage() {
  const params = useParams<{ spaceId: string }>();
  const router = useRouter();
  const media = useLocalMedia();
  const [mapTemplate, setMapTemplate] = useState<MapTemplateId | null>(null);
  const [spaceName, setSpaceName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  // So let me explain you what this is so suppose in the map or the space in when i used to refresh it used to deligate me to the pre join page (space page) so now we the browser remeber we already entered all that 
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`metaverse:entered:${params.spaceId}`) === "true";
    }
    return false;
  });

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/signin");
      return;
    }

    setDisplayName(localStorage.getItem("metaverse:username")?.trim() || "Guest");
    getSpace(token, params.spaceId)
      .then((space) => {
        setMapTemplate(space.mapTemplate);
        setSpaceName(space.name);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Could not load this space");
      });
  }, [params.spaceId, router]);

  if (loadError || !mapTemplate) {
    return <SpaceLoading error={loadError} />;
  }

  
  if (!hasEntered) {
    return (
      <PrejoinScreen
        media={media}
        spaceName={spaceName}
        initialName={displayName}
        onEnter={async (name) => {
          const token = getAuthToken();
          if (!token) throw new Error("You are not signed in.");
          if (name !== displayName) {
            await updateProfile(token, { username: name });
          }
          localStorage.setItem("metaverse:username", name);
          sessionStorage.setItem(`metaverse:entered:${params.spaceId}`, "true");
          setDisplayName(name);
          setHasEntered(true);
        }}
      />
    );
  }

  return (
    <LiveSpace
      spaceId={params.spaceId}
      mapTemplate={mapTemplate}
      media={media}
      initialDisplayName={displayName}
      onLeave={() => {
        sessionStorage.removeItem(`metaverse:entered:${params.spaceId}`);
        router.push("/spaces");
      }}
    />
  );
}

function LiveSpace({
  spaceId,
  mapTemplate,
  media,
  initialDisplayName,
  onLeave,
}: {
  spaceId: string;
  mapTemplate: MapTemplateId;
  media: LocalMediaController;
  initialDisplayName: string;
  onLeave: () => void;
}) {
  const {
    status,
    error,
    selfId,
    self,
    others,
    move,
    generalMessages,
    roomMessages,
    currentRoom,
    sendChat,
    reactions,
    sendReaction,
    agentActivities,
    sendSignal,
    registerSignalHandler,
  } = useSpaceSocket(spaceId, mapTemplate);

  const othersRef = useRef(others);
  othersRef.current = others;
  const selfRef = useRef(self);
  selfRef.current = self;
  const moveRef = useRef(move);
  moveRef.current = move;
  const reactionsRef = useRef(reactions);
  reactionsRef.current = reactions;
  const activitiesRef = useRef(agentActivities);
  activitiesRef.current = agentActivities;

  const [names, setNames] = useState<Record<string, string>>({});
  const namesRef = useRef(names);
  namesRef.current = names;
  const fetchedIds = useRef<Set<string>>(new Set());

  const nearbyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, position] of Object.entries(others)) {
      if (isNearby(self, position)) ids.add(id);
    }
    return ids;
  }, [self, others]);
  const nearbyRef = useRef(nearbyIds);
  nearbyRef.current = nearbyIds;

  const { localStream, remoteStreams, remoteScreenStreams, micOn, camOn, screenOn, toggleMic, toggleCam, toggleScreen } = useProximityVideo({
    selfId,
    nearbyIds,
    localStream: media.stream,
    screenStream: media.screenStream,
    micOn: media.micOn,
    camOn: media.camOn,
    screenOn: media.screenOn,
    toggleMic: media.toggleMic,
    toggleCam: media.toggleCam,
    toggleScreen: media.toggleScreen,
    sendSignal,
    registerSignalHandler,
  });

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const ids = [selfId, ...Object.keys(others)].filter((value): value is string => !!value);
    const missing = ids.filter((id) => !fetchedIds.current.has(id));
    if (missing.length === 0) return;

    missing.forEach((id) => fetchedIds.current.add(id));
    getUsersMetadata(token, missing)
      .then((response) => {
        setNames((previous) => {
          const next = { ...previous };
          for (const user of response.avatars) next[user.userId] = user.username;
          return next;
        });
      })
      .catch(() => {
        missing.forEach((id) => fetchedIds.current.delete(id));
      });
  }, [selfId, others]);

  const handleUpdateName = async (newName: string) => {
    const token = getAuthToken();
    if (!token || !selfId) return;
    await updateProfile(token, { username: newName });
    setNames((previous) => ({ ...previous, [selfId]: newName }));
  };

  const people = useMemo(() => {
    const list: { id: string; name: string; isSelf: boolean; isNearby: boolean }[] = [];
    const formatName = (name: string) => name.length > 20 ? `${name.slice(0, 20)}...` : name;

    if (selfId) {
      list.push({
        id: selfId,
        name: formatName(names[selfId] ?? initialDisplayName ?? "You"),
        isSelf: true,
        isNearby: false,
      });
    }
    for (const id of Object.keys(others)) {
      list.push({
        id,
        name: formatName(names[id] ?? id.slice(0, 5)),
        isSelf: false,
        isNearby: nearbyIds.has(id),
      });
    }
    return list;
  }, [selfId, others, names, nearbyIds, initialDisplayName]);

  if (status !== "joined") return <SpaceLoading error={error} />;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <PhaserGame
        mapTemplate={mapTemplate}
        othersRef={othersRef}
        selfRef={selfRef}
        moveRef={moveRef}
        namesRef={namesRef}
        nearbyRef={nearbyRef}
        reactionsRef={reactionsRef}
        activitiesRef={activitiesRef}
        selfId={selfId}
      />
      <PresenceBar people={people} />
      <AgentFeed agentActivities={agentActivities} names={names} selfId={selfId} />
      <VideoLayer localStream={localStream} remoteStreams={remoteStreams} names={names} />
      <ScreenLayer
        localScreenStream={media.screenStream}
        remoteScreenStreams={remoteScreenStreams}
        names={names}
      />
      <ChatPanel
        generalMessages={generalMessages}
        roomMessages={roomMessages}
        currentRoom={currentRoom}
        names={names}
        selfId={selfId}
        onSend={sendChat}
      />
      <ControlBar
        displayName={(selfId ? names[selfId] : undefined) ?? "You"}
        onLeave={onLeave}
        onReact={sendReaction}
        micOn={micOn}
        camOn={camOn}
        screenOn={screenOn}
        onToggleMic={() => void toggleMic()}
        onToggleCam={() => void toggleCam()}
        onToggleScreen={() => void toggleScreen()}
        onUpdateName={handleUpdateName}
      />
    </div>
  );
}

function SpaceLoading({ error }: { error: string | null }) {
  return (
    <div className="grid h-screen place-items-center bg-[#dbe8f8] p-6 text-[#111827]">
      <div className="border-2 border-[#111827] bg-[#f8fbff] p-6 text-center shadow-[5px_5px_0_#183a8f]">
        <p className="font-mono text-xs font-bold tracking-[0.12em] text-[#183a8f]">JOINING SPACE</p>
        <p className="mt-2 text-lg font-bold tracking-[-0.03em]">{error ?? "Loading your space…"}</p>
      </div>
    </div>
  );
}
