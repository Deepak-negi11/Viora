import prisma from "@repo/db";
import { requireAuth } from "../middleware/auth";

export async function handleUpdateMetadata(req: Request): Promise<Response> {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => null);
  const avatarId: string | undefined = body?.avatarId

  if (!avatarId) {
    return Response.json({ message: "avatarId is required" }, { status: 400 });
  }
  const avatarExists = await prisma.avatar.findUnique({ where: { id: avatarId } });
  if (!avatarExists) {
    return Response.json({ message: "Avatar not found" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { avatarId },
  });

  return Response.json({ message: "Metadata updated" });
}

export async function handleBulkMetadata(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids") ?? "[]";

  
  const userIds = idsParam
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { avatar: true },
  });

  const avatars = users.map((user) => ({
    userId: user.id,
    imageUrl: user.avatar?.imageUrl ?? null,
    username: user.username,
  }));

  return Response.json({ avatars });
}

export async function handleGetAvatars(_req: Request): Promise<Response> {
  const avatars = await prisma.avatar.findMany();

  return Response.json({
    avatars: avatars.map((avatar) => ({
      id: avatar.id,
      imageUrl: avatar.imageUrl,
      name: avatar.name,
    })),
  });
}
