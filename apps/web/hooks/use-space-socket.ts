"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getChatRoomAtPosition, ServerMessage, type MapTemplateId } from "@repo/shared";
import { getAuthToken } from "../lib/auth-token";
import { getSpaceMessages, type ChatScope } from "../lib/space-api";
import { captureEvent } from "../lib/analytics";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

export type Position = { x: number; y: number };
export type Others = Record<string, Position>;
type Status = "connecting" | "joined" | "error";
export type ChatEntry = {
  id: string;
  userId: string;
  text: string;
  at: number;
  scope: ChatScope;
  roomId?: string;
  roomName?: string;
};
export type Reaction = { id: string; userId: string; emoji: string; at: number };

export function useSpaceSocket(spaceId: string, mapTemplate: MapTemplateId) {
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [self, setSelf] = useState<Position>({ x: 0, y: 0 });
  const [others, setOthers] = useState<Others>({});
  const [generalMessages, setGeneralMessages] = useState<ChatEntry[]>([]);
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatEntry[]>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const signalHandlerRef = useRef<((fromUserId: string, signal: unknown) => void) | null>(null);
  const loadedRoomsRef = useRef<Set<string>>(new Set());

  const currentRoom = useMemo(
    () => getChatRoomAtPosition(mapTemplate, self),
    [mapTemplate, self],
  );

  const mergeHistory = useCallback((history: ChatEntry[], current: ChatEntry[]) => {
    const seen = new Set(current.map((message) => message.id));
    return [...history.filter((message) => !seen.has(message.id)), ...current];
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setStatus("error");
      setError("You are not signed in.");
      return;
    }

    const ws = new WebSocket(WS_URL);
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
          setOthers(Object.fromEntries(
            message.payload.users.map((user) => [user.id, { x: user.x, y: user.y }]),
          ));
          setStatus("joined");
          captureEvent("space_entered");

          getSpaceMessages(token, spaceId, "general")
            .then((response) => {
              setGeneralMessages((current) => mergeHistory(response.messages, current));
            })
            .catch(() => {});
          break;
        }
        case "user-join":
        case "movement": {
          const { userId, x, y } = message.payload;
          setOthers((current) => ({ ...current, [userId]: { x, y } }));
          break;
        }
        case "movement-rejected":
          setSelf(message.payload);
          break;
        case "user-left": {
          setOthers((current) => {
            const next = { ...current };
            delete next[message.payload.userId];
            return next;
          });
          break;
        }
        case "error":
          setError(message.message);
          break;
        case "chat": {
          const entry: ChatEntry = {
            id: `${message.payload.userId}-${message.payload.at}`,
            ...message.payload,
          };
          if (entry.scope === "room" && entry.roomId) {
            setRoomMessages((current) => ({
              ...current,
              [entry.roomId!]: [...(current[entry.roomId!] ?? []), entry],
            }));
          } else {
            setGeneralMessages((current) => [...current, entry]);
          }
          break;
        }
        case "reaction": {
          const { userId, emoji, at } = message.payload;
          setReactions((current) => [
            ...current.filter((reaction) => Date.now() - reaction.at < 6000),
            { id: `${userId}-${at}`, userId, emoji, at },
          ]);
          break;
        }
        case "webrtc-signal":
          signalHandlerRef.current?.(message.payload.fromUserId, message.payload.signal);
          break;
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setError("Connection error");
    };
    ws.onclose = () => {
      if (socketRef.current === ws) {
        setStatus("error");
        setError((current) => current ?? "Connection closed");
      }
    };

    return () => {
      signalHandlerRef.current = null;
      if (socketRef.current === ws) socketRef.current = null;
      ws.close();
    };
  }, [spaceId, mergeHistory]);

  useEffect(() => {
    if (status !== "joined" || !currentRoom || loadedRoomsRef.current.has(currentRoom.id)) return;
    const token = getAuthToken();
    if (!token) return;

    loadedRoomsRef.current.add(currentRoom.id);
    getSpaceMessages(token, spaceId, "room", currentRoom.id)
      .then((response) => {
        setRoomMessages((current) => ({
          ...current,
          [currentRoom.id]: mergeHistory(response.messages, current[currentRoom.id] ?? []),
        }));
      })
      .catch(() => {
        loadedRoomsRef.current.delete(currentRoom.id);
      });
  }, [status, currentRoom, spaceId, mergeHistory]);

  const move = useCallback((next: Position) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setSelf(next);
    ws.send(JSON.stringify({ type: "move", payload: next }));
  }, []);

  const sendChat = useCallback((text: string, scope: ChatScope) => {
    const trimmed = text.trim();
    const ws = socketRef.current;
    if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN) return;
    if (scope === "room" && !currentRoom) return;

    ws.send(JSON.stringify({ type: "chat", payload: { text: trimmed, scope } }));
    captureEvent("message_sent");

    const at = Date.now();
    const entry: ChatEntry = {
      id: `me-${at}`,
      userId: selfId ?? "me",
      text: trimmed,
      at,
      scope,
      roomId: scope === "room" ? currentRoom?.id : undefined,
      roomName: scope === "room" ? currentRoom?.name : undefined,
    };
    if (scope === "room" && currentRoom) {
      setRoomMessages((current) => ({
        ...current,
        [currentRoom.id]: [...(current[currentRoom.id] ?? []), entry],
      }));
    } else {
      setGeneralMessages((current) => [...current, entry]);
    }
  }, [selfId, currentRoom]);

  const sendReaction = useCallback((emoji: string) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "reaction", payload: { emoji } }));
    const at = Date.now();
    setReactions((current) => [
      ...current.filter((reaction) => at - reaction.at < 6000),
      { id: `me-${at}`, userId: selfId ?? "me", emoji, at },
    ]);
  }, [selfId]);

  const sendSignal = useCallback((targetUserId: string, signal: unknown) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "webrtc-signal", payload: { targetUserId, signal } }));
  }, []);

  const registerSignalHandler = useCallback(
    (handler: (fromUserId: string, signal: unknown) => void) => {
      signalHandlerRef.current = handler;
    },
    [],
  );

  return {
    status,
    error,
    selfId,
    self,
    others,
    move,
    generalMessages,
    roomMessages: currentRoom ? roomMessages[currentRoom.id] ?? [] : [],
    currentRoom,
    sendChat,
    reactions,
    sendReaction,
    sendSignal,
    registerSignalHandler,
  };
}
