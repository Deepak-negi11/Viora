import prisma from "@repo/db";
import { requireAuth } from "../middleware/auth";
import { formatDimensions, parseDimensions } from "../utils/dimensions";
import { jsonMessage } from "../utils/http";

type CreateSpaceBody = {
  name?: string;
  dimensions?: string;
  mapId?: string;
};

type AddElementBody = {
  elementId?: string;
  spaceId?: string;
  x?: unknown;
  y?: unknown;
};


export async function handleCreateSpace(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = (await req.json().catch(() => null)) as CreateSpaceBody | null;
  const { name, dimensions, mapId } = body ?? {};

  if (!name || !dimensions) {
    return jsonMessage("name and dimensions are required");
  }

  const requestedSize = parseDimensions(dimensions);
  if (!requestedSize) {
    return jsonMessage("Invalid dimension");
  }

  if (!mapId) {
    const space = await prisma.space.create({
      data: {
        name,
        width: requestedSize.width,
        height: requestedSize.height,
        creatorId: auth.userId,
      },
    });

    return Response.json({ spaceId: space.id });
  }

  const map = await prisma.map.findUnique({
    where: { id: mapId },
    include: { mapElements: true },
  });

  if (!map) {
    return jsonMessage("Map not found");
  }

  // explain me this map.mapelemt full thing what is even this 
  const defaultElements = map.mapElements
    .filter((element) => element.elementId && element.x !== null && element.y !== null)
    .map((element) => ({
      elementId: element.elementId!,
      x: element.x!,
      y: element.y!,
    }));

  const space = await prisma.space.create({
    data: {
      name,
      width: map.width,
      height: map.height,
      creatorId: auth.userId,
      mapId: map.id,
      elements: {
        create: defaultElements,
      },
    },
  });

  return Response.json({ spaceId: space.id });
}

export async function handleDeleteSpace(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const spaceId = new URL(req.url).pathname.split("/").pop() ?? "";
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!space) {
    return jsonMessage("Space not found");
  }

  if (space.creatorId !== auth.userId) {
    return jsonMessage("Not your space", 403);
  }

  await prisma.space.delete({ where: { id: spaceId } });
  return Response.json({ message: "Space deleted" });
}

export async function handleListSpaces(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const spaces = await prisma.space.findMany({
    where: { creatorId: auth.userId },
  });

  return Response.json({
    spaces: spaces.map((space) => ({
      id: space.id,
      name: space.name,
      dimensions: formatDimensions(space),
      thumbnail: space.thumbnail,
    })),
  });
}

export async function handleGetSpace(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const spaceId = new URL(req.url).pathname.split("/").pop() ?? "";
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: { elements: { include: { element: true } } },
  });

  if (!space) {
    return jsonMessage("Space not found");
  }

  return Response.json({
    dimensions: formatDimensions(space),
    elements: space.elements.map((spaceElement) => ({
      id: spaceElement.id,
      element: {
        id: spaceElement.element.id,
        imageUrl: spaceElement.element.imageUrl,
        width: spaceElement.element.width,
        height: spaceElement.element.height,
        static: spaceElement.element.static,
      },
      x: spaceElement.x,
      y: spaceElement.y,
    })),
  });
}

export async function handleAddElement(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = (await req.json().catch(() => null)) as AddElementBody | null;
  const { elementId, spaceId, x, y } = body ?? {};

  if (!elementId || !spaceId || typeof x !== "number" || typeof y !== "number") {
    return jsonMessage("Invalid request");
  }

  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) {
    return jsonMessage("Space not found");
  }

  if (x < 0 || y < 0 || x > space.width || y > space.height) {
    return jsonMessage("Out of bounds");
  }

  await prisma.spaceElements.create({
    data: { elementId, spaceId, x, y },
  });

  return Response.json({ message: "Element added" });
}

export async function handleListElements(_req: Request): Promise<Response> {
  const elements = await prisma.elements.findMany();

  return Response.json({
    elements: elements.map((element) => ({
      id: element.id,
      imageUrl: element.imageUrl,
      width: element.width,
      height: element.height,
      static: element.static,
    })),
  });
}


// GET /api/v1/space/:spaceId/messages — recent chat history (oldest first), capped at 50
export async function handleGetMessages(req: Request): Promise<Response> {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const parts = new URL(req.url).pathname.split("/");
  const spaceId = parts[parts.length - 2] ?? ""; // ".../space/<id>/messages"

  const rows = await prisma.chatMessage.findMany({
    where: { spaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const messages = rows
    .reverse()
    .map((m) => ({ id: m.id, userId: m.userId, text: m.text, at: m.createdAt.getTime() }));

  return Response.json({ messages });
}
