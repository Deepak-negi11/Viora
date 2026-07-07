import Phaser from "phaser";

const TILE = 32; //what does this mean in the simpler way to understand  i do understasn the tile  like where we use this for movement all where what does pixel per tile means

const COLS = 40;
const ROWS = 30;
export class ArenaScene extends Phaser.Scene{
    //this the my place in the grid 2,2
    private tileX = 2;
    private tileY = 2;

    private maxTileX = 0;
    private maxTileY = 0;

    private facing : "down" |"up" | "right" | "left" = "down";
    private isMoving = false;

    private player!: Phaser.GameObjects.Sprite
    //why this class why this then what does super means i forgot
    //does this instructor call the it paresnt i thinks so
    constructor(){
        super("arena")
    }
    
    //load the images before the game start
    preload(){
        this.load.image("floor" ,"/assets/floor-grey.png")
        this.load.spritesheet("adam","/assets/adam-run.png",{
            frameWidth:16,
            frameHeight:32
        });
    }
    // this create the grid or what game
    create(){
        // what is this .scale here
        //what is this do here like and first of call why is this a class 
        const width = this.scale.width;
        const height = this.scale.height;

        const worldWidth = COLS * TILE;
        const worldHeight = ROWS * TILE;

        this.add.tileSprite(0,0,worldWidth,worldHeight,"floor").setOrigin(0,0)
        //what does this do and what does it mean why draw the grid lines
        // what does this .add.graphics does like what more can we do with this .add.graphic 
 
        const grid = this.add.graphics();

        grid.lineStyle(1, 0x262626,1);


        this.add.text(16,16,"Hello Phaser",{
            fontFamily:"sans-serif",
            fontSize:"20px",
            color:"#ffffff",
        }).setScrollFactor(0)

        // so the grid is 800 pixcel and the the one tile is 40 pixel you mean 
        this.maxTileX = COLS -1
        this.maxTileY = ROWS -1
        
        // Tile 2 → 2 × 40 = 80, plus half a tile (20) to sit in the middle → 100. So the square is drawn at pixel (100, 100).
        const px = this.tileX * TILE + TILE /2;
        const py = this.tileY * TILE + TILE /2;

        //explain me this player adam also here 
        this.player = this.add.sprite(px,py,"adam",0);
        this.player.setScale(2);

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
        this.input.on("pointerdown",(pointer:Phaser.Input.Pointer)=>{
            //why does this math.floor is used here i think it gives a random number i have this question why is this worldx and can i keep this as any other name 
            const tx = Math.floor(pointer.worldX/TILE);
            const ty = Math.floor(pointer.worldY /TILE)
            this.moveTo(tx,ty)
        })

        this.cameras.main.setBounds(0,0,worldWidth,worldHeight);
        //what is this 0.1 , 0. it is for the smooth animation for the camera
        this.cameras.main.startFollow(this.player , true ,0.1 , 0.1);

        this.cameras.main.setZoom(2);

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
    
        this.tileX = nextX;
        this.tileY = nextY;
        this.facing = dir;
        this.isMoving = true;
    
        this.player.anims.play("walk-" + dir, true); 
    
        this.tweens.add({
        targets: this.player,
        x: this.tileX * TILE + TILE / 2,
        y: this.tileY * TILE + TILE / 2,
        duration: 200,
        ease: "Linear",
        onComplete: () => {
            this.isMoving = false;
            this.player.anims.stop();                 
            this.player.setFrame(this.standingFrame(dir)); 
        },
        });
    }

    private standingFrame(dir:"down"|"up"|"left" | "right"){
        if(dir === "up") return 6;
        if(dir === "left") return 12;
        if(dir === "right") return 0;
        return 18;
    }


}