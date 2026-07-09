import { redis } from "./redis";

export type Position = { x: number; y: number };
export type RoomUser = { userId: string } & Position;

function roomKey(spaceId: string): string {
  return `space:${spaceId}:positions`;
}

function encode(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function decode(value: string): Position {
  const [x, y] = value.split(",").map(Number);
  return { x: x ?? 0, y: y ?? 0 };
}

//what is this hmset in this 
export async function setUserOnline(spaceId: string, userId: string, pos: Position) {
  await redis.hmset(roomKey(spaceId), [userId, encode(pos)]);
}

export async function setUserPosition(spaceId: string, userId: string, pos: Position) {
  await redis.hmset(roomKey(spaceId), [userId, encode(pos)]);
}

//hmget in this think
export async function getUserPosition(spaceId: string, userId: string): Promise<Position | null> {
  const value = await redis.hmget(roomKey(spaceId), [userId]);
  const raw = value?.[0];
  if (!raw) return null;
  return decode(raw);
}

export async function isUserOnline(spaceId: string, userId: string): Promise<boolean> {
  const value = await redis.hmget(roomKey(spaceId), [userId]);
  return Boolean(value?.[0]);
}

export async function getRoomUsers(spaceId: string): Promise<RoomUser[]> {
  const all = (await redis.hgetall(roomKey(spaceId))) as Record<string, string> | null;
  if (!all) return [];

  const users: RoomUser[] = [];
  for (const userId in all) {
    const encodedPosition = all[userId];
    if (!encodedPosition) continue;

    const pos = decode(encodedPosition);
    users.push({ userId, ...pos });
  }
  return users;
}

export async function removeUser(spaceId: string, userId: string) {
  await redis.send("HDEL", [roomKey(spaceId), userId]);
}
