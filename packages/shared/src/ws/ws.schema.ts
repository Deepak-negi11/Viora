import * as z from "zod";

const PositionSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
});

export const JoinMessage = z.object({
  type: z.literal("join"),
  payload: z.object({
    spaceId: z.string(),
    token: z.string(),
  }),
});

export const MoveMessage = z.object({
  type: z.literal("move"),
  payload: PositionSchema,
});

export const SpaceJoinedMessage = z.object({
  type: z.literal("space-joined"),
  payload: z.object({
    userId: z.string(),
    spawn: PositionSchema,
    users: z.array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
      }),
    ),
  }),
});

export const UserJoinMessage = z.object({
  type: z.literal("user-join"),
  payload: z.object({
    userId: z.string(),
    x: z.number(),
    y: z.number(),
  }),
});

export const MovementMessage = z.object({
  type: z.literal("movement"),
  payload: z.object({
    userId: z.string(),
    x: z.number(),
    y: z.number(),
  }),
});

export const MovementRejectedMessage = z.object({
  type: z.literal("movement-rejected"),
  payload: z.object({ x: z.number(), y: z.number() }),
});

export const UserLeftMessage = z.object({
  type: z.literal("user-left"),
  payload: z.object({ userId: z.string() }),
});

export const ErrorMessage = z.object({
  type: z.literal("error"),
  message: z.string(),
});


export const ChatBroadcastMessage = z.object({
  type:z.literal("chat"),
  payload:z.object({
    userId:z.string(),
    text:z.string(),
    at:z.number() , 
  })
})

//what is this server message 
export const ServerMessage = z.discriminatedUnion("type", [
    SpaceJoinedMessage,
    UserJoinMessage,
    MovementMessage,
    MovementRejectedMessage,
    UserLeftMessage,
    ErrorMessage,
    ChatBroadcastMessage, 
  ]);


export const ChatMessage = z.object({
  type:z.literal("chat"),
  payload:z.object({
    text:z.string().min(1).max(500)
  })
})

 export const ClientMessage = z.discriminatedUnion("type", [
    JoinMessage,
    MoveMessage,
    ChatMessage, 
  ]);
  

export type JoinMessage = z.infer<typeof JoinMessage>;
export type MoveMessage = z.infer<typeof MoveMessage>;
export type ClientMessage = z.infer<typeof ClientMessage>;

export type SpaceJoinedMessage = z.infer<typeof SpaceJoinedMessage>;
export type UserJoinMessage = z.infer<typeof UserJoinMessage>;
export type MovementMessage = z.infer<typeof MovementMessage>;
export type MovementRejectedMessage = z.infer<typeof MovementRejectedMessage>;
export type UserLeftMessage = z.infer<typeof UserLeftMessage>;
export type ErrorMessage = z.infer<typeof ErrorMessage>;
export type ServerMessage = z.infer<typeof ServerMessage>;
export type ChatMessage = z.infer<typeof ChatMessage>;
export type ChatBroadcastMessage = z.infer<typeof ChatBroadcastMessage>;