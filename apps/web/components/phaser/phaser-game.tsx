"use client"

import { useEffect , useRef } from "react";
import Phaser from "phaser";
import { ArenaScene } from "./scenes/arena-scene";
import type { RefObject } from "react";
import type { Others,Position } from "../../hooks/use-space-socket";

type PhaserGameProps ={
    othersRef?:RefObject<Others>;
    moveRef?:RefObject<(next:Position) =>void>;
    // userId -> username, so the scene can show real names on pills
    namesRef?:RefObject<Record<string,string>>;
    // userIds currently near me (for fading far-away avatars)
    nearbyRef?:RefObject<Set<string>>;
}

export function PhaserGame({othersRef,moveRef,namesRef,nearbyRef}:PhaserGameProps){
    // what is his containe red and what is the use case of hte ref also 
    // explain me the use caseowhat does you mean why the phaserinside the div why ref so
    const containerRef = useRef<HTMLDivElement | null>(null);


    //why this i understand to delte the game i think that is not it is for like for what it is for and the use case like why only the ref like hte user geos from the browser so remvoe this and thne agina it come sthen
    const gameRef = useRef<Phaser.Game | null>(null);

    //why is this use effect used here first question do not tell me like for side effect i know that 
    useEffect(()=>{
        if(!containerRef) return;
        //what does this .cuurent means here
        if(gameRef.current) return;

        //what does this gameref all this block of the code does here
        gameRef.current = new Phaser.Game({
            type:Phaser.AUTO,
            parent:containerRef.current,
            backgroundColor:"#0e0e16",
            pixelArt:true,
            scale:{
                mode:Phaser.Scale.RESIZE
            },
            //what is this callback and what does this prebot with the game registry means
            callbacks:{
                preBoot:(game) =>{
                    game.registry.set("othersRef" , othersRef);
                    game.registry.set("moveRef" , moveRef);
                    game.registry.set("namesRef" , namesRef);
                    game.registry.set("nearbyRef" , nearbyRef);
                },
            },
            
            scene:[ArenaScene]
        });

        return ()=>{
            gameRef.current?.destroy(true);
            gameRef.current = null
        };

    },[othersRef, moveRef, namesRef, nearbyRef]);
    return <div ref ={containerRef} className="h-full w-full"/>



}