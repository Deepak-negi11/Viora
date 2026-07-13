import prisma from "@repo/db";
import { requireAuth } from "../middleware/auth";
import { parseDimensions } from "../utils/dimensions";
import { jsonMessage } from "../utils/http";

//what is this body is this element body what does that means
type CreateElementBody = {
  imageUrl?: string;
  width?: unknown;
  height?: unknown;
  static?: boolean;
};

type CreateAvatarBody = {
  imageUrl?: string;
  name?: string;
};

type CreateMapBody = {
  thumbnail?: string;
  dimensions?: string;
  name?: string;
  defaultElements?: Array<{ elementId: string; x: number; y: number }>;
};

async function requireAdmin(req: Request): Promise<{ userId: string } | Response> {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user || user.role !== "Admin") {
    return Response.json({ message: "Admin only" }, { status: 403 });
  }

  return { userId: auth.userId };
}

//what is the create element what is the element in this like the i think we are nto creating element we are using the pre build element so this is the route which is used no where

export async function handleCreateElement(req: Request): Promise<Response> {
  const admin = await requireAdmin(req);
  //what is this instace of the respose mean in this
  if (admin instanceof Response) return admin;

  //what is this explain me this i do understand the menaing explain me the syntax in this
  const body = (await req.json().catch(() => null)) as CreateElementBody | null;
  const { imageUrl, width, height, static: isStatic } = body ?? {};

  if (
    !imageUrl
    || typeof width !== "number"
    || typeof height !== "number"
    || !Number.isInteger(width)
    || !Number.isInteger(height)
    || width <= 0
    || height <= 0
  ) {
    return jsonMessage("Invalid element");
  }

  const element = await prisma.elements.create({
    data: {
      imageUrl,
      width,
      height,
      static: Boolean(isStatic),
    },
  });

  return Response.json({ id: element.id });
}

//even this is not used any where because the not creating hte avatar also
export async function handleCreateAvatar(req: Request): Promise<Response> {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => null)) as CreateAvatarBody | null;
  const { imageUrl, name } = body ?? {};

  if (!imageUrl || !name) {
    return jsonMessage("Invalid avatar");
  }

  const avatar = await prisma.avatar.create({
    data: { imageUrl, name },
  });

  return Response.json({ avatarId: avatar.id });
}

//i do think they are the route which can we used if i have not create dhte prebuild map i thik theri is only one map for now so even this isuse ess so tell me if it is or not i am mising somthing
export async function handleCreateMap(req: Request): Promise<Response> {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => null)) as CreateMapBody | null;
  const { thumbnail, dimensions, name, defaultElements } = body ?? {};

  if (!name || !dimensions) {
    return jsonMessage("Invalid map");
  }

  const size = parseDimensions(dimensions);
  if (!size) {
    return jsonMessage("Invalid dimension");
  }

  const map = await prisma.map.create({
    data: {
      name,
      width: size.width,
      height: size.height,
      thumbnail,
      mapElements: {
        create: (defaultElements ?? []).map((element) => ({
          elementId: element.elementId,
          x: element.x,
          y: element.y,
        })),
      },
    },
  });

  return Response.json({ id: map.id });
}
