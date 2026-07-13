import { redis } from "./redis";

export type Position = { x: number; y: number };
export type RoomUser = { userId: string } & Position;

//expian me this positionkey and the onlin key what are these key
function positionsKey(spaceId: string): string {
  return `space:${spaceId}:positions`;
}

function onlineKey(spaceId: string): string {
  return `space:${spaceId}:online`;
}

function encode(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

function decode(value: string): Position | null {
  const [x, y] = value.split(",").map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x! < 0 || y! < 0) return null;
  return { x: x!, y: y! };
}

export async function setUserOnline(spaceId: string, userId: string, pos: Position) {
  //what is tihs redis.send in this and SADD in this
  await redis.send("SADD", [onlineKey(spaceId), userId]);
  await redis.hmset(positionsKey(spaceId), [userId, encode(pos)]);
}

export async function setUserPosition(spaceId: string, userId: string, pos: Position) {
  await redis.hmset(positionsKey(spaceId), [userId, encode(pos)]);
}

export async function getUserPosition(spaceId: string, userId: string): Promise<Position | null> {
  //what are this hmset and then hmget
  const value = await redis.hmget(positionsKey(spaceId), [userId]);
  const raw = value?.[0];
  if (!raw) return null;
  return decode(raw);
}

export async function isUserOnline(spaceId: string, userId: string): Promise<boolean> {
  //explainme this sismember what is this now
  const isMember = await redis.send("SISMEMBER", [onlineKey(spaceId), userId]);
  return isMember === 1;
}

export async function getRoomUsers(spaceId: string): Promise<RoomUser[]> {
  const onlineIds = (await redis.send("SMEMBERS", [onlineKey(spaceId)])) as string[] | null;
  if (!onlineIds || onlineIds.length === 0) return [];

  const positions = (await redis.hmget(positionsKey(spaceId), onlineIds)) as (string | null)[];

  const users: RoomUser[] = [];
  for (let i = 0; i < onlineIds.length; i++) {
    const userId = onlineIds[i];
    const rawPos = positions[i];
    if (!userId) continue;
    const pos = rawPos ? decode(rawPos) : null;
    if (!pos) continue;
    users.push({ userId, ...pos });
  }
  return users;
}

export async function removeUser(spaceId: string, userId: string) {
  await redis.send("SREM", [onlineKey(spaceId), userId]);
}
