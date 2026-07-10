import Phaser from "phaser";

const TILE = 32; // pixels per tile: every grid cell is 32x32 screen pixels

const COLS = 44;
const ROWS = 34;
export class ArenaScene extends Phaser.Scene{
    // spawn on the stone path just outside the office entrance
    private tileX = 21;
    private tileY = 31;

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
    // recent emoji reactions to float above avatars, + ids we've already shown
    private reactionsRef?: {current:{id:string;userId:string;emoji:string;at:number}[]}
    private shownReactions = new Set<string>();
    // avatar character keys: userId -> "adam"|"alex"|"bob"|"amelia" for other players; self tracked separately
    private avatarsRef?: {current:Record<string,string>}
    private selfCharRef?: {current:string}
    private selfChar = "adam";
    private otherChars: Record<string,string> = {};
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
        // extra characters (same 384x32 layout as adam, so identical walk frames)
        this.load.spritesheet("alex", "/assets/alex-run.png", { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet("bob", "/assets/bob-run.png", { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet("amelia", "/assets/amelia-run.png", { frameWidth: 16, frameHeight: 32 });
        // The seated sheets use a different layout from the walking strip: the side poses
        // are 32px wide, while the front-facing desk pose remains 16px wide.
        this.load.spritesheet("adam-sit-side", "/Modern tiles_Free/Characters_free/Adam_sit2_16x16.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet("adam-sit-front", "/Modern tiles_Free/Characters_free/Adam_sit3_16x16.png", {
            frameWidth: 16,
            frameHeight: 32,
        });
        // The original 24-frame sit sheet is the only one with a back view — used for
        // "up" seats (desks), where the avatar faces away from the camera.
        this.load.spritesheet("adam-sit", "/Modern tiles_Free/Characters_free/Adam_sit_16x16.png", {
            frameWidth: 16,
            frameHeight: 32,
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
        // Custom generated pixel assets (tools/pixel-gen) — the Gather-style furniture set.
        this.load.image("lounge-chair", "/assets/custom/lounge-chair-sprite.png");
        for (const n of [
            "desk-monitor", "office-chair", "office-chair-red", "cabinet",
            "whiteboard", "water-cooler", "conf-table", "tv-wall",
            "sofa-red-wide", "sofa-blue-wide", "coffee-round", "coffee-rect",
            "beanbag", "bookshelf-big", "plant-tall", "plant-fern",
            "ping-pong", "foosball", "arcade",
        ]) {
            this.load.image(n, "/assets/custom/" + n + ".png");
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
        // 1. OUTDOORS — grass everywhere, a stone path to the door, a pond
        // ============================================================
        this.add.tileSprite(0, 0, worldWidth, worldHeight, "grass").setOrigin(0, 0).setDepth(-1010);
        this.add.tileSprite(20 * TILE, 30 * TILE, 4 * TILE, 4 * TILE, "path").setOrigin(0, 0).setDepth(-1005);

        // pond beside the entrance path (Gather's outdoor water feature)
        const pondG = this.add.graphics();
        pondG.fillStyle(0x5b8fb5, 1);
        pondG.fillEllipse(29 * TILE, 31.5 * TILE, 122, 78);
        pondG.fillStyle(0x7db8d8, 1);
        pondG.fillEllipse(29 * TILE, 31.5 * TILE, 100, 58);
        pondG.fillStyle(0xa8d4e8, 0.8);
        pondG.fillEllipse(28.3 * TILE, 31.1 * TILE, 30, 12);
        pondG.setDepth(-1004);
        for (let x = 27; x <= 30; x++) {
            for (let y = 30; y <= 32; y++) this.blocked.add(x + "," + y);
        }

        // ============================================================
        // 2. THE BUILDING — one connected office, x3..40 / y2..29
        // Perimeter = private offices (3 left, 3 right, 2 top + cafe alcove).
        // Centre hub = walled meeting room, open lounge, coworking pods,
        // game corner (bottom-right) and kitchen (bottom-left).
        // ============================================================
        // wood floor under the whole building
        this.add.tileSprite(3 * TILE, 2 * TILE, 38 * TILE, 28 * TILE, "floor-wood").setOrigin(0, 0).setDepth(-1000);

        const zone = (x: number, y: number, w: number, h: number, key: string) =>
            this.add.tileSprite(x * TILE, y * TILE, w * TILE, h * TILE, key).setOrigin(0, 0).setDepth(-998);

        // private offices — left column, right column, top row
        zone(4, 3, 6, 6, "floor-office");
        zone(4, 10, 6, 6, "floor-office");
        zone(4, 17, 6, 6, "floor-office");
        zone(34, 3, 6, 6, "floor-office");
        zone(34, 10, 6, 6, "floor-office");
        zone(34, 17, 6, 6, "floor-office");
        zone(12, 3, 7, 6, "floor-office");
        zone(24, 3, 7, 6, "floor-office");
        zone(20, 3, 3, 6, "floor-cafe");     // cafe alcove between the top offices
        // central hub
        zone(13, 12, 7, 7, "floor-conf");    // meeting room
        zone(22, 11, 10, 8, "floor-lounge"); // lounge
        zone(12, 21, 10, 6, "floor-cafe");   // coworking pods
        zone(34, 24, 6, 5, "floor-office");  // game corner
        zone(4, 24, 6, 5, "floor-cafe");     // kitchen

        // --- walls ---
        this.wallRow(3, 40, 2);                          // building top
        this.wallRow(3, 40, 29, [20, 21, 22, 23]);       // building bottom, entrance gap
        this.wallCol(3, 2, 29);                          // building left
        this.wallCol(40, 2, 29);                         // building right
        // left office column: shared front wall + room dividers (2-tile doors)
        this.wallCol(10, 3, 23, [5, 6, 12, 13, 19, 20]);
        this.wallRow(4, 9, 9);
        this.wallRow(4, 9, 16);
        this.wallRow(4, 9, 23);
        // right office column (mirrored)
        this.wallCol(33, 3, 23, [5, 6, 12, 13, 19, 20]);
        this.wallRow(34, 39, 9);
        this.wallRow(34, 39, 16);
        this.wallRow(34, 39, 23);
        // top offices flanking the cafe alcove
        this.wallCol(11, 3, 8);
        this.wallCol(19, 3, 8);
        this.wallRow(11, 19, 9, [14, 15]);
        this.wallCol(23, 3, 8);
        this.wallCol(31, 3, 8);
        this.wallRow(23, 31, 9, [26, 27]);
        // meeting room (doors on the east wall and the south wall)
        this.wallRow(12, 20, 11);
        this.wallCol(12, 12, 19);
        this.wallCol(20, 12, 18, [14, 15]);
        this.wallRow(12, 20, 19, [16, 17]);

        // --- soft area rugs (painted, sit above floors, below furniture) ---
        const rug = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
            const g = this.add.graphics();
            g.fillStyle(color, alpha);
            g.fillRoundedRect(x * TILE, y * TILE, w * TILE, h * TILE, 10);
            g.setDepth(-996);
        };
        rug(13, 12, 7, 7, 0x5f7d6d, 0.12);  // meeting room
        rug(22, 11, 10, 8, 0xa06f53, 0.18); // lounge
        rug(12, 21, 10, 6, 0x59726a, 0.16); // coworking
        rug(34, 24, 6, 5, 0x53667e, 0.14);  // game corner

        // --- zone labels (Gather-style, painted on the floor) ---
        const label = (x: number, y: number, text: string) => {
            this.add.text(x * TILE, y * TILE, text, {
                fontFamily: "sans-serif",
                fontSize: "10px",
                fontStyle: "bold",
                color: "#3f4654",
            }).setAlpha(0.7).setDepth(-990).setResolution(3);
        };
        label(12.3, 8.15, "PRIVATE OFFICE 1");
        label(24.3, 8.15, "PRIVATE OFFICE 2");
        label(4.3, 8.15, "PRIVATE OFFICE 3");
        label(4.3, 15.15, "PRIVATE OFFICE 4");
        label(4.3, 22.15, "PRIVATE OFFICE 5");
        label(34.3, 8.15, "PRIVATE OFFICE 6");
        label(34.3, 15.15, "PRIVATE OFFICE 7");
        label(34.3, 22.15, "PRIVATE OFFICE 8");
        label(20.2, 8.15, "CAFE");
        label(13.3, 18.2, "MEETING ROOM");
        label(22.3, 11.15, "LOUNGE");
        label(12.3, 26.2, "COWORKING");
        label(34.3, 28.15, "GAMES");
        label(4.3, 28.15, "KITCHEN");
        label(20.4, 26.2, "LOBBY");

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
        [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42].forEach((x, i) => tree(x, 0, i));
        // left + right edges
        [3, 7, 11, 15, 19, 23, 27, 31].forEach((y, i) => { tree(0, y, i + 1); tree(42, y, i); });
        // bottom edge (keep the path and the pond clear)
        [1, 5, 9, 13, 16, 25, 33, 37, 40].forEach((x, i) => tree(x, 32, i + 2));

        // small decor: bushes + rocks block, flowers are walk-over
        const decor = (key: string, tx: number, ty: number, block: boolean) => {
            this.add.image((tx + 0.5) * TILE, (ty + 1) * TILE, key)
                .setOrigin(0.5, 1)
                .setDepth(block ? (ty + 1) * TILE : ty * TILE);
            if (block) this.blocked.add(tx + "," + ty);
        };
        decor("rock-small", 26, 30, true);
        decor("rock-med", 31, 31, true);
        decor("bush-small", 2, 30, true);
        decor("bush-small", 41, 30, true);
        decor("bush-ball", 2, 5, true);
        decor("bush-ball", 41, 13, true);
        decor("flower-red", 18, 30, false);
        decor("flower-blue", 24, 30, false);
        decor("flower-yellow", 6, 30, false);
        decor("flower-red", 35, 31, false);
        decor("flower-blue", 2, 14, false);
        decor("flower-yellow", 41, 21, false);
        decor("flower-blue", 13, 31, false);
        decor("flower-red", 32, 30, false);

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
            // an "up" chair has its back toward the camera, so it must draw OVER the
            // seated avatar; every other direction sits behind the avatar.
            this.add.image((tx + 0.5) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(dir === "up" ? (ty + 1) * TILE + 8 : ty * TILE - 2);
            this.chairMap[tx + "," + ty] = dir;
        };

        // one plant pot, blocking its tile
        const pot = (key: string, tx: number, ty: number) =>
            placeItem(key, tx, ty, { blockedOffsets: [[0, 0]] });

        // a multi-seat piece (sofa, armchair, beanbag): drawn like a chair (behind the
        // avatar) with one chairMap entry per seat tile. Seat tiles stay walkable.
        const bench = (key: string, tx: number, ty: number, seats: number, dir: "up" | "down" | "left" | "right") => {
            this.add.image((tx + seats / 2) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(dir === "up" ? (ty + 1) * TILE + 8 : ty * TILE - 2);
            for (let i = 0; i < seats; i++) this.chairMap[(tx + i) + "," + ty] = dir;
        };

        // something hung on a wall row (window, tv, whiteboard) — draws over the wall
        const wallMount = (key: string, cx: number, wy: number, scale = 1) =>
            this.add.image(cx * TILE, wy * TILE + 20, key).setScale(scale).setDepth(wy * TILE + 40);

        // a private-office workstation: generated desk + monitor with the task chair
        // pocket below it (avatar sits facing up, tucked under the desk).
        const workstation = (dx: number, dy: number) => {
            placeItem("desk-monitor", dx, dy);
            chair("office-chair", dx, dy + 2, "up");
        };

        // --- private offices: desk + monitor, task chair, plant ---
        // left column (offices 3-5)
        for (const oy of [3, 10, 17]) {
            workstation(6, oy);
            placeItem("cabinet", 4, oy);
            pot("plant-fern", 9, oy + 5);
        }
        // right column (offices 6-8)
        for (const oy of [3, 10, 17]) {
            workstation(36, oy);
            placeItem("cabinet", 38, oy);
            pot("plant-fern", 34, oy + 5);
        }
        // top row (offices 1-2)
        workstation(14, 3);
        placeItem("bookshelf-big", 17, 3);
        pot("plant-tall", 12, 7);
        workstation(27, 3);
        placeItem("bookshelf-big", 24, 3);
        pot("plant-tall", 30, 7);
        // windows on the exterior wall over the top offices
        wallMount("furn22", 15, 2, 0.6);
        wallMount("furn22", 27, 2, 0.6);

        // --- cafe alcove (top-centre) ---
        placeItem("furn9", 20, 3);                        // counter
        pot("coffee-round", 21, 6);
        placeItem("water-cooler", 22, 7, { blockedOffsets: [[0, 0]] });

        // --- meeting room: long conference table, 12 seats, wall TV ---
        placeItem("conf-table", 14, 14);
        chair("office-chair-red", 14, 13, "down");
        chair("office-chair-red", 15, 13, "down");
        chair("office-chair-red", 16, 13, "down");
        chair("office-chair-red", 17, 13, "down");
        chair("office-chair-red", 14, 16, "up");
        chair("office-chair-red", 15, 16, "up");
        chair("office-chair-red", 16, 16, "up");
        chair("office-chair-red", 17, 16, "up");
        chair("office-chair-red", 13, 14, "right");
        chair("office-chair-red", 13, 15, "right");
        chair("office-chair-red", 18, 14, "left");
        chair("office-chair-red", 18, 15, "left");
        wallMount("tv-wall", 16, 11);
        placeItem("cabinet", 13, 12);
        placeItem("water-cooler", 19, 12, { blockedOffsets: [[0, 0]] });
        pot("plant-fern", 19, 18);

        // --- lounge: sofas around coffee tables, books, beanbags ---
        placeItem("plant-tall", 22, 11, { blockedOffsets: [[0, 0]] });
        placeItem("bookshelf-big", 28, 11);
        placeItem("bookshelf-big", 30, 11);
        bench("sofa-red-wide", 23, 13, 3, "down");
        placeItem("coffee-rect", 23, 15);
        bench("sofa-blue-wide", 27, 14, 3, "down");
        pot("coffee-round", 28, 16);
        bench("beanbag", 22, 16, 1, "down");
        bench("beanbag", 26, 17, 1, "down");
        bench("lounge-chair", 31, 15, 1, "down");
        pot("plant-fern", 22, 18);
        placeItem("whiteboard", 25, 11, { blockedOffsets: [[0, 0], [1, 0]] });

        // --- coworking pods: four shared desks in two rows ---
        workstation(13, 21);
        workstation(17, 21);
        workstation(13, 24);
        workstation(17, 24);
        placeItem("water-cooler", 21, 21, { blockedOffsets: [[0, 0]] });
        pot("plant-fern", 21, 26);
        pot("plant-tall", 16, 21);

        // --- game corner (bottom-right) ---
        placeItem("ping-pong", 34, 24);
        placeItem("arcade", 39, 24);
        placeItem("foosball", 36, 27);
        pot("plant-fern", 34, 28);

        // --- kitchen (bottom-left) ---
        placeItem("furn9", 4, 24);                                              // counter
        placeItem("furn20", 8, 24, { blockedOffsets: [[0, 0], [1, 0], [0, 1], [1, 1]] }); // fridge
        placeItem("furn23", 4, 27, { blockedOffsets: [[0, 0], [1, 0], [0, 1], [1, 1]] }); // vending machine
        placeItem("table-big", 6, 26);
        chair("chair-wood", 5, 26, "right");
        chair("chair-wood", 5, 27, "right");
        chair("chair-wood", 8, 26, "left");
        chair("chair-wood", 8, 27, "left");

        // --- lobby (bottom-centre): open, with soft flanking decor ---
        placeItem("lamp-warm", 18, 26, { blockedOffsets: [[0, 0]] });
        placeItem("lamp-blue", 25, 26, { blockedOffsets: [[0, 0]] });
        pot("plant-tall", 19, 28);
        pot("plant-tall", 24, 28);

        // --- hub dividers: loose ferns keep sightlines open, Gather-style ---
        pot("plant-fern", 22, 20);
        pot("plant-fern", 26, 20);
        pot("plant-fern", 30, 20);
        pot("pot-2", 11, 24);
        pot("pot-1", 32, 22);

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

        // seated idle loops — sit2 holds the side poses, sit3 the front pose,
        // and the original 24-frame sheet supplies the only back view (desks).
        this.anims.create({ key: "sit-left", frames:
        this.anims.generateFrameNumbers("adam-sit-side", { start: 0, end: 5
        }), frameRate: 4, repeat: -1 });

        this.anims.create({ key: "sit-right", frames:
        this.anims.generateFrameNumbers("adam-sit-side", { start: 6, end: 11
        }), frameRate: 4, repeat: -1 });

        this.anims.create({ key: "sit-down", frames:
        this.anims.generateFrameNumbers("adam-sit-front", { start: 0, end: 5
        }), frameRate: 4, repeat: -1 });

        this.anims.create({ key: "sit-up", frames:
        this.anims.generateFrameNumbers("adam-sit", { start: 6, end: 11
        }), frameRate: 4, repeat: -1 });

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
        this.reactionsRef = this.registry.get("reactionsRef");


        this.cameras.main.setBounds(0,0,worldWidth,worldHeight);
        this.cameras.main.startFollow(this.player , true ,0.1 , 0.1);

        // ?zoom=1 in the URL shows the whole map (handy for layout debugging)
        const dbgZoom = Number(new URLSearchParams(window.location.search).get("zoom"));
        this.cameras.main.setZoom(dbgZoom > 0 ? dbgZoom : 2);

    }

    // Phaser runs update() every frame — we use it to draw other players and keep the name tags in place
    update() {
        // pop any new emoji reactions above their avatar
        this.spawnReactions();
        // --- keep MY shadow, pill, and draw-order in sync every frame ---
        const currentTileKey = this.tileX + "," + this.tileY;
        const chairDir = this.chairMap[currentTileKey];
        const isSelfSitting = !!chairDir && !this.isMoving;

        if (isSelfSitting && chairDir) {
            const seat = this.seatedPoint(this.tileX, this.tileY, chairDir);
            this.player.setPosition(seat.x, seat.y);
            this.setSittingPose(this.player, chairDir);
            this.player.setScale(2.0); // same size seated as standing, like Gather
        } else {
            this.setStandingPose(this.player);
            this.player.setScale(2.0);
            if (!this.isMoving) {
                this.player.setPosition(
                    this.tileX * TILE + TILE / 2,
                    this.tileY * TILE + TILE / 2
                );
            }
        }

        const myFeet = this.player.y + this.player.displayHeight / 2;
        // A seated avatar must remain visible. Feet-based depth keeps a person below a
        // table in front of it, while a person above the table stays naturally behind it.
        this.player.setDepth(myFeet);

        // shadow sits at my feet and just under me in draw order
        this.playerShadow.setPosition(this.player.x, this.player.y + this.player.displayHeight / 2 - 6);
        this.playerShadow.setDepth(this.player.depth - 2);
        this.playerShadow.setAlpha(isSelfSitting ? 0.08 : 0.25);

        // Keep the name pill compact. Sitting is already obvious from the pose and amber dot.
        const selfTagState = isSelfSitting ? "You:sitting" : "You:standing";
        if (this.selfTagName !== selfTagState) {
            this.nameTag?.destroy();
            this.nameTag = this.makeNameTag("You", true, isSelfSitting);
            this.selfTagName = selfTagState;
        }
        this.nameTag.setPosition(this.player.x, this.player.y - 38);

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
                this.otherTagNames[id] = `${startName}:standing`;
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
                const seat = this.seatedPoint(p.x, p.y, otherChairDir);
                sprite.setPosition(seat.x, seat.y);
                this.setSittingPose(sprite, otherChairDir);
                sprite.setScale(2.0); // same size seated as standing, like Gather
            } else {
                this.setStandingPose(sprite);
                sprite.setScale(2.0);
                if (!isOtherMoving) {
                    sprite.setPosition(px, py);
                }
            }

            const feet = sprite.y + sprite.displayHeight / 2;
            sprite.setDepth(feet);

            const shadow = this.otherShadows[id];
            if (shadow) {
                shadow.setPosition(sprite.x, sprite.y + sprite.displayHeight / 2 - 6);
                shadow.setDepth(sprite.depth - 2);
            }

            // fade avatars that are far away; keep nearby ones bright (Gather-style).
            // default to visible when we have no proximity data (e.g. the /phaser sandbox).
            const near = this.nearbyRef?.current?.has(id) ?? true;
            sprite.setAlpha(near ? 1 : 0.35);
            shadow?.setAlpha(isOtherSitting ? (near ? 0.08 : 0.03) : (near ? 0.25 : 0.1));

            // if the real username has loaded (or changed) since we built the pill, rebuild it
            const realName = this.namesRef?.current?.[id];
            const baseName = realName || id.slice(0, 5);
            const tagState = `${baseName}:${isOtherSitting ? "sitting" : "standing"}`;

            if (this.otherTagNames[id] !== tagState) {
                this.otherTags[id]?.destroy();
                this.otherTags[id] = this.makeNameTag(baseName, false, isOtherSitting);
                this.otherTagNames[id] = tagState;
            }
            const tag = this.otherTags[id];
            if (tag) {
                tag.setPosition(sprite.x, sprite.y - 38);
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

        this.setStandingPose(this.player);
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

    // Each direction has its own seated idle animation (see the sit-* anims in
    // create()). Playing the loop instead of freezing a frame keeps seated
    // avatars alive, like Gather's subtle breathing idle.
    private setSittingPose(sprite: Phaser.GameObjects.Sprite, dir: "down" | "up" | "left" | "right") {
        const key = "sit-" + dir;
        if (sprite.anims.currentAnim?.key !== key || !sprite.anims.isPlaying) {
            sprite.anims.play(key, true);
        }
    }

    private setStandingPose(sprite: Phaser.GameObjects.Sprite) {
        if (sprite.anims.currentAnim?.key.startsWith("sit-") && sprite.anims.isPlaying) {
            sprite.anims.stop();
        }
        if (sprite.texture.key !== "adam") {
            sprite.setTexture("adam", this.standingFrame(this.facing));
        }
    }

    // The chair itself owns one tile. Offsets are tuned per sheet (drawn at 2x,
    // origin 0.5/0.5) so the torso lands centred on the chair cushion:
    //   down       sit3, 16px frame, body fills the frame        -> no x shift
    //   up         original sit sheet, body x6..15 (+6px right)  -> pull left
    //   left/right sit2, 32px frame, torso centred with the legs
    //              spilling toward the facing side (under the table)
    private seatedPoint(tileX: number, tileY: number, dir: "up" | "down" | "left" | "right") {
        const off = {
            down:  { dx: 0,  dy: -2 },
            up:    { dx: -6, dy: -2 },
            left:  { dx: 0,  dy: 6 },
            right: { dx: 0,  dy: 6 },
        }[dir];
        return {
            x: tileX * TILE + TILE / 2 + off.dx,
            y: tileY * TILE + off.dy,
        };
    }

    // spawn a floating emoji above the avatar that reacted, then let it drift up and fade.
    // maps userId -> that player's sprite, or falls back to my own sprite (my own reaction).
    private spawnReactions() {
        const list = this.reactionsRef?.current;
        if (!list) return;

        for (const r of list) {
            if (this.shownReactions.has(r.id)) continue;
            this.shownReactions.add(r.id);

            const target = this.otherSprites[r.userId] ?? this.player;
            const emoji = this.add
                .text(target.x, target.y - 40, r.emoji, { fontSize: "24px" })
                .setOrigin(0.5, 1)
                .setDepth(20000);

            this.tweens.add({
                targets: emoji,
                y: target.y - 90,
                alpha: 0,
                duration: 1800,
                ease: "Cubic.easeOut",
                onComplete: () => emoji.destroy(),
            });
        }

        // forget ids that have aged out of the React list, so the Set stays small
        const liveIds = new Set(list.map((r) => r.id));
        for (const id of this.shownReactions) {
            if (!liveIds.has(id)) this.shownReactions.delete(id);
        }
    }

    private standingFrame(dir:"down"|"up"|"left" | "right"){
        if(dir === "up") return 6;
        if(dir === "left") return 12;
        if(dir === "right") return 0;
        return 18;
    }
}
