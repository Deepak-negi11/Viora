# Server

Bun server for the 2D Metaverse API and realtime WebSocket layer.

## Responsibilities

- Auth: signup and signin.
- User metadata: avatar selection and bulk avatar lookup.
- Admin APIs: create avatars, maps, and elements.
- Space APIs: create spaces, list spaces, place elements, and read space contents.
- Realtime: join rooms, move one tile at a time, and notify other connected users.

## Run

```bash
bun run dev
```

## Environment

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://localhost:6379
```

`REDIS_URL` is used by the presence helpers. The WebSocket handler still uses local room memory for live sockets.
