"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ServerMessage } from "@repo/shared";
import { getAuthToken } from "../lib/auth-token";
import { getSpaceMessages } from "../lib/space-api";
import { captureEvent } from "../lib/analytics";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

//what is this position use for like 
export type Position = { x: number; y: number };
export type Others = Record<string, Position>;
type Status = "connecting" | "joined" | "error";
export type ChatEntry = {id:string ; userId:string ;text:string;at:number};
export type Reaction = { id: string; userId: string; emoji: string; at: number };

export function useSpaceSocket(spaceId: string) {
  //what is this useref used for like this and what is this type also ex
  const socketRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  //what is this selfif what is this 
  const [selfId, setSelfId] = useState<string | null>(null);
  //expain this self
  const [self, setSelf] = useState<Position>({ x: 0, y: 0 });
  const [others, setOthers] = useState<Others>({});
  const [message , setMessage] = useState<ChatEntry[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([]);
  // a handler the video hook registers, called for each incoming WebRTC signal
  const signalHandlerRef = useRef<((fromUserId: string, signal: unknown) => void) | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setStatus("error");
      setError("You are not signed in.");
      return;
    }

    const ws = new WebSocket(WS_URL);
    //what is this socketref.current what is this 
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", payload: { spaceId, token } }));
    };

    ws.onmessage = (event) => {
      let rawMessage: unknown;
      try {
        rawMessage = JSON.parse(event.data);
      } catch {
        setStatus("error");
        setError("Server sent an invalid message");
        return;
      }

      const parsed = ServerMessage.safeParse(rawMessage);
      if (!parsed.success) return;
      const message = parsed.data;

      switch (message.type) {
        case "space-joined": {
          setSelfId(message.payload.userId);
          setSelf(message.payload.spawn);
          setOthers(
            Object.fromEntries(
              message.payload.users.map((user) => [user.id, { x: user.x, y: user.y }]),
            ),
          );
          setStatus("joined");
          captureEvent("space_entered");

          // load recent chat history and merge it in front of any live messages
          const token = getAuthToken();
          if (token) {
            getSpaceMessages(token, spaceId)
              .then((res) => {
                setMessage((prev) => {
                  const seen = new Set(prev.map((m) => m.id));
                  const history = res.messages
                    .filter((m) => !seen.has(m.id))
                    .map((m) => ({ id: m.id, userId: m.userId, text: m.text, at: m.at }));
                  return [...history, ...prev];
                });
              })
              .catch(() => {});
          }
          break;
        }
        case "user-join":
        case "movement": {
          const { userId, x, y } = message.payload;
          setOthers((prev) => ({ ...prev, [userId]: { x, y } }));
          break;
        }
        case "movement-rejected": {
          setSelf(message.payload);
          break;
        }
        case "user-left": {
          const { userId } = message.payload;
          setOthers((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          break;
        }
        case "error": {
          setStatus("error");
          setError(message.message);
          break;
        }
        case "chat":{
          const {userId,text ,at} = message.payload;
          setMessage((prev)=>[
            ...prev,
            {id:`${userId}-${at}-${prev.length}`,userId,text,at}
          ]);
          break
        }
        case "reaction": {
          const { userId, emoji, at } = message.payload;
          setReactions((prev) => [
            ...prev.filter((r) => Date.now() - r.at < 6000),
            { id: `${userId}-${at}`, userId, emoji, at },
          ]);
          break;
        }
        case "webrtc-signal": {
          const { fromUserId, signal } = message.payload;
          signalHandlerRef.current?.(fromUserId, signal);
          break;
        }
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setError("Connection error");
    };

    ws.onclose = () => {
      if (socketRef.current === ws) {
        setStatus((current) => current === "error" ? current : "error");
        setError((current) => current ?? "Connection closed");
      }
    };

    return () => {
      signalHandlerRef.current = null;
      if (socketRef.current === ws) socketRef.current = null;
      ws.close();
    };
  }, [spaceId]);

  const move = useCallback((next: Position) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setSelf(next);
    ws.send(JSON.stringify({ type: "move", payload: next }));
  }, []);

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(JSON.stringify({ type: "chat", payload: { text: trimmed } }));
      captureEvent("message_sent");

      // optimistically show MY message right away (server only echoes to others)
      setMessage((prev) => [
        ...prev,
        { id: `me-${Date.now()}-${prev.length}`, userId: selfId ?? "me", text: trimmed, at: Date.now() },
      ]);
    },
    [selfId],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(JSON.stringify({ type: "reaction", payload: { emoji } }));

      // optimistically show MY reaction (server only echoes to others)
      const at = Date.now();
      setReactions((prev) => [
        ...prev.filter((r) => at - r.at < 6000),
        { id: `me-${at}`, userId: selfId ?? "me", emoji, at },
      ]);
    },
    [selfId],
  );

  // send a WebRTC signal (offer/answer/ICE) to one specific user
  const sendSignal = useCallback((targetUserId: string, signal: unknown) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "webrtc-signal", payload: { targetUserId, signal } }));
  }, []);

  // let the video hook plug in its handler for incoming signals
  const registerSignalHandler = useCallback(
    (fn: (fromUserId: string, signal: unknown) => void) => {
      signalHandlerRef.current = fn;
    },
    [],
  );

  return { status, error, selfId, self, others, move, messages: message, sendChat, reactions, sendReaction, sendSignal, registerSignalHandler };
}
