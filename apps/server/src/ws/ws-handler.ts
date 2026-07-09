import prisma from "@repo/db";
import { ClientMessage } from "@repo/shared";
import { getUserIdFromToken } from "../middleware/auth";
import type { Socket, SocketData } from "./room-manager";
import {
  addToRoom,
  broadcast,
  removeFromRoom,
  roomSize,
  updatePosition,
} from "./room-manager";
import {
  getRoomUsers,
  removeUser,
  setUserOnline,
  setUserPosition,
} from "./presence";
import {
  publishRoomEvent,
  subscribeToSpaceEvents,
  unsubscribeFromSpaceEvents,
} from "./pubsub";

type JoinPayload = {
  spaceId: string;
  token: string;
};

type MovePayload = {
  x: number;
  y: number;
};

type ChatPayload = {
  text:string;
};

//what is this use case of this make socket data use case and why to even write this it does what just get the values and return them still why this 
export function makeSocketData(): SocketData {
  return { x: 0, y: 0 };
}

// what is this ws.send what is this send does where does it send this
function send(ws: Socket, message: unknown) {
  ws.send(JSON.stringify(message));
}

//what is this from 
function isOneTileMove(from: { x: number; y: number }, to: MovePayload) {
  //what does this math.abs and explain this math to be what is this math 
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y) === 1;
}
//in this ws:socket i think it is a connection like the web socket sonnection tell what is it if not the connection 
export async function onMessage(ws: Socket, raw: string | Buffer) {
  let json: unknown;

  try {
    json = JSON.parse(raw.toString());
  } catch {
    return send(ws, { type: "error", message: "Invalid JSON" });
  }

  const parsed = ClientMessage.safeParse(json);
  if (!parsed.success) {
    return send(ws, { type: "error", message: "Invalid message" });
  }

  switch (parsed.data.type) {
    case "join":
      return handleJoin(ws, parsed.data.payload);
    case "move":
      return handleMove(ws, parsed.data.payload);
    case "chat":
      return handleChat(ws, parsed.data.payload)
  }
}

async function handleJoin(ws: Socket, payload: JoinPayload) {
  const userId = getUserIdFromToken(payload.token);
  if (!userId) {
    return send(ws, { type: "error", message: "Invalid token" });
  }

  const space = await prisma.space.findUnique({
    where: { id: payload.spaceId },
  });

  if (!space) {
    return send(ws, { type: "error", message: "Space not found" });
  }

  const spawn = { x: 0, y: 0 };
  ws.data.userId = userId;
  ws.data.spaceId = payload.spaceId;
  ws.data.x = spawn.x;
  ws.data.y = spawn.y;

  ///what doe this set useronline does in this a
  await setUserOnline(payload.spaceId, userId, spawn);

  const roomUsers = await getRoomUsers(payload.spaceId);
  const existingUsers = roomUsers
  //what is this doing and i havea questioni. seen a bloack ok the code hy i am not able to read and understnad that and i know this filter loop over an arrayr and fitler thorugh adn give us an arrayr 
    .filter((user) => user.userId !== userId)
    .map((user) => ({
      id: user.userId,
      x: user.x,
      y: user.y,
    }));

  addToRoom(payload.spaceId, {
    socket: ws,
    userId,
    x: spawn.x,
    y: spawn.y,
  });
  await subscribeToSpaceEvents(payload.spaceId);

  //what does this send does up here and where doe sit send ot the user or what
  send(ws, {
    type: "space-joined",
    payload: { userId, spawn, users: existingUsers },
  });

  const message = {
    type: "user-join",
    payload: { userId, x: spawn.x, y: spawn.y },
  } as const;

  broadcast(payload.spaceId, userId, message);
  await publishRoomEvent(payload.spaceId, userId, message);
}

async function handleMove(ws: Socket, payload: MovePayload) {
  const { spaceId, userId, x: currentX, y: currentY } = ws.data;

  if (!spaceId || !userId) {
    return send(ws, { type: "error", message: "Join a space first" });
  }

  const currentPosition = { x: currentX, y: currentY };
  if (!isOneTileMove(currentPosition, payload)) {
    return send(ws, {
      type: "movement-rejected",
      payload: currentPosition,
    });
  }

  ws.data.x = payload.x;
  ws.data.y = payload.y;
  updatePosition(spaceId, userId, payload.x, payload.y);

  await setUserPosition(spaceId, userId, {
    x: payload.x,
    y: payload.y,
  });

  const message = {
    type: "movement",
    payload: { userId, x: payload.x, y: payload.y },
  } as const;

  broadcast(spaceId, userId, message);
  await publishRoomEvent(spaceId, userId, message);
}

async function handleChat(ws:Socket , payload:ChatPayload) {
   const { spaceId ,userId} = ws.data;
   if (!spaceId || !userId) {
    return send(ws , {type:"error" ,message:"Join a space first"})
   }

   //what is this now what will be  the paylaod in this and what is this slice(0,500)
   const text = payload.text.trim().slice(0,500);
   if(!text) return

   const message = {
    type:"chat",
    payload:{userId , text, at:Date.now()},
    //what does this as const menas in this why we ahve written in this even 
   } as const;

   // send to everyone else on THIS server, then to other servers via Redis pub/sub
   broadcast(spaceId , userId , message);
   await publishRoomEvent(spaceId , userId , message);


}

export async function onClose(ws: Socket) {
  const { spaceId, userId } = ws.data;
  if (!spaceId || !userId) return;

  removeFromRoom(spaceId, userId);
  await removeUser(spaceId, userId);

  const message = {
    type: "user-left",
    payload: { userId },
  } as const;

  broadcast(spaceId, userId, message);
  await publishRoomEvent(spaceId, userId, message);

  if (roomSize(spaceId) === 0) {
    await unsubscribeFromSpaceEvents(spaceId);
  }
}
