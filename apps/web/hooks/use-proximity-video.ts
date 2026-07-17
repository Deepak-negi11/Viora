"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureEvent } from "../lib/analytics";

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
  localStream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
  toggleMic: () => void | Promise<void>;
  toggleCam: () => void | Promise<void>;
  sendSignal: (targetUserId: string, signal: Signal) => void;
  registerSignalHandler: (fn: (fromUserId: string, signal: unknown) => void) => void;
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useProximityVideo({
  selfId,
  nearbyIds,
  localStream,
  micOn,
  camOn,
  toggleMic,
  toggleCam,
  sendSignal,
  registerSignalHandler,
}: Params) {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const localStreamRef = useRef(localStream);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamRefs = useRef<Map<string, MediaStream>>(new Map());
  const connectedPeersRef = useRef<Set<string>>(new Set());

  localStreamRef.current = localStream;

  const sendOffer = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      if (pc.signalingState !== "stable") return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(peerId, { kind: "offer", sdp: pc.localDescription!.sdp! });
      } catch (error) {
        console.error("WebRTC offer failed:", error);
      }
    },
    [sendSignal],
  );

  const createPeer = useCallback(
    (peerId: string, initiator: boolean) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peersRef.current.set(peerId, pc);

      for (const kind of ["audio", "video"] as const) {
        const track = kind === "audio"
          ? localStreamRef.current?.getAudioTracks()[0]
          : localStreamRef.current?.getVideoTracks()[0];
        const transceiver = pc.addTransceiver(kind, {
          direction: track ? "sendrecv" : "recvonly",
        });
        if (track) void transceiver.sender.replaceTrack(track);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, { kind: "candidate", candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        let remoteStream = event.streams[0] ?? remoteStreamRefs.current.get(peerId);
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamRefs.current.set(peerId, remoteStream);
        }
        if (!remoteStream.getTracks().some((track) => track.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }
        setRemoteStreams((previous) => ({ ...previous, [peerId]: remoteStream }));
        if (!connectedPeersRef.current.has(peerId)) {
          connectedPeersRef.current.add(peerId);
          captureEvent("proximity_connected");
        }
      };

      if (initiator) void sendOffer(peerId, pc);
      return pc;
    },
    [sendOffer, sendSignal],
  );

  const closePeer = useCallback((peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    remoteStreamRefs.current.delete(peerId);
    connectedPeersRef.current.delete(peerId);
    setRemoteStreams((previous) => {
      const next = { ...previous };
      delete next[peerId];
      return next;
    });
  }, []);

  useEffect(() => {
    registerSignalHandler(async (fromUserId, raw) => {
      if (!isSignal(raw)) return;
      let pc = peersRef.current.get(fromUserId);

      try {
        if (raw.kind === "offer") {
          if (!pc) pc = createPeer(fromUserId, false);
          await pc.setRemoteDescription({ type: "offer", sdp: raw.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(fromUserId, { kind: "answer", sdp: pc.localDescription!.sdp! });
        } else if (raw.kind === "answer") {
          if (pc) await pc.setRemoteDescription({ type: "answer", sdp: raw.sdp });
        } else if (pc) {
          await pc.addIceCandidate(raw.candidate).catch(() => {});
        }
      } catch (error) {
        console.error("WebRTC signaling failed:", error);
        closePeer(fromUserId);
      }
    });
  }, [registerSignalHandler, createPeer, sendSignal, closePeer]);

  useEffect(() => {
    if (!selfId) return;

    nearbyIds.forEach((peerId) => {
      if (!peersRef.current.has(peerId) && selfId < peerId) {
        createPeer(peerId, true);
      }
    });

    peersRef.current.forEach((_pc, peerId) => {
      if (!nearbyIds.has(peerId)) closePeer(peerId);
    });
  }, [nearbyIds, selfId, createPeer, closePeer]);

  useEffect(() => {
    peersRef.current.forEach((pc, peerId) => {
      let changed = false;
      for (const transceiver of pc.getTransceivers()) {
        const kind = transceiver.sender.track?.kind || transceiver.receiver.track?.kind;
        if (!kind) continue;

        const track = kind === "audio"
          ? localStream?.getAudioTracks()[0]
          : localStream?.getVideoTracks()[0];

        if (track) {
          if (transceiver.sender.track?.id !== track.id) {
            void transceiver.sender.replaceTrack(track);
            transceiver.direction = "sendrecv";
            changed = true;
          }
        } else {
          if (transceiver.sender.track !== null) {
            void transceiver.sender.replaceTrack(null);
            transceiver.direction = "recvonly";
            changed = true;
          }
        }
      }
      if (changed) void sendOffer(peerId, pc);
    });
  }, [localStream, sendOffer]);

  useEffect(() => {
    const peers = peersRef.current;
    const remoteStreamMap = remoteStreamRefs.current;
    return () => {
      peers.forEach((pc) => pc.close());
      peers.clear();
      remoteStreamMap.clear();
    };
  }, []);

  return { localStream, remoteStreams, micOn, camOn, toggleMic, toggleCam };
}
