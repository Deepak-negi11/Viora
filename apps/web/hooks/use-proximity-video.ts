"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// the shapes two peers exchange to connect
type Signal =
  | { kind: "offer"; sdp: string }
  | { kind: "answer"; sdp: string }
  | { kind: "candidate"; candidate: RTCIceCandidateInit };

function isSignal(value: unknown): value is Signal {
  if (!value || typeof value !== "object" || !("kind" in value)) return false;
  const signal = value as Record<string, unknown>;
  if (signal.kind === "offer" || signal.kind === "answer") {
    return typeof signal.sdp === "string";
  }
  return signal.kind === "candidate" && !!signal.candidate && typeof signal.candidate === "object";
}

type Params = {
  selfId: string | null;
  nearbyIds: Set<string>;
  sendSignal: (targetUserId: string, signal: Signal) => void;
  registerSignalHandler: (fn: (fromUserId: string, signal: unknown) => void) => void;
};

// STUN server helps peers find a network path to each other through NAT/firewalls.
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useProximityVideo({ selfId, nearbyIds, sendSignal, registerSignalHandler }: Params) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null); // mirror for use inside callbacks
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const startingRef = useRef(false);

  // 1) ask for camera + mic ONCE (this shows the browser permission prompt)
  const start = useCallback(async () => {
    if (localStreamRef.current || startingRef.current) return;
    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Apply current mic/cam state to the newly acquired stream tracks
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
      stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch (err) {
      console.error("Camera/mic permission denied or unavailable:", err);
    } finally {
      startingRef.current = false;
    }
  }, [micOn, camOn]);

  // build a peer connection to `peerId`. `initiator` = this side makes the offer.
  const createPeer = useCallback(
    (peerId: string, initiator: boolean) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current.set(peerId, pc);

      // put MY audio/video onto the connection so the peer receives it
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // trickle my ICE candidates to the peer as the browser discovers them
      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal(peerId, { kind: "candidate", candidate: e.candidate.toJSON() });
      };

      // when THEIR media arrives, store it so we can render a <video>
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        if (stream) setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
      };

      // only the initiator kicks off the offer (tracks are already added above)
      if (initiator) {
        (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal(peerId, { kind: "offer", sdp: pc.localDescription!.sdp! });
          } catch (err) {
            console.error("offer failed", err);
          }
        })();
      }
      return pc;
    },
    [sendSignal],
  );

  const closePeer = useCallback((peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // 2) handle signals coming FROM other peers
  useEffect(() => {
    registerSignalHandler(async (fromUserId, raw) => {
      if (!isSignal(raw)) return;
      const signal = raw;
      let pc = peersRef.current.get(fromUserId);

      try {
      if (signal.kind === "offer") {
        // someone offered: create the peer (as answerer) if needed, then answer
        if (!pc) pc = createPeer(fromUserId, false);
        await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(fromUserId, { kind: "answer", sdp: pc.localDescription!.sdp! });
      } else if (signal.kind === "answer") {
        if (pc) await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
      } else if (signal.kind === "candidate") {
        // It may arrive just before remoteDescription is set; the next negotiation
        // will recover, so this specific race does not need to fail the room.
        if (pc) await pc.addIceCandidate(signal.candidate).catch(() => {});
      }
      } catch (error) {
        console.error("WebRTC signaling failed:", error);
        closePeer(fromUserId);
      }
    });
  }, [registerSignalHandler, createPeer, sendSignal, closePeer]);

  // 3) open/close peers as who's-near-me changes
  useEffect(() => {
    if (!selfId) return;

    // first time someone is nearby, grab the camera; the effect re-runs once we have it
    if (nearbyIds.size > 0 && !localStreamRef.current) {
      start();
      return;
    }
    if (!localStreamRef.current) return;

    // NEW nearby peers: to avoid "glare" (both offering at once), only the peer
    // with the smaller id initiates; the other waits for the incoming offer.
    nearbyIds.forEach((peerId) => {
      if (!peersRef.current.has(peerId) && selfId < peerId) {
        createPeer(peerId, true);
      }
    });

    // peers that walked away: hang up
    peersRef.current.forEach((_pc, peerId) => {
      if (!nearbyIds.has(peerId)) closePeer(peerId);
    });
  }, [nearbyIds, selfId, localStream, start, createPeer, closePeer]);

  // 4) mic/camera toggles just enable/disable the local tracks
  const toggleMic = useCallback(() => {
    setMicOn((v) => {
      const next = !v;
      const s = localStreamRef.current;
      if (s) {
        s.getAudioTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  }, []);

  const toggleCam = useCallback(() => {
    setCamOn((v) => {
      const next = !v;
      const s = localStreamRef.current;
      if (s) {
        s.getVideoTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  }, []);

  // 5) clean everything up when you leave the space
  useEffect(() => {
    const peers = peersRef.current;
    return () => {
      peers.forEach((pc) => pc.close());
      peers.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { localStream, remoteStreams, micOn, camOn, toggleMic, toggleCam };
}
