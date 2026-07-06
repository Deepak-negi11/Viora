import Phaser from "phaser";

const TILE = 40; //what does this mean in the simpler way to understand  i do understasn the tile  like where we use this for movement all where what does pixel per tile means

export class ArenaScene extends Phaser.Scene{
    //why this class why this then what does super means i forgot
    constructor(){
        super("arena")
    }
    create(){
        // what is this .scale here
        const width = this.scale.width;
        const height = this.scale.height
        //what does this do and what does it mean why draw the grid lines
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x262626,1);
        for (let x=0 ; x<= width;x+=TILE){
            grid.lineBetween(x,0,x,height);
        }
        for (let y = 0; y <= height; y += TILE) {
        grid.lineBetween(0, y, width, y); 
        }

        this.add.text(16,16,"Hello Phaser",{
            fontFamily:"sans-serif",
            fontSize:"20px",
            color:"#ffffff",
        });
        

    }
}