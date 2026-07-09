import Phaser from "phaser";

const TILE = 32; // pixels per tile: every grid cell is 32x32 screen pixels

const COLS = 40;
const ROWS = 30;
export class ArenaScene extends Phaser.Scene{
    // spawn on the stone path just outside the office entrance
    private tileX = 19;
    private tileY = 27;

    private maxTileX = 0;
    private maxTileY = 0;

    private facing : "down" |"up" | "right" | "left" = "down";
    private isMoving = false;

    private otherSprites:Record<string,Phaser.GameObjects.Sprite> = {}
    private otherRef?:{current:Record<string,{x:number;y:number}>}
    private moveRef?: {current:(p:{x:number;y:number})=>void}
    // userId -> username, filled by the React page; used to label other players' pills
    private namesRef?: {current:Record<string,string>}
    // userIds currently near me (for fading far-away avatars)
    private nearbyRef?: {current:Set<string>}
    // the name currently SHOWN on each other player's pill, so we can rebuild it when the real name loads
    private otherTagNames: Record<string, string> = {};
    private selfTagName = "";

    // where a click/tap told us to walk to (in tiles), or null when we're not walking to a target
    private targetX: number | null = null;
    private targetY: number | null = null;
    // remembers each other player's last tile, so we only glide them when they actually move
    private otherTiles: Record<string, { x: number; y: number }> = {};
    // mapping of "x,y" to sitting direction
    private chairMap: Record<string, "up" | "down" | "left" | "right"> = {};
    // the name label above me, and one label above each other player
    private nameTag!: Phaser.GameObjects.Container;
    private otherTags: Record<string, Phaser.GameObjects.Container> = {};
    // a soft shadow ellipse under me and under each other player, so avatars feel grounded
    private playerShadow!: Phaser.GameObjects.Ellipse;
    private otherShadows: Record<string, Phaser.GameObjects.Ellipse> = {};
    // tiles you cannot walk onto (walls, furniture, trees). key format "x,y".
    private blocked = new Set<string>();

    private player!: Phaser.GameObjects.Sprite

    constructor(){
        super("arena")
    }

    preload(){
        // floors, walls, grass and the path are generated at runtime in makeTextures()
        this.load.spritesheet("adam","/assets/adam-run.png",{
            frameWidth:16,
            frameHeight:32
        });

        // furniture pieces (cut from the LimeZu Interiors tileset)
        for (const i of [6, 7, 8, 9, 12, 17, 19, 20, 22, 23]) {
            this.load.image("furn" + i, "/assets/furniture/piece_" + i + ".png");
        }
        // smaller single items cut out of the composite pieces
        for (const n of [
            "table-big", "table-small", "seat-tl", "seat-bl",
            "chair-wood", "chair-wood2", "pot-1", "pot-2", "mirror",
            "lamp-warm", "lamp-blue", "shelf-single",
        ]) {
            this.load.image(n, "/assets/furniture/sub/" + n + ".png");
        }
        // outdoor sprites (cut from the Serene Village tileset)
        for (const n of [
            "tree-green", "tree-lime", "tree-teal", "tree-teal2",
            "bush-small", "bush-ball", "flower-red", "flower-blue",
            "flower-yellow", "rock-small", "rock-med",
        ]) {
            this.load.image(n, "/assets/outdoor/" + n + ".png");
        }
    }

    create(){
        const worldWidth = COLS * TILE;
        const worldHeight = ROWS * TILE;

        this.makeTextures();

        // ============================================================
        // 1. OUTDOORS — grass everywhere + a stone path to the door
        // ============================================================
        this.add.tileSprite(0, 0, worldWidth, worldHeight, "grass").setOrigin(0, 0).setDepth(-1010);
        this.add.tileSprite(18 * TILE, 26 * TILE, 4 * TILE, 4 * TILE, "path").setOrigin(0, 0).setDepth(-1005);

        // ============================================================
        // 2. THE BUILDING — one connected office, x3..36 / y2..26
        // ============================================================
        // wood floor under the whole building
        this.add.tileSprite(3 * TILE, 2 * TILE, 34 * TILE, 25 * TILE, "floor-wood").setOrigin(0, 0).setDepth(-1000);

        const zone = (x: number, y: number, w: number, h: number, key: string) =>
            this.add.tileSprite(x * TILE, y * TILE, w * TILE, h * TILE, key).setOrigin(0, 0).setDepth(-998);

        // carpet in the 4 offices along the top
        for (const ox of [4, 11, 23, 30]) zone(ox, 3, 6, 6, "floor-office");
        zone(4, 14, 9, 6, "floor-conf");    // conference room
        zone(27, 14, 9, 6, "floor-lounge"); // lounge
        zone(4, 21, 10, 5, "floor-cafe");   // café (open corner)

        // --- walls ---
        this.wallRow(3, 36, 2);                          // building top
        this.wallRow(3, 36, 26, [18, 19, 20, 21]);       // building bottom, entrance gap
        this.wallCol(3, 2, 26);                          // building left
        this.wallCol(36, 2, 26);                         // building right
        // office dividers + office fronts (each with a 2-tile doorway)
        for (const x of [10, 17, 22, 29]) this.wallCol(x, 3, 9);
        this.wallRow(4, 9, 9, [6, 7]);
        this.wallRow(11, 16, 9, [13, 14]);
        this.wallRow(23, 28, 9, [25, 26]);
        this.wallRow(30, 35, 9, [32, 33]);
        // conference room (door on its right wall)
        this.wallRow(4, 13, 13);
        this.wallRow(4, 13, 20);
        this.wallCol(13, 13, 20, [16, 17]);
        // lounge (door on its left wall)
        this.wallRow(26, 35, 13);
        this.wallRow(26, 35, 20);
        this.wallCol(26, 13, 20, [16, 17]);

        // --- soft area rugs (painted, sit above floors, below furniture) ---
        const rug = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
            const g = this.add.graphics();
            g.fillStyle(color, alpha);
            g.fillRoundedRect(x * TILE, y * TILE, w * TILE, h * TILE, 10);
            g.setDepth(-996);
        };
        rug(14, 14, 12, 6, 0x51608a, 0.14); // coworking area
        rug(28, 17, 6, 3, 0xb08968, 0.28);  // lounge
        rug(18, 22, 4, 4, 0x8a5a44, 0.25);  // entrance runner

        // --- zone labels (Gather-style, painted on the floor) ---
        const label = (x: number, y: number, text: string) => {
            this.add.text(x * TILE, y * TILE, text, {
                fontFamily: "sans-serif",
                fontSize: "10px",
                fontStyle: "bold",
                color: "#3f4654",
            }).setAlpha(0.7).setDepth(-990).setResolution(3);
        };
        label(4.3, 3.25, "OFFICE 1");
        label(11.3, 3.25, "OFFICE 2");
        label(23.3, 3.25, "OFFICE 3");
        label(30.3, 3.25, "OFFICE 4");
        label(4.3, 14.2, "CONFERENCE");
        label(17.6, 13.25, "COWORKING");
        label(27.3, 14.2, "LOUNGE");
        label(4.3, 21.2, "CAFE");
        label(19.2, 21.2, "LOBBY");

        // ============================================================
        // 3. OUTDOOR DECOR — trees ring the map, flowers soften it
        // ============================================================
        const treeKeys = ["tree-green", "tree-lime", "tree-teal", "tree-teal2"];
        const tree = (tx: number, ty: number, k: number) => {
            this.add.image(tx * TILE, (ty + 1) * TILE, treeKeys[k % 4]!)
                .setOrigin(0, 1)
                .setDepth((ty + 1) * TILE);
            this.blocked.add(tx + "," + ty);
            this.blocked.add((tx + 1) + "," + ty);
        };
        // top edge
        [0, 3, 6, 9, 12, 15, 19, 23, 26, 29, 32, 35, 38].forEach((x, i) => tree(x, 1, i));
        // left + right edges
        [4, 8, 12, 16, 20, 24].forEach((y, i) => { tree(0, y, i + 1); tree(38, y, i); });
        // bottom edge (keep the path clear)
        [1, 5, 9, 13, 23, 27, 31, 35].forEach((x, i) => tree(x, 29, i + 2));

        // small decor: bushes + rocks block, flowers are walk-over
        const decor = (key: string, tx: number, ty: number, block: boolean) => {
            this.add.image((tx + 0.5) * TILE, (ty + 1) * TILE, key)
                .setOrigin(0.5, 1)
                .setDepth(block ? (ty + 1) * TILE : ty * TILE);
            if (block) this.blocked.add(tx + "," + ty);
        };
        decor("bush-small", 2, 27, true);
        decor("bush-small", 37, 27, true);
        decor("bush-ball", 2, 4, true);
        decor("bush-ball", 37, 12, true);
        decor("rock-small", 1, 27, true);
        decor("rock-med", 38, 27, true);
        decor("flower-red", 17, 27, false);
        decor("flower-blue", 22, 27, false);
        decor("flower-yellow", 5, 27, false);
        decor("flower-red", 33, 28, false);
        decor("flower-blue", 2, 13, false);
        decor("flower-yellow", 37, 20, false);
        decor("flower-blue", 12, 27, false);
        decor("flower-red", 27, 28, false);

        // ============================================================
        // 4. FURNITURE
        // ============================================================
        const placeItem = (key: string, fx: number, fy: number, opts?: {
            blockedOffsets?: [number, number][],
            chairOffsets?: { dx: number; dy: number; dir: "up" | "down" | "left" | "right" }[]
        }) => {
            const piece = this.add.image(fx * TILE, fy * TILE, key).setOrigin(0, 0);
            piece.setDepth(piece.y + piece.displayHeight);

            if (opts?.blockedOffsets) {
                opts.blockedOffsets.forEach(([dx, dy]) => {
                    this.blocked.add((fx + dx) + "," + (fy + dy));
                });
            } else {
                this.blockFootprint(fx, fy, piece.displayWidth, piece.displayHeight);
            }

            if (opts?.chairOffsets) {
                opts.chairOffsets.forEach(({ dx, dy, dir }) => {
                    this.chairMap[(fx + dx) + "," + (fy + dy)] = dir;
                });
            }
        };

        // a sittable chair: draws the sprite and registers the tile in chairMap.
        // the tile stays walkable — walking onto it means "sit down".
        const chair = (key: string, tx: number, ty: number, dir: "up" | "down" | "left" | "right") => {
            this.add.image((tx + 0.5) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(ty * TILE - 2);
            this.chairMap[tx + "," + ty] = dir;
        };

        // one plant pot, blocking its tile
        const pot = (key: string, tx: number, ty: number) =>
            placeItem(key, tx, ty, { blockedOffsets: [[0, 0]] });

        // Workstation (piece_6, 3x4 tiles): desk row on top, whiteboard/cabinet rows
        // below, and the chair pocket at (+1,+1) left walkable for sitting.
        const deskOpts = {
            blockedOffsets: [
                [0, 0], [1, 0], [2, 0],
                [0, 2], [1, 2], [2, 2],
                [0, 3], [1, 3], [2, 3],
            ] as [number, number][],
            chairOffsets: [{ dx: 1, dy: 1, dir: "up" as const }]
        };

        // --- 4 offices along the top: workstation + bookshelf + plant ---
        for (const ox of [4, 11, 23, 30]) {
            placeItem("furn6", ox, 3, deskOpts);
            placeItem("shelf-single", ox + 4, 3);
            pot("pot-1", ox + 5, 8);
        }
        // window over each office + wall art in the reception nook
        for (const ox of [4, 11, 23, 30]) {
            this.add.image((ox + 3) * TILE, 2 * TILE + 12, "furn22").setDepth(2 * TILE + 40);
        }
        this.add.image(20 * TILE, 2 * TILE + 16, "furn17").setDepth(2 * TILE + 40);

        // --- reception nook between the offices ---
        pot("pot-2", 18, 3);
        pot("pot-1", 21, 3);
        chair("seat-bl", 19, 4, "down");
        chair("seat-bl", 20, 4, "down");
        placeItem("lamp-warm", 18, 7, { blockedOffsets: [[0, 0]] });
        placeItem("lamp-blue", 21, 7, { blockedOffsets: [[0, 0]] });

        // --- corridor decor ---
        placeItem("furn19", 4, 10, { blockedOffsets: [[0, 0], [1, 0], [2, 0]] });
        pot("pot-2", 35, 10);

        // --- conference room ---
        placeItem("table-big", 7, 15);
        chair("chair-wood", 7, 14, "down");
        chair("chair-wood", 8, 14, "down");
        chair("chair-wood", 7, 17, "up");
        chair("chair-wood", 8, 17, "up");
        chair("chair-wood", 6, 15, "right");
        chair("chair-wood", 6, 16, "right");
        chair("chair-wood", 9, 15, "left");
        chair("chair-wood", 9, 16, "left");
        // whiteboard mounted on the top wall
        this.add.image(5.5 * TILE, 13 * TILE + 24, "furn12").setDepth(13 * TILE + 40);
        pot("pot-1", 4, 14);
        pot("pot-2", 4, 19);
        placeItem("lamp-warm", 12, 14, { blockedOffsets: [[0, 0]] });

        // --- coworking area (open, center) ---
        placeItem("furn6", 15, 14, deskOpts);
        placeItem("furn6", 19, 14, deskOpts);
        // collab table on the right
        placeItem("table-big", 23, 15);
        chair("chair-wood2", 23, 14, "down");
        chair("chair-wood2", 24, 14, "down");
        chair("chair-wood2", 23, 17, "up");
        chair("chair-wood2", 24, 17, "up");
        chair("chair-wood2", 22, 15, "right");
        chair("chair-wood2", 22, 16, "right");
        // planter dividers (leave the entrance axis open)
        placeItem("furn19", 15, 19, { blockedOffsets: [[0, 0], [1, 0], [2, 0]] });
        placeItem("furn19", 22, 19, { blockedOffsets: [[0, 0], [1, 0], [2, 0]] });

        // --- lounge ---
        placeItem("furn8", 29, 14, { blockedOffsets: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]] });
        // sectional: three armchairs in a row around a coffee table
        chair("seat-bl", 29, 17, "down");
        chair("seat-bl", 30, 17, "down");
        chair("seat-bl", 31, 17, "down");
        placeItem("table-small", 30, 18);
        chair("seat-bl", 34, 17, "down");
        pot("pot-1", 27, 19);
        placeItem("lamp-warm", 27, 14, { blockedOffsets: [[0, 0]] });
        placeItem("lamp-blue", 35, 19, { blockedOffsets: [[0, 0]] });
        pot("pot-2", 35, 14);

        // --- café (open, bottom-left) ---
        placeItem("furn9", 5, 21);                                              // kitchen counter
        placeItem("furn20", 10, 21, { blockedOffsets: [[0, 0], [1, 0], [0, 1], [1, 1]] }); // fridge
        placeItem("furn23", 12, 21, { blockedOffsets: [[0, 0], [1, 0], [0, 1], [1, 1]] }); // vending machine
        placeItem("table-big", 7, 23);
        chair("chair-wood", 7, 25, "up");
        chair("chair-wood", 8, 25, "up");
        chair("chair-wood", 6, 23, "right");
        chair("chair-wood", 6, 24, "right");
        chair("chair-wood", 9, 23, "left");
        chair("chair-wood", 9, 24, "left");
        pot("pot-2", 4, 25);

        // --- lobby (bottom-center, by the entrance) ---
        chair("seat-bl", 15, 22, "down");
        chair("seat-bl", 16, 22, "down");
        chair("seat-bl", 17, 22, "down");
        chair("seat-bl", 23, 22, "down");
        chair("seat-bl", 24, 22, "down");
        pot("pot-1", 25, 22);
        placeItem("furn19", 15, 25, { blockedOffsets: [[0, 0], [1, 0], [2, 0]] });
        placeItem("furn19", 22, 25, { blockedOffsets: [[0, 0], [1, 0], [2, 0]] });

        // --- quiet corner (bottom-right) ---
        placeItem("furn8", 26, 21);
        placeItem("table-big", 31, 22);
        chair("chair-wood2", 31, 21, "down");
        chair("chair-wood2", 32, 21, "down");
        chair("chair-wood2", 31, 24, "up");
        chair("chair-wood2", 32, 24, "up");
        chair("chair-wood2", 30, 22, "right");
        chair("chair-wood2", 30, 23, "right");
        chair("chair-wood2", 33, 22, "left");
        chair("chair-wood2", 33, 23, "left");
        placeItem("lamp-blue", 35, 21, { blockedOffsets: [[0, 0]] });
        pot("pot-1", 35, 25);

        // ============================================================
        // 5. PLAYER, INPUT, CAMERA
        // ============================================================
        this.maxTileX = COLS - 1;
        this.maxTileY = ROWS - 1;

        const px = this.tileX * TILE + TILE / 2;
        const py = this.tileY * TILE + TILE / 2;

        this.player = this.add.sprite(px, py, "adam", 0);
        this.player.setScale(2);

        this.playerShadow = this.add.ellipse(px, py + 26, 26, 10, 0x000000, 0.25);

        this.nameTag = this.makeNameTag("You", true, false);
        this.nameTag.setPosition(px, py - 34);

        this.anims.create({key:"walk-down" , frames:this.anims.generateFrameNumbers("adam" ,{
            start:18,
            end:23
        }),
        frameRate:10,
        repeat:-1
        })

        this.anims.create({ key: "walk-up",
            frames: this.anims.generateFrameNumbers("adam",
                { start: 6,  end: 11
        }), frameRate: 10, repeat: -1 });

        this.anims.create({ key: "walk-left",  frames:
        this.anims.generateFrameNumbers("adam", { start: 12, end: 17
        }), frameRate: 10, repeat: -1 });

        this.anims.create({ key: "walk-right", frames:
        this.anims.generateFrameNumbers("adam", { start: 0, end: 5
        }), frameRate: 10, repeat: -1 });

        this.input.keyboard?.on("keydown-LEFT", () => this.move(-1,
        0));
        this.input.keyboard?.on("keydown-RIGHT", () => this.move(1,
        0));
        this.input.keyboard?.on("keydown-UP", () => this.move(0,
        -1));
        this.input.keyboard?.on("keydown-DOWN", () => this.move(0,
        1));


        // click / tap a tile to walk there. We only remember WHERE you want to go (the target);
        // stepTowardTarget() then walks one tile at a time, because the server only accepts one-tile moves.
        this.input.on("pointerdown",(pointer:Phaser.Input.Pointer)=>{
            const tx = Math.floor(pointer.worldX/TILE);
            const ty = Math.floor(pointer.worldY /TILE)
            this.targetX = Phaser.Math.Clamp(tx, 0, this.maxTileX);
            this.targetY = Phaser.Math.Clamp(ty, 0, this.maxTileY);
            if (!this.isMoving) this.stepTowardTarget();
        })
        this.otherRef = this.registry.get("othersRef");
        this.moveRef = this.registry.get("moveRef");
        this.namesRef = this.registry.get("namesRef");
        this.nearbyRef = this.registry.get("nearbyRef");


        this.cameras.main.setBounds(0,0,worldWidth,worldHeight);
        this.cameras.main.startFollow(this.player , true ,0.1 , 0.1);

        this.cameras.main.setZoom(2);

    }

    // Phaser runs update() every frame — we use it to draw other players and keep the name tags in place
    update() {
        // --- keep MY shadow, pill, and draw-order in sync every frame ---
        const currentTileKey = this.tileX + "," + this.tileY;
        const chairDir = this.chairMap[currentTileKey];
        const isSelfSitting = !!chairDir && !this.isMoving;

        if (isSelfSitting && chairDir) {
            let offsetX = 0;
            let offsetY = -12;
            if (chairDir === "down") offsetY = 12;
            if (chairDir === "left") offsetX = -12;
            if (chairDir === "right") offsetX = 12;

            this.player.setPosition(
                this.tileX * TILE + TILE / 2 + offsetX,
                this.tileY * TILE + TILE / 2 + offsetY
            );
            this.player.setScale(1.6);
            this.player.setFrame(this.standingFrame(chairDir));
            if (this.player.anims.isPlaying) {
                this.player.anims.stop();
            }
        } else {
            this.player.setScale(2.0);
            if (!this.isMoving) {
                this.player.setPosition(
                    this.tileX * TILE + TILE / 2,
                    this.tileY * TILE + TILE / 2
                );
            }
        }

        const myFeet = this.player.y + this.player.displayHeight / 2;
        if (isSelfSitting && chairDir === "up") {
            // Draw behind the desk (desk bottom edge is at tileY * TILE)
            this.player.setDepth(this.tileY * TILE - 1);
        } else {
            this.player.setDepth(myFeet);
        }

        // shadow sits at my feet and just under me in draw order
        this.playerShadow.setPosition(this.player.x, this.player.y + this.player.displayHeight / 2 - 6);
        this.playerShadow.setDepth(this.player.depth - 2);

        // Keep my name pill updated and glued just above me
        const selfShownName = "You" + (isSelfSitting ? " (sitting)" : "");
        if (this.selfTagName !== selfShownName) {
            this.nameTag?.destroy();
            this.nameTag = this.makeNameTag(selfShownName, true, isSelfSitting);
            this.selfTagName = selfShownName;
        }
        this.nameTag.setPosition(this.player.x, this.player.y - 34);

        // the newest list of everyone else (userId -> {x, y}), coming from the React hook
        const others = this.otherRef?.current ?? {};

        for (const id in others) {
            const p = others[id];
            if (!p) continue;
            const px = p.x * TILE + TILE / 2;
            const py = p.y * TILE + TILE / 2;

            let sprite = this.otherSprites[id];
            if (!sprite) {
                // first time we see this player — create their sprite, shadow, name pill, and remember their tile
                sprite = this.add.sprite(px, py, "adam", 18).setScale(2);
                this.otherSprites[id] = sprite;
                this.otherTiles[id] = { x: p.x, y: p.y };
                this.otherShadows[id] = this.add.ellipse(px, py, 26, 10, 0x000000, 0.25);
                // use the real username if we have it yet, otherwise a short id as a placeholder
                const startName = this.namesRef?.current?.[id] ?? id.slice(0, 5);
                this.otherTags[id] = this.makeNameTag(startName, false, false);
                this.otherTagNames[id] = startName;
            } else {
                const last = this.otherTiles[id];
                if (last && (last.x !== p.x || last.y !== p.y)) {
                    // this player moved to a new tile since the last frame.
                    // work out which way they moved so we can face them the right way
                    const dx = p.x - last.x;
                    const dy = p.y - last.y;
                    const dir =
                        Math.abs(dx) > Math.abs(dy)
                            ? (dx < 0 ? "left" : "right")
                            : (dy < 0 ? "up" : "down");
                    // play their walk animation, cancel any leftover glide, then slide them over 200ms.
                    // capture the sprite in a const so the onComplete callback keeps its (defined) type.
                    const movingSprite = sprite;
                    movingSprite.anims.play("walk-" + dir, true);
                    this.tweens.killTweensOf(movingSprite);
                    this.tweens.add({
                        targets: movingSprite,
                        x: px,
                        y: py,
                        duration: 200,
                        ease: "Linear",
                        onComplete: () => {
                            movingSprite.anims.stop();
                            movingSprite.setFrame(this.standingFrame(dir));
                        },
                    });
                    this.otherTiles[id] = { x: p.x, y: p.y };
                }
            }

            // sort this player by their feet (same idea as mine), and glue their shadow + pill
            if (!sprite) continue; // safety: sprite exists by now (created above if it was missing)

            const otherTileKey = p.x + "," + p.y;
            const otherChairDir = this.chairMap[otherTileKey];
            const isOtherMoving = this.tweens.isTweening(sprite);
            const isOtherSitting = !!otherChairDir && !isOtherMoving;

            if (isOtherSitting && otherChairDir) {
                let offsetX = 0;
                let offsetY = -12;
                if (otherChairDir === "down") offsetY = 12;
                if (otherChairDir === "left") offsetX = -12;
                if (otherChairDir === "right") offsetX = 12;

                sprite.setPosition(px + offsetX, py + offsetY);
                sprite.setScale(1.6);
                sprite.setFrame(this.standingFrame(otherChairDir));
                if (sprite.anims.isPlaying) {
                    sprite.anims.stop();
                }
            } else {
                sprite.setScale(2.0);
                if (!isOtherMoving) {
                    sprite.setPosition(px, py);
                }
            }

            const feet = sprite.y + sprite.displayHeight / 2;
            if (isOtherSitting && otherChairDir === "up") {
                sprite.setDepth(p.y * TILE - 1);
            } else {
                sprite.setDepth(feet);
            }

            const shadow = this.otherShadows[id];
            if (shadow) {
                shadow.setPosition(sprite.x, sprite.y + sprite.displayHeight / 2 - 6);
                shadow.setDepth(sprite.depth - 2);
            }

            // fade avatars that are far away; keep nearby ones bright (Gather-style).
            // default to visible when we have no proximity data (e.g. the /phaser sandbox).
            const near = this.nearbyRef?.current?.has(id) ?? true;
            sprite.setAlpha(near ? 1 : 0.35);
            shadow?.setAlpha(near ? 0.25 : 0.1);

            // if the real username has loaded (or changed) since we built the pill, rebuild it
            const realName = this.namesRef?.current?.[id];
            const baseName = realName || id.slice(0, 5);
            const shownName = baseName + (isOtherSitting ? " (sitting)" : "");

            if (this.otherTagNames[id] !== shownName) {
                this.otherTags[id]?.destroy();
                this.otherTags[id] = this.makeNameTag(shownName, false, isOtherSitting);
                this.otherTagNames[id] = shownName;
            }
            const tag = this.otherTags[id];
            if (tag) {
                tag.setPosition(sprite.x, sprite.y - 34);
                tag.setAlpha(near ? 1 : 0.5);
            }
        }

        // someone left the room — remove their sprite, tag, and remembered tile
        for (const id in this.otherSprites) {
            if (!others[id]) {
                this.otherSprites[id]?.destroy();
                this.otherTags[id]?.destroy();
                this.otherShadows[id]?.destroy();
                delete this.otherSprites[id];
                delete this.otherTags[id];
                delete this.otherTagNames[id];
                delete this.otherShadows[id];
                delete this.otherTiles[id];
            }
        }
    }

    private move(dx:number , dy:number){

        const dir = dx<0 ?"left" :dx>0 ?"right" :dy<0 ?"up":"down";
        this.moveToTile(this.tileX + dx , this.tileY + dy,dir);

    }

    private moveTo(tx:number , ty:number){
        const dx = tx - this.tileX;
        const dy = ty - this.tileY;
        const dir =
        Math.abs(dx) > Math.abs(dy)
            ? (dx < 0 ? "left" : "right")
            : (dy < 0 ? "up" : "down");
        this.moveToTile(tx, ty, dir);

    }
    private moveToTile(tx: number, ty: number, dir: "down" | "up" | "left" |"right") {
        if (this.isMoving) return; // already gliding — ignore

        const nextX = Phaser.Math.Clamp(tx, 0, this.maxTileX);
        const nextY = Phaser.Math.Clamp(ty, 0, this.maxTileY);
        if (nextX === this.tileX && nextY === this.tileY) return;
         // no real move

        // collision: if the next tile is a wall, refuse the move and drop any click target
        if (this.blocked.has(nextX + "," + nextY)) {
            this.targetX = null;
            this.targetY = null;
            return;
        }

        this.tileX = nextX;
        this.tileY = nextY;
        this.facing = dir;
        this.isMoving = true;
        // tell the server my new tile so everyone else sees me here
        this.moveRef?.current?.({ x: this.tileX, y: this.tileY });


        this.player.anims.play("walk-" + dir, true);

        this.tweens.add({
        targets: this.player,
        x: this.tileX * TILE + TILE / 2,
        y: this.tileY * TILE + TILE / 2,
        duration: 200,
        ease: "Linear",
        onComplete: () => {
            this.isMoving = false;
            // if a click told us to keep walking and we're not there yet, take the next step
            if (this.targetX !== null && (this.tileX !== this.targetX || this.tileY !== this.targetY)) {
                this.stepTowardTarget();
            } else {
                // arrived (or it was a single keyboard step) — stop and stand still, facing the last way
                this.targetX = null;
                this.targetY = null;
                this.player.anims.stop();
                this.player.setFrame(this.standingFrame(dir));
            }
        },
        });
    }

    // take ONE step toward the clicked target tile (sideways first, then up/down).
    // Each call moves a single tile, which is what the server allows.
    private stepTowardTarget() {
        if (this.targetX === null || this.targetY === null) return;
        let dx = 0;
        let dy = 0;
        if (this.targetX !== this.tileX) dx = this.targetX > this.tileX ? 1 : -1;
        else if (this.targetY !== this.tileY) dy = this.targetY > this.tileY ? 1 : -1;
        if (dx === 0 && dy === 0) {
            // already on the target tile — clear it
            this.targetX = null;
            this.targetY = null;
            return;
        }
        this.move(dx, dy);
    }

    // block every tile a furniture piece covers, so avatars can't walk through it.
    // widthPx/heightPx come from the sprite's real size; we round to whole tiles.
    private blockFootprint(tx: number, ty: number, widthPx: number, heightPx: number) {
        const cols = Math.max(1, Math.round(widthPx / TILE));
        const rows = Math.max(1, Math.round(heightPx / TILE));
        for (let x = tx; x < tx + cols; x++) {
            for (let y = ty; y < ty + rows; y++) {
                this.blocked.add(x + "," + y);
            }
        }
    }

    // a horizontal run of wall tiles from x1..x2 at row y (skip = doorway tiles).
    // every wall tile blocks movement and casts a soft shadow on the row below.
    private wallRow(x1: number, x2: number, y: number, skip: number[] = []) {
        for (let x = x1; x <= x2; x++) {
            if (skip.includes(x)) continue;
            this.add.image(x * TILE, y * TILE, "wall").setOrigin(0, 0).setDepth(y * TILE + TILE);
            this.add.rectangle(x * TILE, (y + 1) * TILE, TILE, 5, 0x000000, 0.10)
                .setOrigin(0, 0).setDepth(-994);
            this.blocked.add(x + "," + y);
        }
    }

    // a vertical run of wall tiles from y1..y2 at column x (skip = doorway tiles)
    private wallCol(x: number, y1: number, y2: number, skip: number[] = []) {
        for (let y = y1; y <= y2; y++) {
            if (skip.includes(y)) continue;
            this.add.image(x * TILE, y * TILE, "wall").setOrigin(0, 0).setDepth(y * TILE + TILE);
            this.blocked.add(x + "," + y);
        }
    }

    // paint all the tileable textures (grass, floors, walls, path) in code so the
    // palette stays calm and consistent — no external floor images needed.
    private makeTextures() {
        const g = this.add.graphics();

        // simple deterministic pseudo-random for speckles, so the texture is stable
        let seed = 7;
        const rand = () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
        };

        // grass — soft green with light/dark speckles
        g.clear();
        g.fillStyle(0x7cc25e); g.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 90; i++) {
            const c = [0x74b850, 0x8ccf6b, 0x6fae4c][i % 3]!;
            g.fillStyle(c, 1);
            g.fillRect(Math.floor(rand() * 62), Math.floor(rand() * 62), 2, 2);
        }
        g.generateTexture("grass", 64, 64);

        // stone path
        g.clear();
        g.fillStyle(0xcdc7b9); g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xbbb4a4); g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32);
        for (let i = 0; i < 6; i++) {
            g.fillStyle(0xc2bcae, 1);
            g.fillRect(Math.floor(rand() * 30), Math.floor(rand() * 30), 2, 2);
        }
        g.generateTexture("path", 32, 32);

        // warm wood floor — light planks with staggered joints
        g.clear();
        g.fillStyle(0xe9dcc0); g.fillRect(0, 0, 64, 64);
        g.fillStyle(0xe4d5b4); g.fillRect(0, 16, 64, 16); g.fillRect(0, 48, 64, 16);
        g.fillStyle(0xd9c9a5);
        for (const y of [15, 31, 47, 63]) g.fillRect(0, y, 64, 1);
        g.fillRect(31, 0, 1, 16); g.fillRect(15, 16, 1, 16);
        g.fillRect(47, 16, 1, 16); g.fillRect(31, 32, 1, 16);
        g.fillRect(15, 48, 1, 16); g.fillRect(47, 48, 1, 16);
        g.generateTexture("floor-wood", 64, 64);

        // office carpet — soft periwinkle checker
        const checker = (key: string, a: number, b: number, cell: number) => {
            g.clear();
            g.fillStyle(a); g.fillRect(0, 0, 64, 64);
            g.fillStyle(b);
            for (let cx = 0; cx < 64 / cell; cx++)
                for (let cy = 0; cy < 64 / cell; cy++)
                    if ((cx + cy) % 2 === 0) g.fillRect(cx * cell, cy * cell, cell, cell);
            g.generateTexture(key, 64, 64);
        };
        checker("floor-office", 0xb9c1de, 0xb3bbda, 16);
        checker("floor-conf", 0xc6dacd, 0xbfd4c6, 16);
        checker("floor-lounge", 0xdecdb0, 0xd8c6a6, 16);
        checker("floor-cafe", 0xeae6db, 0xdfd8c8, 16);

        // wall tile — dark cap on top, lighter face below (fake 2.5D)
        g.clear();
        g.fillStyle(0x5a6170); g.fillRect(0, 0, 32, 14);
        g.fillStyle(0x6b7382); g.fillRect(0, 0, 32, 2);
        g.fillStyle(0xa6aebc); g.fillRect(0, 14, 32, 18);
        g.fillStyle(0x8f97a6); g.fillRect(0, 29, 32, 3);
        g.generateTexture("wall", 32, 32);

        g.destroy();
    }

    // build a Gather-style name pill: rounded background + status dot + name text.
    // isSelf = true gives it the purple "this is you" colour; others get dark grey.
    // isSitting = true changes the status dot color from green to amber.
    private makeNameTag(label: string, isSelf: boolean, isSitting: boolean = false) {
        // the name text. setOrigin(0, 0.5) = left-middle, so it starts right after the dot
        const text = this.add.text(0, 0, label, {
            fontFamily: "sans-serif",
            fontSize: "12px",
            color: "#ffffff",
        }).setOrigin(0, 0.5);

        // layout numbers (pixels)
        const padX = 8;    // space on the left/right inside the pill
        const dotR = 4;    // radius of the green online dot
        const gap = 6;     // space between the dot and the text
        const pillH = 20;  // pill height
        const pillW = padX + dotR * 2 + gap + text.width + padX; // grows with the name

        // place the dot and text, measured from the LEFT edge of the pill
        const left = -pillW / 2;
        const dotX = left + padX + dotR;
        text.setX(dotX + dotR + gap);

        // rounded background pill — purple/indigo for you, dark grey/slate for others
        const bg = this.add.graphics();
        const bgColor = isSelf
            ? (isSitting ? 0x4834d4 : 0x6c5ce7)
            : (isSitting ? 0x1e272e : 0x2b2b3c);
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);

        // the status dot: green for online, amber for sitting
        const dot = this.add.graphics();
        dot.fillStyle(isSitting ? 0xf59e0b : 0x22c55e, 1);
        dot.fillCircle(dotX, 0, dotR);

        // group them so we move the whole pill by moving ONE object.
        // setDepth(10000) keeps the pill on top of everything.
        return this.add.container(0, 0, [bg, text, dot]).setDepth(10000);
    }

    private standingFrame(dir:"down"|"up"|"left" | "right"){
        if(dir === "up") return 6;
        if(dir === "left") return 12;
        if(dir === "right") return 0;
        return 18;
    }
}
