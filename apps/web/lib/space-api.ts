import type { MapTemplateId } from "@repo/shared";
import { apiRequest } from "./api-client";

export type SpaceSummary = {
  id: string;
  name: string;
  dimensions: string;
  thumbnail: string | null;
  mapTemplate: MapTemplateId;
};

export type SpaceElement = {
  id: string;
  element: {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    static: boolean;
  };
  x: number;
  y: number;
};

export type SpaceDetails = {
  name: string;
  dimensions: string;
  mapTemplate: MapTemplateId;
  thumbnail: string | null;
  elements: SpaceElement[];
};

type CreateSpaceInput = {
  name: string;
  dimensions: string;
  mapTemplate: MapTemplateId;
};

export function listSpaces(token: string) {
  return apiRequest<{ spaces: SpaceSummary[] }>("/api/v1/space/all", { token });
}

export function createSpace(token: string, input: CreateSpaceInput) {
  return apiRequest<{ spaceId: string }, CreateSpaceInput>("/api/v1/space", {
    method: "POST",
    token,
    body: input,
  });
}

export function deleteSpace(token: string, spaceId: string) {
  return apiRequest<{ message: string }>(`/api/v1/space/${spaceId}`, {
    method: "DELETE",
    token,
  });
}

export function getSpace(token: string, spaceId: string) {
  return apiRequest<SpaceDetails>(`/api/v1/space/${spaceId}`, { token });
}

// one user's public metadata (used to show real names on avatars)
export type UserMeta = {
  userId: string;
  imageUrl: string | null;
  username: string;
};

// look up several users at once by their ids, e.g. getUsersMetadata(token, ["u1","u2"]).
// The server expects ids as a bracketed list: /user/metadata/bulk?ids=[u1,u2]
export function getUsersMetadata(token: string, ids: string[]) {
  const idsParam = encodeURIComponent(`[${ids.join(",")}]`);
  return apiRequest<{ avatars: UserMeta[] }>(
    `/api/v1/user/metadata/bulk?ids=${idsParam}`,
    { token },
  );
}

// one stored chat message
export type ChatScope = "general" | "room";
export type StoredMessage = {
  id: string;
  userId: string;
  text: string;
  at: number;
  scope: ChatScope;
  roomId?: string;
  roomName?: string;
};

export function getSpaceMessages(
  token: string,
  spaceId: string,
  scope: ChatScope = "general",
  roomId?: string,
) {
  const params = new URLSearchParams({ scope });
  if (roomId) params.set("roomId", roomId);
  return apiRequest<{ messages: StoredMessage[] }>(
    `/api/v1/space/${spaceId}/messages?${params.toString()}`,
    { token },
  );
}

// a selectable avatar (character)
export type Avatar = { id: string; imageUrl: string | null; name: string | null };

// list all avatars a user can choose from
export function getAvatars(token: string) {
  return apiRequest<{ avatars: Avatar[] }>("/api/v1/avatars", { token });
}

// set the signed-in user's avatar
export function setMyAvatar(token: string, avatarId: string) {
  return apiRequest<{ message: string }, { avatarId: string }>("/api/v1/user/metadata", {
    method: "POST",
    token,
    body: { avatarId },
  });
}
