import * as z from "zod";

//why i have created a position schema what is the even need of this
const PositionSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
});

// why these are object tell that is thier a reason to bind then together like the type and the payload
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

//when do we even create these like this zod schema and what is this literal type tell me this also the like explain me this zod schema like this when does this apply and used where in this
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

//when does even this happen and what to use this
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
  type: z.literal("chat"),
  payload: z.object({
    userId: z.string(),
    text: z.string(),
    at: z.number(),
  })
})

// what the server SENDS to everyone when someone reacts with an emoji
export const ReactionBroadcastMessage = z.object({
  type: z.literal("reaction"),
  payload: z.object({
    userId: z.string(),
    emoji: z.string(),
    at: z.number(),
  }),
});

// a WebRTC "signal" = an SDP offer/answer, or an ICE candidate, that two peers swap what isthis enum explain that to me what is this and what is this sdp
export const RtcSignal = z.object({
  kind: z.enum(["offer", "answer", "candidate"]),
  sdp: z.string().optional(),
  candidate: z.any().optional(),
});

// browser -> server: "relay this signal to targetUserId" what is this even used for tell that
export const WebRtcSignalMessage = z.object({
  type: z.literal("webrtc-signal"),
  payload: z.object({ targetUserId: z.string(), signal: RtcSignal }),
});

// server -> browser: "fromUserId sent you this signal"
export const WebRtcSignalBroadcast = z.object({
  type: z.literal("webrtc-signal"),
  payload: z.object({ fromUserId: z.string(), signal: RtcSignal }),
});

//what is this server message explain this where is thei even used for
export const ServerMessage = z.discriminatedUnion("type", [
  SpaceJoinedMessage,
  UserJoinMessage,
  MovementMessage,
  MovementRejectedMessage,
  UserLeftMessage,
  ErrorMessage,
  ChatBroadcastMessage,
  ReactionBroadcastMessage,
  WebRtcSignalBroadcast,
]);


export const ChatMessage = z.object({
  type: z.literal("chat"),
  payload: z.object({
    text: z.string().min(1).max(500)
  })
})

// what the browser SENDS when you tap an emoji in the control bar
export const ReactionMessage = z.object({
  type: z.literal("reaction"),
  payload: z.object({
    emoji: z.string().min(1).max(8),
  }),
});

//what is teh z.discrminate Union in this and explain this cleint message where is this even used for
export const ClientMessage = z.discriminatedUnion("type", [
  JoinMessage,
  MoveMessage,
  ChatMessage,
  ReactionMessage,
  WebRtcSignalMessage,
]);

//what is this infer like what is the use case of this lines why is this even done
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
export type ReactionMessage = z.infer<typeof ReactionMessage>;
export type ReactionBroadcastMessage = z.infer<typeof ReactionBroadcastMessage>;
export type WebRtcSignalMessage = z.infer<typeof WebRtcSignalMessage>;
export type WebRtcSignalBroadcast = z.infer<typeof WebRtcSignalBroadcast>;
