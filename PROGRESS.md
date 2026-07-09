# PROGRESS — Gather-style 2D Metaverse build

Read this first after a chat reset to resume with full context.

## What we're building
A Gather.town-style 2D metaverse. The backend (Bun + WebSocket + Redis + Prisma/Postgres) already existed.
We're building the Phaser game client in the Next.js app (`apps/web`) and connecting it to the existing
WebSocket server for real-time multiplayer.

## How to work with this user (important)
- Explain in the repo's `EXPLANATION_STYLE.md` format: simple words, real examples (deepak, rahul, room-1,
  x=10 y=20), always say WHY a thing exists, end with a one-line "Crux". Keep it SIMPLE — first-time frontend learner.
- The user types most code by hand to learn. MEDIUM steps: assistant may write code (ask first). HARD steps
  (especially WebRTC video): the USER writes by hand with guidance.
- Never delete the user's own inline `// comments`.
- Confirm before large or destructive changes.

## Done so far
- Phaser 4.2.0 installed in `apps/web`.
- `apps/web/components/phaser/phaser-game.tsx`: mounts Phaser via `next/dynamic({ ssr:false })`; passes
  `othersRef` + `moveRef` into the scene via the game registry (preBoot). Props are optional (so `/phaser` works too).
- `apps/web/components/phaser/scenes/arena-scene.ts` (the scene):
  - TILE = 32, world COLS = 40 x ROWS = 30. `pixelArt: true`. Camera `setZoom(2)`, `startFollow`, `setBounds`.
  - Real tiled floor (LimeZu). Player = LimeZu "Adam" sprite (16x32 frames, `setScale(2)`).
  - Walk anims: walk-down 18-23, walk-up 6-11, walk-left 12-17, walk-right 0-5. Standing frames: down 18, up 6, left 12, right 0.
  - Movement: arrow keys (one tile) + click/tap-to-walk (`stepTowardTarget` walks one tile at a time — server-safe).
  - Multiplayer: draws other players in `update()`, glides + animates them, name tags above each avatar
    ("You" for self, short id for others).
  - Two rooms via floor patches: teal meeting room (tile 3,3 size 15x12), herringbone lounge (tile 21,3 size 17x13).
  - 8 furniture pieces (`furn0..7`) grouped into the two rooms.
- `apps/web/app/space/[spaceId]/page.tsx`: uses `useSpaceSocket(spaceId)`, keeps `othersRef`/`moveRef`, renders `<PhaserGame>`.
- `apps/web/app/phaser/page.tsx`: single-player Phaser sandbox.

## Assets (in apps/web/public)
- Floors: `assets/floor-grey.png`, `floor-teal.png`, `floor-herringbone.png`, `floor-brick.png` (cut from LimeZu Room Builder 32x32).
- Character: `assets/adam-idle.png`, `assets/adam-run.png`.
- Furniture: `assets/furniture/piece_0.png` .. `piece_23.png` (auto-cut from LimeZu Interiors). Numbered catalog at
  `public/furn-catalog.png` (open in browser to see piece numbers).
- Raw pack: `public/Modern tiles_Free/` (LimeZu free version — NON-COMMERCIAL license only).

## Server contract (do not break)
- WS at `/ws`. Client sends `join {spaceId, token}`, `move {x, y}`. Server sends `space-joined {userId, spawn, users[]}`,
  `user-join`, `movement`, `movement-rejected`, `user-left`, `error`.
- Positions are TILE coordinates (integers). Server accepts ONLY one-tile moves (Manhattan distance 1) — that's why
  click-to-walk steps one tile at a time.
- Test multiplayer: be signed in + create a space in `/spaces` + open `/space/<id>` in two browser windows.
  Run `bun run dev` from repo root (web on port 3005; API server + Redis must be running).

## Known gotchas
- Images larger than 2000px on any side break the chat (many-image limit). Keep pasted screenshots AND any generated
  preview images <= 2000px. (This is why we had to /clear.)
- The assistant's own image-file viewing (read Image) has been failing — rely on the user pasting SMALL screenshots
  (<=2000px) or describing what they see.
- Editor revert risk: if the user's editor has a file open, saving can overwrite assistant edits. After the assistant
  writes a file, the user should Reload it in their editor.

## Next steps (roadmap)
1. Arrange furniture into a real room (identify pieces from `/furn-catalog.png` or a small screenshot).
2. Walls around the rooms (LimeZu Room Builder wall tiles).
3. Plants / small items (smaller furniture pieces not yet used).
4. Collision — can't walk through furniture/walls (backend `Elements.static` flag supports this).
5. Real usernames on name tags (small API fetch).
6. HARD (user writes by hand, with guidance): proximity video/audio + text chat via WebRTC.

## Crux
Phaser scene renders tiles/avatars; the React `use-space-socket` hook owns the WebSocket; the server is authoritative
with one-tile moves. Multiplayer + two furnished rooms already work. Next: polish the map (furniture, walls, collision),
then proximity video.


## Session log — 2026-07-08 (UI polish + first real rooms)

Verified via web fetch that the pro stack matches our plan: WorkAdventure (open-source virtual office,
5.5k stars) pins `phaser@3.86`, builds maps in Tiled as `.tmj` with PNG tilesets, and puts its UI
(bottom bar/menus) in Svelte AS A SEPARATE LAYER over the canvas. LimeZu Modern Interiors ships a
Character Generator (32×32). Conclusion: world = Phaser + Tiled tileset; chrome = React overlay.

Done this session (all type-check clean):
- `arena-scene.ts`:
  - Name tags upgraded to Gather-style PILLS via `makeNameTag()` (rounded bg + green online dot;
    purple for self, grey for others). Applied to self + others.
  - Avatar SHADOWS (ellipse) under self + others, updated each frame.
  - DEPTH SORTING: floors at depth -1000; furniture + walls + avatars sort by their bottom edge
    (`y + displayHeight` / feet), so avatars pass behind/in front correctly. Name pills at 10000.
  - Real ROOMS via new `buildRoom(rx,ry,rw,rh,floorKey,door)`: lays floor, draws tile WALLS
    (dark body + light top strip) with a DOOR gap, and records wall tiles in `this.blocked`.
  - COLLISION: `moveToTile` refuses moves onto blocked tiles (walls) and drops the click target.
    Still one-tile moves, so the server contract is unchanged.
  - Dropped the teal "bathroom" floor. Meeting room = herringbone (wood), lounge = grey + a
    translucent RUG (rounded rect). Furniture moved to interior tiles (clear of walls).
  - Fixed 2 pre-existing TS errors (other-player tween closure captured a reassignable `sprite` →
    captured as `const movingSprite`).
- New `components/game-ui/control-bar.tsx`: Gather-style bottom bar (avatar · mic · camera · emoji ·
  Leave) as a REACT OVERLAY. pointer-events-none strip + pointer-events-auto bar so click-to-walk
  still works. Accessible (aria-label/aria-pressed/focus-visible/motion-reduce). Mic/cam are visual
  toggles only — WebRTC is the later HARD step. Wired into `app/space/[spaceId]/page.tsx` (only shows
  on the space page, not `/phaser`, since it needs the socket + Leave → router.push("/spaces")).

Floor tiles (all 32×32, pre-cut): floor-grey = clean neutral (hallway), floor-herringbone = wood,
floor-brick = red brick, floor-teal = mint diamond (retired — read as a bathroom).

Tiled tilesets for the NEXT big step (walls/furniture as real pixel art):
- `public/Modern tiles_Free/Interiors_free/32x32/Room_Builder_free_32x32.png` (544×736 = 17×23 tiles) — walls/floors/doors/windows.
- `public/Modern tiles_Free/Interiors_free/32x32/Interiors_free_32x32.png` (512×2848 = 16×89 tiles) — furniture.

Next steps:
1. Furniture COLLISION (block furniture footprints too — currently only walls block).
2. Move to a real Tiled `.tmj` map so walls/floors are authentic LimeZu pixel art (current walls are
   clean drawn rectangles). Load with `this.load.tilemapTiledJSON` + `map.createLayer`, turn a
   `collision` layer into `this.blocked`.
3. Real usernames on pills + the control-bar avatar (small API fetch; currently uses selfId).
4. HARD (user writes by hand): proximity video/audio via WebRTC, wired to the mic/cam buttons.

Note: the assistant's `read Image` worked this session (was failing before) — could inspect tilesets/floors.


## Session log — 2026-07-08 (part 2: collision, real names, 3D walls)

Did the three "next" items one by one (all type-check clean on web):

1. Furniture COLLISION — new `blockFootprint(tx,ty,widthPx,heightPx)` blocks each furniture piece's
   tile footprint (rounds px→tiles) and adds them to `this.blocked`. Called in the furniture loop.
2. Real USERNAMES on pills —
   - Server: `handleBulkMetadata` (`GET /api/v1/user/metadata/bulk?ids=[...]`) now also returns
     `username` (was only `userId` + `imageUrl`). Backward compatible; no test asserted the shape.
   - Web: `getUsersMetadata(token, ids)` in `lib/space-api.ts`. `space/[spaceId]/page.tsx` fetches
     names for self + others (dedup via a `fetchedIds` ref so movement doesn't refetch), keeps a
     `namesRef`, passes it to `PhaserGame` → registry → scene.
   - Scene: reads `namesRef`; other pills show the real username (fallback = short id) and REBUILD
     when the name loads (tracked in `otherTagNames`). ControlBar avatar uses `names[selfId]`.
   - Self pill still says "You" (clear + avoids passing selfId into the scene). Real self name shows
     in the control-bar avatar. Easy to switch self pill to the real name later if wanted.
3. Walls upgraded to 3D-looking, per-room colored walls (FACE + lighter TOP cap + darker BASE),
   passed into `buildRoom(..., wall)`. Meeting room = muted purple, lounge = slate (Gather-style).

IMPORTANT finding on "authentic LimeZu pixel walls" (why we did drawn walls, not a Tiled .tmj yet):
Inspected `Room_Builder_free_32x32.png` with a temp pngjs crop tool (viewed top rows + right region).
The walls are thin 9-slice BORDER pieces (corners/T-junctions/door/window) with baked-in annotation
text ("room border / ceiling"), and there is NO solid wall-block tile (right side is floor swatches +
textured grey carpet). Composing those correctly is a visual/Tiled-GUI job; hand-coding tile indices
blind would look broken. So drawn 3D walls are the reliable choice for now.

To finish authentic pixel walls later (the real Tiled path):
- Open the two tilesets in Tiled (Room_Builder_free_32x32.png = 17×23 tiles, Interiors_free_32x32.png
  = 16×89 tiles), paint one office room + walls, mark a `collision` layer, add a `spawn` object,
  export `apps/web/public/office.tmj`.
- Then wire Phaser: `this.load.image("roombuilder", ...)`, `this.load.tilemapTiledJSON("office", ...)`,
  `map.createLayer(...)`, and turn the `collision` layer into `this.blocked` (reuse the existing
  collision check in `moveToTile`). Assistant writes this loader once a real .tmj exists.


## Session log — 2026-07-08 (part 3: presence UI)

- New `components/game-ui/presence-bar.tsx`: top-left overlay showing live "N people online" +
  avatar circles (self highlighted indigo, others grey, "+N" overflow), accessible (aria-label,
  title tooltips, motion-reduce on the ping). Reads from data the page already has (no extra fetch).
- `space/[spaceId]/page.tsx`: builds a `people` list (self first) via useMemo from selfId/others/names
  and renders `<PresenceBar people={people} />` alongside `<ControlBar>`.
- Note: `/impeccable` is NOT a built-in Kiro slash command (not in /help) and not a documented prompt;
  can't be invoked by the assistant. Treated the request as "make the React overlay more usable."

Still open (world look): furniture is bedroom-themed (furn0..7 = LimeZu piece_0..7). To match Gather's
OFFICE look we need office furniture (conference table, chairs, sofas) cropped from
`Interiors_free_32x32.png` (16×89 tiles) — an iterative identify-and-crop task; do with user confirming pieces.


## Session log — 2026-07-08 (part 4: text chat DONE)

Text chat is live (reuses the movement fan-out: WebSocket → broadcast → Redis pub/sub). Type-checks clean.
- Shared schema (user typed): `ChatMessage` in ClientMessage, `ChatBroadcastMessage` in ServerMessage + type exports.
- Server `ws-handler.ts`: `handleChat` (guard → trim/cap 500 → broadcast to same-server room → publish to
  other servers). FIX applied: it was missing the local `broadcast(...)` (only published), so same-server
  users wouldn't see messages — added it.
- Hook `use-space-socket.ts`: `ChatEntry` type, `message`/`setMessage` state, `case "chat"` appends
  (FIX: `message.paylaod` → `message.payload`), new `sendChat` (optimistic self-append), returns
  `messages: message` + `sendChat`.
- New `components/game-ui/chat-panel.tsx`: bottom-left panel (list + input + Send), auto-scroll,
  "You"/username labels, accessible.
- `space/[spaceId]/page.tsx`: imports + `<ChatPanel messages names selfId onSend={sendChat} />`.
- Remember: restart the Bun server after the shared-schema change. No history yet (late joiners see nothing) —
  that's the "persist chat to Postgres" follow-up.


## Session log — 2026-07-09 (part 5: proximity awareness DONE)

Proximity detection + fade (the "spotlight" effect + the trigger set for future WebRTC video). Type-checks clean.
- `lib/proximity.ts` (user typed): `PROXIMITY_RADIUS=3`, `tilesApart` (Chebyshev), `isNearby`.
- `space/[spaceId]/page.tsx` (user typed nearbyIds/nearbyRef): assistant added `nearbyRef` prop to
  `<PhaserGame>` and `isNearby` on each `people` entry.
- `phaser-game.tsx`: `nearbyRef` prop + registry `set("nearbyRef")` + dep.
- `arena-scene.ts`: `nearbyRef` field, read in create, and in update() fade far avatars
  (`sprite/shadow/tag` alpha; nearby=1, far=0.35). Default visible when no ref (/phaser sandbox).
- `presence-bar.tsx`: `PresencePerson.isNearby` → green ring + "(nearby)" title on nearby people.

Working agreement (user, 2026-07-09): assistant applies all code that is NOT a hard/new feature and
reports it; the USER writes the hard/new/learnable features by hand (with guidance).

NEXT = WebRTC proximity video/audio = HARD + NEW = USER writes it. Plugs into `nearbyIds`.
Suggested split — assistant plumbing (offer to do): signaling message types in shared schema + a server
relay that forwards a signal to one target user + a React `<VideoTile>` presentational component.
User's learnable core: getUserMedia, RTCPeerConnection, offer/answer/ICE exchange, attaching MediaStreams.
