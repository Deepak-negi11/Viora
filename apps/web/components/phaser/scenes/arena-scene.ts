import Phaser from "phaser";

const TILE = 32; //what does this mean in the simpler way to understand  i do understasn the tile  like where we use this for movement all where what does pixel per tile means

const COLS = 40;
const ROWS = 30;
export class ArenaScene extends Phaser.Scene{
    //this the my place in the grid 2,2
    private tileX = 19;
    private tileY = 27;

    private maxTileX = 0;
    private maxTileY = 0;

    private facing : "down" |"up" | "right" | "left" = "down";
    private isMoving = false;

    //i have no idea what is this 3 thing what is this Record 
    private otherSprites:Record<string,Phaser.GameObjects.Sprite> = {}
    private otherRef?:{current:Record<string,{x:number;y:number}>}
    private moveRef?: {current:(p:{x:number;y:number})=>void}
    // userId -> username, filled by the React page; used to label other players' pills
    private namesRef?: {current:Record<string,string>}
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
    // (now a Container: rounded pill + green online dot + text)
    private nameTag!: Phaser.GameObjects.Container;
    private otherTags: Record<string, Phaser.GameObjects.Container> = {};
    // a soft shadow ellipse under me and under each other player, so avatars feel grounded
    private playerShadow!: Phaser.GameObjects.Ellipse;
    private otherShadows: Record<string, Phaser.GameObjects.Ellipse> = {};
    // tiles you cannot walk onto (walls). key format "x,y".
    private blocked = new Set<string>();

    private player!: Phaser.GameObjects.Sprite
    //why this class why this then what does super means i forgot
    //does this instructor call the it paresnt i thinks so
    constructor(){
        super("arena")
    }
    
    //load the images before the game start
    preload(){
        this.load.image("floor" ,"/assets/floor-grey.png")
        this.load.image("floor-teal", "/assets/floor-teal.png")
        this.load.image("floor-herringbone", "/assets/floor-herringbone.png")
        this.load.image("floor-brick", "/assets/floor-brick.png")
        this.load.spritesheet("adam","/assets/adam-run.png",{
            frameWidth:16,
            frameHeight:32
        });

        // load 24 furniture pieces (cut from the LimeZu Interiors tileset)
        for (let i = 0; i < 24; i++) {
            this.load.image("furn" + i, "/assets/furniture/piece_" + i + ".png");
        }
    }
    // this create the grid or what game
    create(){
        // what is this .scale here
        //what is this do here like and first of call why is this a class 
        const width = this.scale.width;
        const height = this.scale.height;

        const worldWidth = COLS * TILE;
        const worldHeight = ROWS * TILE;

        // Draw main corridor floor (neutral grey carpet) across the entire 40x30 map
        this.add.tileSprite(0, 0, worldWidth, worldHeight, "floor").setOrigin(0, 0).setDepth(-1002);

        // --- Build Symmetrical Thin boundaries around the outer edge of the map ---
        const boundaryColor = 0x2c3e50;
        const wallThickness = 6;
        
        // Top boundary (y = 0)
        for (let x = 0; x < COLS; x++) {
            this.add.rectangle(x * TILE, 0, TILE, wallThickness, boundaryColor).setOrigin(0, 0).setDepth(wallThickness);
            this.blocked.add(x + ",0");
        }
        // Bottom boundary (y = 29) with exit/entrance gap at x = 19, 20
        for (let x = 0; x < COLS; x++) {
            if (x === 19 || x === 20) continue;
            this.add.rectangle(x * TILE, 29 * TILE + TILE - wallThickness, TILE, wallThickness, boundaryColor).setOrigin(0, 0).setDepth(29 * TILE + TILE);
            this.blocked.add(x + ",29");
        }
        // Left boundary (x = 0)
        for (let y = 0; y < ROWS; y++) {
            this.add.rectangle(0, y * TILE, wallThickness, TILE, boundaryColor).setOrigin(0, 0).setDepth(y * TILE + TILE);
            this.blocked.add("0," + y);
        }
        // Right boundary (x = 39)
        for (let y = 0; y < ROWS; y++) {
            this.add.rectangle(39 * TILE + TILE - wallThickness, y * TILE, wallThickness, TILE, boundaryColor).setOrigin(0, 0).setDepth(y * TILE + TILE);
            this.blocked.add("39," + y);
        }

        // --- Build 4 Spacious Office Rooms with herringbone wood floors and thin slate-steel walls ---
        const officeWallColor = 0x3f4f66; // Slate steel
        // Left Office 1 (Top Left)
        this.buildRoom(1, 2, 8, 10, "floor-herringbone", { side: "right", at: 5, span: 3 }, officeWallColor);
        // Left Office 2 (Bottom Left)
        this.buildRoom(1, 16, 8, 10, "floor-herringbone", { side: "right", at: 19, span: 3 }, officeWallColor);

        // Right Office 1 (Top Right)
        this.buildRoom(31, 2, 8, 10, "floor-herringbone", { side: "left", at: 5, span: 3 }, officeWallColor);
        // Right Office 2 (Bottom Right)
        this.buildRoom(31, 16, 8, 10, "floor-herringbone", { side: "left", at: 19, span: 3 }, officeWallColor);

        // --- Build Central Kitchen / Break Room (Top Center, Brick floor, Thin walls) ---
        this.buildRoom(11, 2, 18, 9, "floor-brick", { side: "bottom", at: 18, span: 3 }, officeWallColor);

        // --- Build Central Conference Room (Herringbone wood floor, slate-steel walls) ---
        this.buildRoom(11, 13, 8, 8, "floor-herringbone", { side: "bottom", at: 13, span: 3 }, officeWallColor);

        // --- Build Central Lounge Room (Herringbone wood floor, slate-steel walls) ---
        this.buildRoom(21, 13, 8, 8, "floor-herringbone", { side: "bottom", at: 23, span: 3 }, officeWallColor);

        // Lounge area rug (blue/grey translucent rounded rect)
        const rug = this.add.graphics();
        rug.fillStyle(0x3a3a52, 0.35);
        rug.fillRoundedRect(22 * TILE, 14 * TILE, 6 * TILE, 5 * TILE, 12);
        rug.setDepth(-999);

        // --- Place All Furniture & Register Sitting Chairs ---
        const placeFurniture = (id: number, fx: number, fy: number, opts?: {
            blockedOffsets?: [number, number][],
            chairOffsets?: { dx: number; dy: number; dir: "up" | "down" | "left" | "right" }[]
        }) => {
            const piece = this.add.image(fx * TILE, fy * TILE, "furn" + id).setOrigin(0, 0);
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

        // Clean Desk setup (piece_6: size 3x4): blocks top row (desk) and bottom rows (whiteboard/border). Chair is at (1, 1).
        const cleanDeskOpts = {
            blockedOffsets: [
                [0, 0] as [number, number], [1, 0] as [number, number], [2, 0] as [number, number],
                [0, 2] as [number, number], [1, 2] as [number, number], [2, 2] as [number, number],
                [0, 3] as [number, number], [1, 3] as [number, number], [2, 3] as [number, number]
            ],
            chairOffsets: [{ dx: 1, dy: 1, dir: "up" as const }]
        };

        // --- FURNITURE PLACEMENTS ---
        // Left Office 1 (Shared Executive Room)
        placeFurniture(6, 2, 3, cleanDeskOpts); // Workstation 1
        placeFurniture(6, 5, 3, cleanDeskOpts); // Workstation 2

        // Left Office 2 (Development Workspace)
        placeFurniture(6, 2, 17, cleanDeskOpts); // Workstation 1
        placeFurniture(6, 5, 17, cleanDeskOpts); // Workstation 2
        placeFurniture(22, 2, 22); // File Drawer Cabinet (Cabinet 1)

        // Right Office 1 (Marketing Room)
        placeFurniture(6, 32, 3, cleanDeskOpts); // Workstation 1
        placeFurniture(6, 35, 3, cleanDeskOpts); // Workstation 2
        placeFurniture(12, 34, 8); // Whiteboard screen

        // Right Office 2 (Finance/HR Workspace)
        placeFurniture(6, 32, 17, cleanDeskOpts); // Workstation 1
        placeFurniture(6, 35, 17, cleanDeskOpts); // Workstation 2
        placeFurniture(8, 33, 22); // Bookshelf (Cabinet 2)

        // Kitchen / Break Room (Top Center)
        placeFurniture(9, 12, 3); // Counter
        placeFurniture(20, 26, 3); // Vending machine
        // Dining Table with 4 chairs (piece_1)
        placeFurniture(1, 18, 4, {
            blockedOffsets: [[1, 1], [2, 1], [1, 2], [2, 2]],
            chairOffsets: [
                { dx: 0, dy: 1, dir: "right" }, { dx: 0, dy: 2, dir: "right" },
                { dx: 3, dy: 1, dir: "left" }, { dx: 3, dy: 2, dir: "left" },
                { dx: 1, dy: 0, dir: "down" }, { dx: 2, dy: 0, dir: "down" },
                { dx: 1, dy: 3, dir: "up" }, { dx: 2, dy: 3, dir: "up" }
            ]
        });

        // Conference Room (Center Left)
        placeFurniture(12, 12, 14); // Whiteboard Screen
        // Meeting Table & Chairs (piece_1)
        placeFurniture(1, 13, 15, {
            blockedOffsets: [[1, 1], [2, 1], [1, 2], [2, 2]],
            chairOffsets: [
                { dx: 0, dy: 1, dir: "right" }, { dx: 0, dy: 2, dir: "right" },
                { dx: 3, dy: 1, dir: "left" }, { dx: 3, dy: 2, dir: "left" },
                { dx: 1, dy: 0, dir: "down" }, { dx: 2, dy: 0, dir: "down" },
                { dx: 1, dy: 3, dir: "up" }, { dx: 2, dy: 3, dir: "up" }
            ]
        });

        // Lounge Room (Center Right)
        placeFurniture(19, 24, 14); // Coffee Table
        // Cozy Sofa Couch (piece_7)
        placeFurniture(7, 22, 15, {
            blockedOffsets: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [4, 1]],
            chairOffsets: [
                { dx: 1, dy: 1, dir: "up" }, { dx: 2, dy: 1, dir: "up" }, { dx: 3, dy: 1, dir: "up" }
            ]
        });

        // Lobby (Bottom Center)
        // Lounge Sofa Couch (piece_7)
        placeFurniture(7, 18, 24, {
            blockedOffsets: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [4, 1]],
            chairOffsets: [
                { dx: 1, dy: 1, dir: "up" }, { dx: 2, dy: 1, dir: "up" }, { dx: 3, dy: 1, dir: "up" }
            ]
        });


        // Draw the grid lines (unused but kept for layout alignment if needed)
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x262626, 1);

        this.add.text(16, 16, "Hello Phaser", {
            fontFamily: "sans-serif",
            fontSize: "20px",
            color: "#ffffff",
        }).setScrollFactor(0).setDepth(9998);

        this.maxTileX = COLS - 1;
        this.maxTileY = ROWS - 1;
        
        const px = this.tileX * TILE + TILE / 2;
        const py = this.tileY * TILE + TILE / 2;

        this.player = this.add.sprite(px, py, "adam", 0);
        this.player.setScale(2);

        this.playerShadow = this.add.ellipse(px, py + 26, 26, 10, 0x000000, 0.25);

        this.nameTag = this.makeNameTag("You", true, false);
        this.nameTag.setPosition(px, py - 34);

        //what is this this.anims does it means animate 
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


        // why is this name is the pointerdown 
        // click / tap a tile to walk there. We only remember WHERE you want to go (the target);
        // stepTowardTarget() then walks one tile at a time, because the server only accepts one-tile moves.
        this.input.on("pointerdown",(pointer:Phaser.Input.Pointer)=>{
            //why does this math.floor is used here i think it gives a random number i have this question why is this worldx and can i keep this as any other name 
            const tx = Math.floor(pointer.worldX/TILE);
            const ty = Math.floor(pointer.worldY /TILE)
            this.targetX = Phaser.Math.Clamp(tx, 0, this.maxTileX);
            this.targetY = Phaser.Math.Clamp(ty, 0, this.maxTileY);
            if (!this.isMoving) this.stepTowardTarget();
        })
        this.otherRef = this.registry.get("othersRef");
        this.moveRef = this.registry.get("moveRef");
        this.namesRef = this.registry.get("namesRef");


        this.cameras.main.setBounds(0,0,worldWidth,worldHeight);
        //what is this 0.1 , 0. it is for the smooth animation for the camera
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

        //what does this phaser.math.clamp does like meaning of this 
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

    // lay a room's floor and draw its walls as thin border lines.
    // Every wall tile is added to this.blocked so movement collides with it.
    private buildRoom(
        rx: number, ry: number, rw: number, rh: number,
        floorKey: string,
        door: { side: "top" | "bottom" | "left" | "right"; at: number; span: number },
        wallColor: number
    ) {
        // interior floor
        this.add.tileSprite(rx * TILE, ry * TILE, rw * TILE, rh * TILE, floorKey)
            .setOrigin(0, 0).setDepth(-1000);

        // is (x, y) part of the door opening on this room's edge?
        const isDoor = (x: number, y: number, side: "top" | "bottom" | "left" | "right") => {
            if (door.side !== side) return false;
            if (side === "top" || side === "bottom") {
                return x >= door.at && x < door.at + door.span;
            } else {
                return y >= door.at && y < door.at + door.span;
            }
        };

        const wallThickness = 6;
        const color = wallColor;

        // Draw top wall (along y = ry)
        for (let x = rx; x < rx + rw; x++) {
            if (isDoor(x, ry, "top")) continue;
            const wall = this.add.rectangle(x * TILE, ry * TILE, TILE, wallThickness, color).setOrigin(0, 0);
            wall.setDepth(ry * TILE + wallThickness);
            this.blocked.add(x + "," + ry);
        }

        // Draw bottom wall (along y = ry + rh - 1)
        for (let x = rx; x < rx + rw; x++) {
            if (isDoor(x, ry + rh - 1, "bottom")) continue;
            const wall = this.add.rectangle(x * TILE, (ry + rh - 1) * TILE + TILE - wallThickness, TILE, wallThickness, color).setOrigin(0, 0);
            wall.setDepth((ry + rh - 1) * TILE + TILE);
            this.blocked.add(x + "," + (ry + rh - 1));
        }

        // Draw left wall (along x = rx)
        for (let y = ry; y < ry + rh; y++) {
            if (isDoor(rx, y, "left")) continue;
            const wall = this.add.rectangle(rx * TILE, y * TILE, wallThickness, TILE, color).setOrigin(0, 0);
            wall.setDepth(y * TILE + TILE);
            this.blocked.add(rx + "," + y);
        }

        // Draw right wall (along x = rx + rw - 1)
        for (let y = ry; y < ry + rh; y++) {
            if (isDoor(rx + rw - 1, y, "right")) continue;
            const wall = this.add.rectangle((rx + rw - 1) * TILE + TILE - wallThickness, y * TILE, wallThickness, TILE, color).setOrigin(0, 0);
            wall.setDepth(y * TILE + TILE);
            this.blocked.add((rx + rw - 1) + "," + y);
        }
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