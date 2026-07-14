"use client"

import { useEffect , useRef } from "react";
import Phaser from "phaser";
import { ArenaScene } from "./scenes/arena-scene";
import type { RefObject } from "react";
import type { Others,Position,Reaction } from "../../hooks/use-space-socket";
import type { MapTemplateId } from "@repo/shared";

type PhaserGameProps ={
    mapTemplate?: MapTemplateId;
    othersRef?:RefObject<Others>;
    selfRef?:RefObject<Position>;
    moveRef?:RefObject<(next:Position) =>void>;
    // userId -> username, so the scene can show real names on pills
    namesRef?:RefObject<Record<string,string>>;
    // userIds currently near me (for fading far-away avatars)
    nearbyRef?:RefObject<Set<string>>;
    // recent emoji reactions to float above avatars
    reactionsRef?:RefObject<Reaction[]>;
    selfId?: string | null;
}

export function PhaserGame({mapTemplate = "classic-office",othersRef,selfRef,moveRef,namesRef,nearbyRef,reactionsRef,selfId}:PhaserGameProps){
    // what is his containe red and what is the use case of hte ref also 
    // explain me the use caseowhat does you mean why the phaserinside the div why ref so
    const containerRef = useRef<HTMLDivElement | null>(null);


    //why this i understand to delte the game i think that is not it is for like for what it is for and the use case like why only the ref like hte user geos from the browser so remvoe this and thne agina it come sthen
    const gameRef = useRef<Phaser.Game | null>(null);

    //why is this use effect used here first question do not tell me like for side effect i know that 
    useEffect(()=>{
        if(!containerRef.current) return;
        //what does this .cuurent means here
        if(gameRef.current) return;

        //what does this gameref all this block of the code does here
        gameRef.current = new Phaser.Game({
            type:Phaser.AUTO,
            parent:containerRef.current,
            width: "100%",
            height: "100%",
            backgroundColor:"#0b110d",
            pixelArt:true,
            scale:{
                mode:Phaser.Scale.RESIZE,
                autoCenter:Phaser.Scale.CENTER_BOTH
            },
            //what is this callback and what does this prebot with the game registry means
            callbacks:{
                preBoot:(game) =>{
                    game.registry.set("mapTemplate", mapTemplate);
                    game.registry.set("othersRef" , othersRef);
                    game.registry.set("selfRef", selfRef);
                    game.registry.set("moveRef" , moveRef);
                    game.registry.set("namesRef" , namesRef);
                    game.registry.set("nearbyRef" , nearbyRef);
                    game.registry.set("reactionsRef" , reactionsRef);
                    game.registry.set("selfId", selfId);
                },
            },
            
            scene:[ArenaScene]
        });

        return ()=>{
            gameRef.current?.destroy(true);
            gameRef.current = null
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[mapTemplate, othersRef, selfRef, moveRef, namesRef, nearbyRef, reactionsRef]);

    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.registry.set("selfId", selfId);
        }
    }, [selfId]);

    return <div ref ={containerRef} className="h-full w-full"/>



}
