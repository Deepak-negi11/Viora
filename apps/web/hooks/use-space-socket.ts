"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAuthToken } from "../lib/auth-token";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

//what is this position use for like 
export type Position = { x: number; y: number };
export type Others = Record<string, Position>;
type Status = "connecting" | "joined" | "error";

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
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "space-joined": {
          setSelfId(message.payload.userId);
          setSelf(message.payload.spawn);
          setOthers(
            Object.fromEntries(
              message.payload.users.map(
                (u: { id: string; x: number; y: number }) => [u.id, { x: u.x, y: u.y }],
              ),
            ),
          );
          setStatus("joined");
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
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setError("Connection error");
    };

    return () => {
      ws.close();
    };
  }, [spaceId]);

  const move = useCallback((next: Position) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setSelf(next);
    ws.send(JSON.stringify({ type: "move", payload: next }));
  }, []);

  return { status, error, selfId, self, others, move };
}
