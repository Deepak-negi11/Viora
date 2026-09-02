import Phaser from "phaser";

const TILE = 32;

const CLASSIC_COLS = 44;
const CLASSIC_ROWS = 34;
const CAMPUS_COLS = 52;
const CAMPUS_ROWS = 38;
export class ArenaScene extends Phaser.Scene{
    private cols = CLASSIC_COLS;
    private rows = CLASSIC_ROWS;

    private tileX = 19;
    private tileY = 27;
    private selfRef?: { current: { x: number; y: number } };

    private maxTileX = 0;
    private maxTileY = 0;

    private facing : "down" |"up" | "right" | "left" = "down";
    private isMoving = false;

    private otherSprites:Record<string,Phaser.GameObjects.Sprite> = {}
    private otherRef?:{current:Record<string,{x:number;y:number}>}
    private moveRef?: {current:(p:{x:number;y:number})=>void}

    private namesRef?: {current:Record<string,string>}

    private nearbyRef?: {current:Set<string>}

    private reactionsRef?: {current:{id:string;userId:string;emoji:string;at:number}[]}
    private shownReactions = new Set<string>();

    private activitiesRef?: {current:Record<string,{text:string;state:"cooking"|"done";at:number}>}
    private playerClickRef?: {current:((userId:string|null)=>void)|null}

    private otherTagNames: Record<string, string> = {};
    private selfTagName = "";


    private path: { x: number; y: number }[] = [];

    private otherTiles: Record<string, { x: number; y: number }> = {};


    private chairMap: Record<string, "up" | "down" | "left" | "right"> = {};
    private chairLiftMap: Record<string, number> = {};

    private nameTag!: Phaser.GameObjects.Container;
    private otherTags: Record<string, Phaser.GameObjects.Container> = {};

    private playerShadow!: Phaser.GameObjects.Ellipse;
    private otherShadows: Record<string, Phaser.GameObjects.Ellipse> = {};

    private blocked = new Set<string>();

    private wallCells = new Set<string>();

    private player!: Phaser.GameObjects.Sprite

    constructor(){
        super("arena")
    }

    preload(){

        this.load.spritesheet("adam","/assets/adam-run.png",{
            frameWidth:16,
            frameHeight:32
        });

        for (const i of [6, 7, 8, 9, 12, 17, 19, 20, 22, 23]) {
            this.load.image("furn" + i, "/assets/furniture/piece_" + i + ".png");
        }

        for (const n of [
            "table-big", "table-small", "seat-tl", "seat-bl",
            "chair-wood", "chair-wood2", "pot-1", "pot-2", "mirror",
            "lamp-warm", "lamp-blue", "shelf-single",
        ]) {
            this.load.image(n, "/assets/furniture/sub/" + n + ".png");
        }

        this.load.image("lounge-chair", "/assets/custom/lounge-chair-sprite.png");
        for (const n of [
            "desk-monitor", "office-chair", "office-chair-red", "cabinet",
            "whiteboard", "water-cooler", "conf-table", "tv-wall",
            "sofa-red-wide", "sofa-blue-wide", "coffee-round", "coffee-rect",
            "beanbag", "bookshelf-big", "plant-tall", "plant-fern",
            "ping-pong", "foosball", "arcade", "sofa-green-wide",
            "sofa-cream-wide", "armchair-green", "armchair-purple",
            "office-chair-teal", "team-desk", "cafe-counter",
            "reception-desk", "campus-pond", "window-planter",
            "campus-sofa-green", "campus-sofa-cream", "campus-sofa-caramel",
            "campus-loveseat-green", "campus-pouf-purple", "campus-pouf-blue",
            "campus-side-table", "campus-reception-bench",
            ...["up", "down", "left", "right"].flatMap((dir) => [
                `campus-tufted-green-${dir}`, `campus-club-teal-${dir}`,
                `campus-task-teal-${dir}`, `campus-conf-red-${dir}`,
                `campus-wood-chair-${dir}`, `ref-blue-wood-${dir}`,
                `ref-natural-${dir}`, `ref-woven-teal-${dir}`,
                `ref-conference-red-${dir}`, `ref-task-dark-${dir}`,
            ]),
            "ref-table-data", "ref-table-books", "ref-table-coffee",
            "ref-table-lounge", "ref-coffee-station", "ref-aquarium-console",
            "ref-wall-books", "ref-lounge-sofa",
        ]) {
            this.load.image(n, "/assets/custom/" + n + ".png");
        }

        for (const n of [
            "tree-green", "tree-lime", "tree-teal", "tree-teal2",
            "bush-small", "bush-ball", "flower-red", "flower-blue",
            "flower-yellow", "rock-small", "rock-med",
        ]) {
            this.load.image(n, "/assets/outdoor/" + n + ".png");
        }
    }

    create(){
        const mapTemplate = this.registry.get("mapTemplate") === "coworking-campus"
            ? "coworking-campus"
            : "classic-office";
        this.cols = mapTemplate === "coworking-campus" ? CAMPUS_COLS : CLASSIC_COLS;
        this.rows = mapTemplate === "coworking-campus" ? CAMPUS_ROWS : CLASSIC_ROWS;
        const worldWidth = this.cols * TILE;
        const worldHeight = this.rows * TILE;


        this.otherRef = this.registry.get("othersRef");
        this.selfRef = this.registry.get("selfRef");
        this.moveRef = this.registry.get("moveRef");
        this.namesRef = this.registry.get("namesRef");
        this.nearbyRef = this.registry.get("nearbyRef");
        this.reactionsRef = this.registry.get("reactionsRef");
        this.activitiesRef = this.registry.get("activitiesRef");
        this.playerClickRef = this.registry.get("playerClickRef");


        const initialPos = this.selfRef?.current;
        if (initialPos) {
            this.tileX = initialPos.x;
            this.tileY = initialPos.y;
        }

        this.makeTextures();




        this.add.tileSprite(0, 0, worldWidth, worldHeight, "grass").setOrigin(0, 0).setDepth(-1010);
        if (mapTemplate === "coworking-campus") {
            this.buildCoworkingCampus();
        } else {
        this.add.tileSprite(20 * TILE, 30 * TILE, 4 * TILE, 4 * TILE, "path").setOrigin(0, 0).setDepth(-1005);


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








        this.add.tileSprite(3 * TILE, 2 * TILE, 38 * TILE, 28 * TILE, "floor-wood").setOrigin(0, 0).setDepth(-1000);




        this.wallRow(3, 40, 2);
        this.wallRow(3, 40, 29, [20, 21, 22, 23]);
        this.wallCol(3, 2, 29);
        this.wallCol(40, 2, 29);

        this.wallCol(10, 3, 23, [5, 6, 12, 13, 19, 20]);
        this.wallRow(4, 9, 9);
        this.wallRow(4, 9, 16);
        this.wallRow(4, 9, 23);

        this.wallCol(33, 3, 23, [5, 6, 12, 13, 19, 20]);
        this.wallRow(34, 39, 9);
        this.wallRow(34, 39, 16);
        this.wallRow(34, 39, 23);



        this.wallCol(19, 3, 8);
        this.wallRow(12, 19, 9, [14, 15]);
        this.wallCol(23, 3, 8);
        this.wallCol(31, 3, 8);
        this.wallRow(23, 31, 9, [26, 27]);

        this.wallRow(12, 20, 11);
        this.wallCol(12, 12, 19);
        this.wallCol(20, 12, 18, [14, 15]);
        this.wallRow(12, 20, 19, [16, 17]);



        const edgeTouchesWall = (x: number, y: number, len: number, horizontal: boolean) => {
            for (let i = 0; i < len; i++) {
                const tx = horizontal ? x + i : x;
                const ty = horizontal ? y : y + i;
                if (this.wallCells.has(tx + "," + ty)) return true;
            }
            return false;
        };




        const zone = (x: number, y: number, w: number, h: number, key: string) => {
            const left = edgeTouchesWall(x - 1, y, h, false) ? 0.5 : 0;
            const right = edgeTouchesWall(x + w, y, h, false) ? 0.5 : 0;
            const top = edgeTouchesWall(x, y - 1, w, true) ? 0.5 : 0;
            const bottom = edgeTouchesWall(x, y + h, w, true) ? 0.5 : 0;
            this.add.tileSprite(
                (x - left) * TILE,
                (y - top) * TILE,
                (w + left + right) * TILE,
                (h + top + bottom) * TILE,
                key,
            ).setOrigin(0, 0).setDepth(-998);
        };


        zone(4, 3, 6, 6, "floor-office");
        zone(4, 10, 6, 6, "floor-office");
        zone(4, 17, 6, 6, "floor-office");
        zone(34, 3, 6, 6, "floor-office");
        zone(34, 10, 6, 6, "floor-office");
        zone(34, 17, 6, 6, "floor-office");
        zone(12, 3, 7, 6, "floor-office");
        zone(24, 3, 7, 6, "floor-office");
        zone(20, 3, 3, 6, "floor-cafe");

        zone(13, 12, 7, 7, "floor-conf");
        zone(22, 11, 10, 8, "floor-lounge");
        zone(12, 21, 10, 6, "floor-cafe");
        zone(34, 24, 6, 5, "floor-office");
        zone(4, 24, 6, 5, "floor-cafe");


        this.drawWalls();


        const rug = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
            const g = this.add.graphics();
            g.fillStyle(color, alpha);
            g.fillRoundedRect(x * TILE, y * TILE, w * TILE, h * TILE, 10);
            g.setDepth(-996);
        };
        rug(13, 12, 7, 7, 0x5f7d6d, 0.12);
        rug(22, 11, 10, 8, 0xa06f53, 0.18);
        rug(12, 21, 10, 6, 0x59726a, 0.16);
        rug(34, 24, 6, 5, 0x53667e, 0.14);






        const treeKeys = ["tree-green", "tree-lime", "tree-teal", "tree-teal2"];
        const tree = (tx: number, ty: number, k: number) => {
            this.add.image(tx * TILE, (ty + 1) * TILE, treeKeys[k % 4]!)
                .setOrigin(0, 1)
                .setDepth((ty + 1) * TILE);
            this.blocked.add(tx + "," + ty);
            this.blocked.add((tx + 1) + "," + ty);
        };

        [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42].forEach((x, i) => tree(x, 0, i));

        [3, 7, 11, 15, 19, 23, 27, 31].forEach((y, i) => { tree(0, y, i + 1); tree(42, y, i); });

        [1, 5, 9, 13, 16, 25, 33, 37, 40].forEach((x, i) => tree(x, 32, i + 2));


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



        const chair = (key: string, tx: number, ty: number, dir: "up" | "down" | "left" | "right") => {


            this.add.image((tx + 0.5) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(dir === "up" ? (ty + 1) * TILE + 8 : ty * TILE - 2);
            this.chairMap[tx + "," + ty] = dir;
        };


        const pot = (key: string, tx: number, ty: number) =>
            placeItem(key, tx, ty, { blockedOffsets: [[0, 0]] });



        const bench = (key: string, tx: number, ty: number, seats: number, dir: "up" | "down" | "left" | "right") => {
            this.add.image((tx + seats / 2) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(dir === "up" ? (ty + 1) * TILE + 8 : ty * TILE - 2);
            for (let i = 0; i < seats; i++) this.chairMap[(tx + i) + "," + ty] = dir;
        };


        const wallMount = (key: string, cx: number, wy: number, scale = 1) =>
            this.add.image(cx * TILE, wy * TILE + 20, key).setScale(scale).setDepth(wy * TILE + 40);



        const workstation = (dx: number, dy: number) => {
            placeItem("desk-monitor", dx, dy);
            chair("office-chair", dx, dy + 2, "up");
        };



        for (const oy of [3, 10, 17]) {
            workstation(6, oy);
            placeItem("cabinet", 4, oy);
            pot("plant-fern", 9, oy + 5);
        }

        for (const oy of [3, 10, 17]) {
            workstation(36, oy);
            placeItem("cabinet", 38, oy);
            pot("plant-fern", 34, oy + 5);
        }

        workstation(14, 3);
        placeItem("bookshelf-big", 17, 3);
        pot("plant-tall", 12, 7);
        workstation(27, 3);
        placeItem("bookshelf-big", 24, 3);
        pot("plant-tall", 30, 7);

        wallMount("furn22", 15, 2, 0.6);
        wallMount("furn22", 27, 2, 0.6);



        pot("coffee-round", 21, 6);
        placeItem("water-cooler", 22, 7, { blockedOffsets: [[0, 0]] });


        placeItem("conf-table", 14, 14);
        chair("office-chair-red", 14, 13, "down");
        chair("office-chair-red", 15, 13, "down");
        chair("office-chair-red", 16, 13, "down");
        chair("office-chair-red", 17, 13, "down");
        chair("office-chair-red", 14, 16, "up");
        chair("office-chair-red", 15, 16, "up");
        chair("office-chair-red", 16, 16, "up");
        chair("office-chair-red", 17, 16, "up");
        wallMount("tv-wall", 16, 11);
        placeItem("cabinet", 13, 12);
        placeItem("water-cooler", 19, 12, { blockedOffsets: [[0, 0]] });
        pot("plant-fern", 19, 18);


        placeItem("plant-tall", 22, 11, { blockedOffsets: [[0, 0]] });
        placeItem("bookshelf-big", 28, 11);
        placeItem("bookshelf-big", 30, 11);
        bench("sofa-red-wide", 23, 13, 3, "down");
        placeItem("coffee-rect", 23, 15);
        bench("sofa-blue-wide", 27, 14, 3, "down");
        pot("coffee-round", 28, 16);
        bench("lounge-chair", 22, 16, 1, "down");
        bench("lounge-chair", 26, 17, 1, "down");
        bench("lounge-chair", 31, 15, 1, "down");
        pot("plant-fern", 22, 18);
        placeItem("whiteboard", 25, 11, { blockedOffsets: [[0, 0], [1, 0]] });


        workstation(13, 21);
        workstation(17, 21);
        workstation(13, 24);
        workstation(17, 24);
        placeItem("water-cooler", 21, 21, { blockedOffsets: [[0, 0]] });
        pot("plant-fern", 21, 26);
        pot("plant-tall", 16, 21);


        placeItem("ping-pong", 34, 24);
        placeItem("arcade", 39, 24);
        placeItem("foosball", 36, 27);
        pot("plant-fern", 34, 28);


        placeItem("table-big", 6, 26);
        chair("chair-wood", 5, 26, "right");
        chair("chair-wood", 5, 27, "right");
        chair("chair-wood", 8, 26, "left");
        chair("chair-wood", 8, 27, "left");


        placeItem("lamp-warm", 18, 26, { blockedOffsets: [[0, 0]] });
        placeItem("lamp-blue", 25, 26, { blockedOffsets: [[0, 0]] });
        pot("plant-tall", 19, 28);
        pot("plant-tall", 24, 28);


        pot("plant-fern", 22, 20);
        pot("plant-fern", 26, 20);
        pot("plant-fern", 30, 20);
        pot("pot-2", 11, 24);
        pot("pot-1", 32, 22);
        }




        this.maxTileX = this.cols - 1;
        this.maxTileY = this.rows - 1;

        const px = this.tileX * TILE + TILE / 2;
        const py = this.tileY * TILE + TILE / 2;

        this.player = this.add.sprite(px, py, "adam", 0);
        this.player.setScale(2);
        this.player.setInteractive({ cursor: "pointer" });
        this.player.on("pointerdown", (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            const selfId = this.registry.get("selfId") as string | null;
            this.playerClickRef?.current?.(selfId);
        });

        this.playerShadow = this.add.ellipse(px, py + 26, 26, 10, 0x000000, 0.25);

        const selfId = this.registry.get("selfId");
        const selfNameRaw = selfId ? (this.namesRef?.current?.[selfId] ?? "You") : "You";
        const selfName = selfNameRaw.length > 20 ? selfNameRaw.slice(0, 20) + "..." : selfNameRaw;
        this.nameTag = this.makeNameTag(selfName, true, false);
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




        this.input.on("pointerdown",(pointer:Phaser.Input.Pointer)=>{
            this.playerClickRef?.current?.(null);
            const tx = Phaser.Math.Clamp(Math.floor(pointer.worldX / TILE), 0, this.maxTileX);
            const ty = Phaser.Math.Clamp(Math.floor(pointer.worldY / TILE), 0, this.maxTileY);
            this.path = this.findPath(this.tileX, this.tileY, tx, ty);
            if (!this.isMoving) this.followPath();
        })



        this.cameras.main.setBounds(0,0,worldWidth,worldHeight);
        this.cameras.main.startFollow(this.player , true ,0.1 , 0.1);


        const getMinZoom = () => {
            return Math.max(this.cameras.main.width / worldWidth, this.cameras.main.height / worldHeight);
        };


        const dbgZoom = Number(new URLSearchParams(window.location.search).get("zoom"));
        const initialZoom = dbgZoom > 0 ? dbgZoom : 2;
        this.cameras.main.setZoom(Phaser.Math.Clamp(initialZoom, getMinZoom(), 4.0));


        this.input.on("wheel", (pointer: Phaser.Input.Pointer, gameObjects: unknown, deltaX: number, deltaY: number) => {
            let zoom = this.cameras.main.zoom;

            zoom -= deltaY * 0.008;
            zoom = Phaser.Math.Clamp(zoom, getMinZoom(), 4.0);
            this.cameras.main.setZoom(zoom);
        });


        this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
            const minZoom = Math.max(gameSize.width / worldWidth, gameSize.height / worldHeight);
            if (this.cameras.main.zoom < minZoom) {
                this.cameras.main.setZoom(minZoom);
            }
        });
    }

    private buildCoworkingCampus() {

        this.add.tileSprite(24 * TILE, 0, 4 * TILE, 9 * TILE, "path").setOrigin(0, 0).setDepth(-1005);
        this.add.tileSprite(3 * TILE, 8 * TILE, 46 * TILE, 27 * TILE, "floor-wood").setOrigin(0, 0).setDepth(-1000);

        this.wallRow(3, 48, 8, [24, 25, 26, 27]);
        this.wallRow(3, 48, 34, [24, 25, 26, 27]);
        this.wallCol(3, 8, 34);
        this.wallCol(48, 8, 34);
        this.wallCol(15, 9, 16, [12, 13]);
        this.wallCol(36, 9, 16, [12, 13]);
        this.wallRow(4, 14, 17, [9, 10]);
        this.wallRow(37, 47, 17, [41, 42]);
        this.wallRow(4, 47, 28, [12, 13, 25, 26, 38, 39]);



        const touchesWall = (x: number, y: number, length: number, horizontal: boolean) => {
            for (let i = 0; i < length; i++) {
                const tx = horizontal ? x + i : x;
                const ty = horizontal ? y : y + i;
                if (this.wallCells.has(tx + "," + ty)) return true;
            }
            return false;
        };
        const zone = (x: number, y: number, w: number, h: number, key: string) => {
            const left = touchesWall(x - 1, y, h, false) ? 0.5 : 0;
            const right = touchesWall(x + w, y, h, false) ? 0.5 : 0;
            const top = touchesWall(x, y - 1, w, true) ? 0.5 : 0;
            const bottom = touchesWall(x, y + h, w, true) ? 0.5 : 0;
            this.add.tileSprite(
                (x - left) * TILE,
                (y - top) * TILE,
                (w + left + right) * TILE,
                (h + top + bottom) * TILE,
                key,
            ).setOrigin(0, 0).setDepth(-998);
        };
        zone(4, 9, 11, 8, "floor-conf");
        zone(37, 9, 11, 8, "floor-office");
        zone(16, 9, 20, 8, "floor-cafe");
        zone(4, 18, 16, 10, "floor-office");
        zone(21, 18, 10, 10, "floor-lounge");
        zone(32, 18, 16, 10, "floor-office");
        zone(4, 29, 13, 5, "floor-cafe");
        zone(18, 29, 16, 5, "floor-lounge");
        zone(35, 29, 13, 5, "floor-cafe");
        this.drawWalls();

        const rug = (x: number, y: number, w: number, h: number, color: number) => {
            this.add.rectangle((x + w / 2) * TILE, (y + h / 2) * TILE, w * TILE, h * TILE, color, 0.18)
                .setDepth(-996);
        };
        rug(5, 19, 14, 8, 0x8194bc);
        rug(22, 19, 8, 8, 0xd6b77f);
        rug(33, 19, 14, 8, 0x8f86be);

        const place = (key: string, tx: number, ty: number, blockedOffsets?: [number, number][]) => {
            const image = this.add.image(tx * TILE, ty * TILE, key).setOrigin(0, 0);
            image.setDepth(image.y + image.displayHeight);
            if (blockedOffsets) {
                for (const [dx, dy] of blockedOffsets) {
                    const blockedX = Math.round(tx + dx);
                    const blockedY = Math.round(ty + dy);
                    this.blocked.add(blockedX + "," + blockedY);
                }
            } else {
                this.blockFootprint(tx, ty, image.displayWidth, image.displayHeight);
            }
        };
        const chair = (key: string, tx: number, ty: number, dir: "up" | "down" | "left" | "right", lift?: number) => {
            this.add.image((tx + 0.5) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(dir === "up" ? (ty + 1) * TILE + 8 : ty * TILE - 2);
            const tileKey = tx + "," + ty;
            this.chairMap[tileKey] = dir;
            if (lift !== undefined) this.chairLiftMap[tileKey] = lift;
        };
        type SeatDirection = "up" | "down" | "left" | "right";
        type SeatFamily = {
            key: string;
            seatLift?: Partial<Record<SeatDirection, number>>;
        };
        const seatFamilies = {
            blueWood: { key: "ref-blue-wood" },
            natural: { key: "campus-wood-chair" },
            wovenTeal: { key: "ref-woven-teal" },
            taskDark: { key: "ref-task-dark", seatLift: { up: 10, down: 8 } },
        } satisfies Record<string, SeatFamily>;
        const directionalChair = (family: SeatFamily, tx: number, ty: number, dir: SeatDirection) =>
            chair(`${family.key}-${dir}`, tx, ty, dir, family.seatLift?.[dir]);


        const conferenceChair = (tx: number, ty: number, dir: SeatDirection) =>
            chair("campus-conf-red-down", tx, ty, dir);
        const bench = (key: string, tx: number, ty: number, seats: number, dir: "up" | "down") => {
            this.add.image((tx + seats / 2) * TILE, (ty + 1) * TILE + 6, key)
                .setOrigin(0.5, 1)
                .setDepth(dir === "up" ? (ty + 1) * TILE + 8 : ty * TILE - 2);
            for (let i = 0; i < seats; i++) this.chairMap[(tx + i) + "," + ty] = dir;
        };
        const pot = (key: string, tx: number, ty: number) => place(key, tx, ty, [[0, 0]]);
        const wallMount = (key: string, cx: number, y: number, scale = 1) =>
            this.add.image(cx * TILE, y * TILE + 20, key).setScale(scale).setDepth(y * TILE + 40);
        const huddle = (family: SeatFamily, tableKey: string, cx: number, cy: number) => {
            place(tableKey, cx - 1, cy - 1, [[0, 0], [1, 0], [0, 1], [1, 1]]);
            directionalChair(family, cx, cy - 2, "down");
            directionalChair(family, cx, cy + 2, "up");
            directionalChair(family, cx - 2, cy, "right");
            directionalChair(family, cx + 2, cy, "left");
        };


        place("campus-pond", 23.5, 2, [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3]]);
        directionalChair(seatFamilies.natural, 22, 3, "right");
        directionalChair(seatFamilies.natural, 29, 3, "left");
        directionalChair(seatFamilies.natural, 24, 6, "up");
        directionalChair(seatFamilies.natural, 27, 6, "up");

        for (const [key, x, y] of [
            ["flower-blue", 21, 6], ["flower-red", 22, 6],
            ["flower-red", 29, 6], ["flower-blue", 30, 6],
            ["flower-blue", 22, 2], ["flower-red", 29, 2],
        ] as [string, number, number][]) {
            this.add.image((x + 0.5) * TILE, (y + 1) * TILE, key)
                .setOrigin(0.5, 1)
                .setScale(1.35)
                .setDepth((y + 1) * TILE);
        }


        place("conf-table", 6, 11);
        for (const x of [6, 7, 8, 9]) {
            conferenceChair(x, 10, "down");
            conferenceChair(x, 14, "up");
        }
        wallMount("tv-wall", 9, 8, 0.85);
        this.add.image(13.5 * TILE, 16 * TILE, "flower-blue").setOrigin(0.5, 1).setScale(1.4).setDepth(16 * TILE);

        place("conf-table", 39, 11);
        for (const x of [39, 40, 41, 42]) {
            directionalChair(seatFamilies.taskDark, x, 10, "down");
            directionalChair(seatFamilies.taskDark, x, 14, "up");
        }
        wallMount("whiteboard", 42, 8);
        this.add.image(46.5 * TILE, 16 * TILE, "flower-red").setOrigin(0.5, 1).setScale(1.4).setDepth(16 * TILE);



        place("ref-coffee-station", 16, 9);
        wallMount("ref-wall-books", 20, 8, 0.72);
        huddle(seatFamilies.blueWood, "ref-table-books", 21, 14);
        place("ref-aquarium-console", 29, 9);
        place("water-cooler", 34, 14, [[0, 0]]);
        huddle(seatFamilies.wovenTeal, "ref-table-coffee", 31, 14);
        wallMount("flower-blue", 25, 8);


        for (const x of [5, 12]) {
            place("team-desk", x, 20);
            directionalChair(seatFamilies.taskDark, x + 1, 19, "down");
            directionalChair(seatFamilies.taskDark, x + 3, 19, "down");
            directionalChair(seatFamilies.taskDark, x + 1, 23, "up");
            directionalChair(seatFamilies.taskDark, x + 3, 23, "up");
        }
        for (const x of [33, 40]) {
            place("team-desk", x, 20);
            directionalChair(seatFamilies.taskDark, x + 1, 19, "down");
            directionalChair(seatFamilies.taskDark, x + 3, 19, "down");
            directionalChair(seatFamilies.taskDark, x + 1, 23, "up");
            directionalChair(seatFamilies.taskDark, x + 3, 23, "up");
        }
        pot("plant-fern", 4, 18);
        this.add.image(19.5 * TILE, 27 * TILE, "flower-blue").setOrigin(0.5, 1).setScale(1.4).setDepth(27 * TILE);
        this.add.image(32.5 * TILE, 27 * TILE, "flower-red").setOrigin(0.5, 1).setScale(1.4).setDepth(27 * TILE);
        pot("plant-fern", 47, 18);



        chair("lounge-chair", 25, 19, "down");
        chair("lounge-chair", 27, 25, "down");
        bench("campus-sofa-cream", 22, 23, 3, "down");
        chair("lounge-chair", 29, 22, "down");
        place("coffee-round", 25, 22);
        place("campus-side-table", 24, 25, [[0, 0]]);
        chair("beanbag", 30, 24, "left");
        place("bookshelf-big", 21, 18);
        place("bookshelf-big", 29, 18);
        this.add.image(21.5 * TILE, 27 * TILE, "flower-blue").setOrigin(0.5, 1).setScale(1.4).setDepth(27 * TILE);
        this.add.image(30.5 * TILE, 27 * TILE, "flower-red").setOrigin(0.5, 1).setScale(1.4).setDepth(27 * TILE);


        place("cafe-counter", 5, 29);
        place("water-cooler", 15, 32, [[0, 0]]);
        directionalChair(seatFamilies.natural, 11, 31, "down");
        directionalChair(seatFamilies.natural, 14, 31, "down");
        place("campus-side-table", 12, 31, [[0, 0]]);
        place("reception-desk", 23, 29);
        directionalChair(seatFamilies.taskDark, 25, 31, "up");
        place("campus-reception-bench", 28, 31, [[0, 0], [1, 0], [2, 0]]);
        this.add.image(19.5 * TILE, 33 * TILE, "flower-blue").setOrigin(0.5, 1).setScale(1.4).setDepth(33 * TILE);
        this.add.image(32.5 * TILE, 33 * TILE, "flower-red").setOrigin(0.5, 1).setScale(1.4).setDepth(33 * TILE);
        place("ping-pong", 36, 29);
        place("bookshelf-big", 42, 29);
        place("arcade", 46, 29);
        bench("lounge-chair", 43, 32, 1, "down");
        directionalChair(seatFamilies.wovenTeal, 45, 32, "up");


        const treeKeys = ["tree-green", "tree-lime", "tree-teal", "tree-teal2"];
        const tree = (tx: number, ty: number, i: number) => {
            this.add.image(tx * TILE, (ty + 1) * TILE, treeKeys[i % treeKeys.length]!)
                .setOrigin(0, 1)
                .setDepth((ty + 1) * TILE);
            this.blocked.add(tx + "," + ty);
            if (tx + 1 < this.cols) this.blocked.add((tx + 1) + "," + ty);
        };
        [0, 4, 8, 13, 17, 33, 38, 43, 48, 50].forEach((x, i) => tree(x, 0, i));
        [4, 10, 16, 22, 28, 34].forEach((y, i) => {
            tree(0, y, i + 1);
            tree(50, y, i + 2);
        });
        [1, 6, 11, 16, 20, 30, 35, 41, 46].forEach((x, i) => tree(x, 36, i + 2));
        for (const [key, x, y] of [
            ["flower-red", 18, 4], ["flower-blue", 33, 5], ["flower-yellow", 20, 7],
            ["bush-small", 2, 7], ["bush-ball", 49, 7], ["rock-small", 17, 6],
            ["flower-blue", 28, 36], ["flower-red", 22, 36],
        ] as [string, number, number][]) {
            this.add.image((x + 0.5) * TILE, (y + 1) * TILE, key).setOrigin(0.5, 1).setDepth(y * TILE);
        }


        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                const insideBuilding = x >= 3 && x <= 48 && y >= 8 && y <= 34;
                const courtyardPath = x >= 20 && x <= 31 && y < 8;
                const entrancePath = x >= 24 && x <= 27 && y >= 34;
                if (!insideBuilding && !courtyardPath && !entrancePath) this.blocked.add(x + "," + y);
            }
        }
    }


    update() {

        const serverSelf = this.selfRef?.current;
        if (serverSelf && !this.isMoving) {
            if (this.tileX !== serverSelf.x || this.tileY !== serverSelf.y) {

                this.tileX = serverSelf.x;
                this.tileY = serverSelf.y;
                this.player.setPosition(
                    this.tileX * TILE + TILE / 2,
                    this.tileY * TILE + TILE / 2
                );
                this.path = [];
            }
        }


        this.spawnReactions();

        const currentTileKey = this.tileX + "," + this.tileY;
        const chairDir = this.chairMap[currentTileKey];
        const isSelfSitting = !!chairDir && !this.isMoving;

        if (isSelfSitting && chairDir) {
            const seat = this.seatedPoint(this.tileX, this.tileY, chairDir, this.chairLiftMap[currentTileKey]);
            this.player.setPosition(seat.x, seat.y);
            this.setSittingPose(this.player, chairDir);
            this.player.setScale(2.0);
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


        this.player.setDepth(myFeet);


        this.playerShadow.setPosition(this.player.x, this.player.y + this.player.displayHeight / 2 - 6);
        this.playerShadow.setDepth(this.player.depth - 2);
        this.playerShadow.setAlpha(isSelfSitting ? 0.08 : 0.25);


        const selfId = this.registry.get("selfId");
        const selfNameRaw = selfId ? (this.namesRef?.current?.[selfId] ?? "You") : "You";
        const selfName = selfNameRaw.length > 20 ? selfNameRaw.slice(0, 20) + "..." : selfNameRaw;
        const isSelfCooking = !!(selfId && this.activitiesRef?.current?.[selfId]?.state === "cooking");
        const selfTagState = `${selfName}:${isSelfSitting ? "sitting" : "standing"}:${isSelfCooking ? "cooking" : "idle"}`;
        if (this.selfTagName !== selfTagState) {
            this.nameTag?.destroy();
            this.nameTag = this.makeNameTag(selfName, true, isSelfSitting, isSelfCooking);
            this.selfTagName = selfTagState;
        }
        this.nameTag.setPosition(this.player.x, this.player.y - 38);


        const others = this.otherRef?.current ?? {};

        for (const id in others) {
            const p = others[id];
            if (!p) continue;
            const px = p.x * TILE + TILE / 2;
            const py = p.y * TILE + TILE / 2;

            let sprite = this.otherSprites[id];
            if (!sprite) {

                sprite = this.add.sprite(px, py, "adam", 18).setScale(2);
                sprite.setInteractive({ cursor: "pointer" });
                sprite.on("pointerdown", (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();
                    this.playerClickRef?.current?.(id);
                });
                this.otherSprites[id] = sprite;
                this.otherTiles[id] = { x: p.x, y: p.y };
                this.otherShadows[id] = this.add.ellipse(px, py, 26, 10, 0x000000, 0.25);

                const startName = this.namesRef?.current?.[id] ?? id.slice(0, 5);
                const startCooking = this.activitiesRef?.current?.[id]?.state === "cooking";
                this.otherTags[id] = this.makeNameTag(startName, false, false, startCooking);
                this.otherTagNames[id] = `${startName}:standing:${startCooking ? "cooking" : "idle"}`;
            } else {
                const last = this.otherTiles[id];
                if (last && (last.x !== p.x || last.y !== p.y)) {


                    const dx = p.x - last.x;
                    const dy = p.y - last.y;
                    const dir =
                        Math.abs(dx) > Math.abs(dy)
                            ? (dx < 0 ? "left" : "right")
                            : (dy < 0 ? "up" : "down");


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


            if (!sprite) continue;

            const otherTileKey = p.x + "," + p.y;
            const otherChairDir = this.chairMap[otherTileKey];
            const isOtherMoving = this.tweens.isTweening(sprite);
            const isOtherSitting = !!otherChairDir && !isOtherMoving;

            if (isOtherSitting && otherChairDir) {
                const seat = this.seatedPoint(p.x, p.y, otherChairDir, this.chairLiftMap[otherTileKey]);
                sprite.setPosition(seat.x, seat.y);
                this.setSittingPose(sprite, otherChairDir);
                sprite.setScale(2.0);
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



            const near = this.nearbyRef?.current?.has(id) ?? true;
            sprite.setAlpha(near ? 1 : 0.35);
            shadow?.setAlpha(isOtherSitting ? (near ? 0.08 : 0.03) : (near ? 0.25 : 0.1));


            const realName = this.namesRef?.current?.[id];
            const baseName = realName || id.slice(0, 5);
            const isOtherCooking = this.activitiesRef?.current?.[id]?.state === "cooking";
            const tagState = `${baseName}:${isOtherSitting ? "sitting" : "standing"}:${isOtherCooking ? "cooking" : "idle"}`;

            if (this.otherTagNames[id] !== tagState) {
                this.otherTags[id]?.destroy();
                this.otherTags[id] = this.makeNameTag(baseName, false, isOtherSitting, isOtherCooking);
                this.otherTagNames[id] = tagState;
            }
            const tag = this.otherTags[id];
            if (tag) {
                tag.setPosition(sprite.x, sprite.y - 38);
                tag.setAlpha(near ? 1 : 0.5);
            }
        }


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
        this.path = [];
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
        if (this.isMoving) return;

        const nextX = Phaser.Math.Clamp(tx, 0, this.maxTileX);
        const nextY = Phaser.Math.Clamp(ty, 0, this.maxTileY);
        if (nextX === this.tileX && nextY === this.tileY) return;



        if (this.blocked.has(nextX + "," + nextY)) {
            this.path = [];
            return;
        }

        this.tileX = nextX;
        this.tileY = nextY;
        this.facing = dir;
        this.isMoving = true;

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

            if (this.path.length > 0) {
                this.followPath();
            } else {
                this.player.anims.stop();
                this.player.setFrame(this.standingFrame(dir));
            }
        },
        });
    }


    private followPath() {
        const next = this.path.shift();
        if (!next) return;
        const dx = next.x - this.tileX;
        const dy = next.y - this.tileY;
        const dir = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
        this.moveToTile(next.x, next.y, dir);
    }





    private findPath(sx: number, sy: number, gx: number, gy: number): { x: number; y: number }[] {
        const key = (x: number, y: number) => x + "," + y;
        const start = key(sx, sy);
        const goal = key(gx, gy);
        const visited = new Set<string>([start]);
        const prev = new Map<string, string>();
        const queue: [number, number][] = [[sx, sy]];
        let best: [number, number] = [sx, sy];
        let bestDist = Math.abs(sx - gx) + Math.abs(sy - gy);
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

        for (let head = 0; head < queue.length; head++) {
            const [cx, cy] = queue[head]!;
            if (cx === gx && cy === gy) break;

            const d = Math.abs(cx - gx) + Math.abs(cy - gy);
            if (d < bestDist) { bestDist = d; best = [cx, cy]; }
            for (const [dx, dy] of dirs) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx < 0 || ny < 0 || nx > this.maxTileX || ny > this.maxTileY) continue;
                const nk = key(nx, ny);
                if (visited.has(nk) || this.blocked.has(nk)) continue;
                visited.add(nk);
                prev.set(nk, key(cx, cy));
                queue.push([nx, ny]);
            }
        }

        const end = visited.has(goal) ? goal : key(best[0], best[1]);
        if (end === start) return [];


        const path: { x: number; y: number }[] = [];
        let cur: string | undefined = end;
        while (cur && cur !== start) {
            const [x, y] = cur.split(",").map(Number);
            path.push({ x: x!, y: y! });
            cur = prev.get(cur);
        }
        path.reverse();
        return path;
    }



    private blockFootprint(tx: number, ty: number, widthPx: number, heightPx: number) {
        const cols = Math.max(1, Math.round(widthPx / TILE));
        const rows = Math.max(1, Math.round(heightPx / TILE));
        for (let x = tx; x < tx + cols; x++) {
            for (let y = ty; y < ty + rows; y++) {
                this.blocked.add(x + "," + y);
            }
        }
    }



    private wallRow(x1: number, x2: number, y: number, skip: number[] = []) {
        for (let x = x1; x <= x2; x++) {
            if (skip.includes(x)) continue;
            this.wallCells.add(x + "," + y);
            this.blocked.add(x + "," + y);
        }
    }


    private wallCol(x: number, y1: number, y2: number, skip: number[] = []) {
        for (let y = y1; y <= y2; y++) {
            if (skip.includes(y)) continue;
            this.wallCells.add(x + "," + y);
            this.blocked.add(x + "," + y);
        }
    }




    private drawWalls() {
        const T = 4;
        const off = (TILE - T) / 2;
        const BASE = 0x8f97a6, LIT = 0xb4bcc9;

        for (const cell of this.wallCells) {
            const [x, y] = cell.split(",").map(Number) as [number, number];
            const px = x * TILE, py = y * TILE;
            const d = py + TILE;
            const n = this.wallCells.has(x + "," + (y - 1));
            const s = this.wallCells.has(x + "," + (y + 1));
            const w = this.wallCells.has((x - 1) + "," + y);
            const e = this.wallCells.has((x + 1) + "," + y);

            const bar = (bx: number, by: number, bw: number, bh: number) => {
                this.add.rectangle(bx, by, bw, bh, BASE).setOrigin(0, 0).setDepth(d);

                this.add.rectangle(bx, by, bw > bh ? bw : 2, bw > bh ? 2 : bh, LIT)
                    .setOrigin(0, 0).setDepth(d);
            };


            if (!n && !s && !w && !e) {
                bar(px + off, py + off, T, T);
                continue;
            }


            if (w || e) {
                const bx = w ? px : px + off;
                const bw = (w && e) ? TILE : (TILE - off);
                bar(bx, py + off, bw, T);
            }
            if (n || s) {
                const by = n ? py : py + off;
                const bh = (n && s) ? TILE : (TILE - off);
                bar(px + off, by, T, bh);
            }
        }
    }



    private makeTextures() {
        const g = this.add.graphics();


        let seed = 7;
        const rand = () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
        };


        g.clear();
        g.fillStyle(0x7cc25e); g.fillRect(0, 0, 64, 64);
        for (let i = 0; i < 90; i++) {
            const c = [0x74b850, 0x8ccf6b, 0x6fae4c][i % 3]!;
            g.fillStyle(c, 1);
            g.fillRect(Math.floor(rand() * 62), Math.floor(rand() * 62), 2, 2);
        }
        g.generateTexture("grass", 64, 64);


        g.clear();
        g.fillStyle(0xcdc7b9); g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xbbb4a4); g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32);
        for (let i = 0; i < 6; i++) {
            g.fillStyle(0xc2bcae, 1);
            g.fillRect(Math.floor(rand() * 30), Math.floor(rand() * 30), 2, 2);
        }
        g.generateTexture("path", 32, 32);


        g.clear();
        g.fillStyle(0xe9dcc0); g.fillRect(0, 0, 64, 64);
        g.fillStyle(0xe4d5b4); g.fillRect(0, 16, 64, 16); g.fillRect(0, 48, 64, 16);
        g.fillStyle(0xd9c9a5);
        for (const y of [15, 31, 47, 63]) g.fillRect(0, y, 64, 1);
        g.fillRect(31, 0, 1, 16); g.fillRect(15, 16, 1, 16);
        g.fillRect(47, 16, 1, 16); g.fillRect(31, 32, 1, 16);
        g.fillRect(15, 48, 1, 16); g.fillRect(47, 48, 1, 16);
        g.generateTexture("floor-wood", 64, 64);


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


        g.clear();
        g.fillStyle(0x5a6170); g.fillRect(0, 0, 32, 14);
        g.fillStyle(0x6b7382); g.fillRect(0, 0, 32, 2);
        g.fillStyle(0xa6aebc); g.fillRect(0, 14, 32, 18);
        g.fillStyle(0x8f97a6); g.fillRect(0, 29, 32, 3);
        g.generateTexture("wall", 32, 32);

        g.destroy();
    }




    private makeNameTag(label: string, isSelf: boolean, isSitting: boolean = false, isCooking: boolean = false) {

        const text = this.add.text(0, 0, label, {
            fontFamily: "sans-serif",
            fontSize: "12px",
            color: "#ffffff",
        }).setOrigin(0, 0.5);


        const padX = 8;
        const dotR = 4;
        const gap = 6;
        const pillH = 20;
        const pillW = padX + dotR * 2 + gap + text.width + padX;


        const left = -pillW / 2;
        const dotX = left + padX + dotR;
        text.setX(dotX + dotR + gap);


        const bg = this.add.graphics();
        const bgColor = isSelf
            ? (isSitting ? 0x4834d4 : 0x6c5ce7)
            : (isSitting ? 0x1e272e : 0x2b2b3c);
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);


        const dot = this.add.graphics();
        dot.fillStyle(isCooking ? 0xff7a1a : (isSitting ? 0xf59e0b : 0x22c55e), 1);
        dot.fillCircle(dotX, 0, dotR);



        return this.add.container(0, 0, [bg, text, dot]).setDepth(10000);
    }




    private setSittingPose(sprite: Phaser.GameObjects.Sprite, dir: "down" | "up" | "left" | "right") {
        if (sprite.anims.isPlaying) sprite.anims.stop();
        if (sprite.texture.key !== "adam") sprite.setTexture("adam");
        sprite.setFrame(this.standingFrame(dir));
    }

    private setStandingPose(sprite: Phaser.GameObjects.Sprite) {
        if (sprite.texture.key !== "adam") {
            sprite.setTexture("adam", this.standingFrame(this.facing));
        }
    }




    private seatedPoint(tileX: number, tileY: number, dir: "up" | "down" | "left" | "right", customLift?: number) {
        const lift = customLift ?? (dir === "up" ? 12 : 8);
        return {
            x: tileX * TILE + TILE / 2,
            y: tileY * TILE + TILE / 2 - lift,
        };
    }



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
