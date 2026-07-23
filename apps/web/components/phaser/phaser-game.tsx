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

    namesRef?:RefObject<Record<string,string>>;

    nearbyRef?:RefObject<Set<string>>;

    reactionsRef?:RefObject<Reaction[]>;
    selfId?: string | null;
}

export function PhaserGame({mapTemplate = "classic-office",othersRef,selfRef,moveRef,namesRef,nearbyRef,reactionsRef,selfId}:PhaserGameProps){


    const containerRef = useRef<HTMLDivElement | null>(null);



    const gameRef = useRef<Phaser.Game | null>(null);


    useEffect(()=>{
        if(!containerRef.current) return;

        if(gameRef.current) return;


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

            callbacks:{
                preBoot:(game) =>{
                    game.registry.set("mapTemplate", mapTemplate);
                    game.registry.set("othersRef" , othersRef);
                    game.registry.set("selfRef", selfRef);
                    game.registry.set("moveRef" , moveRef);
                    game.registry.set("namesRef" , namesRef);
                    game.registry.set("nearbyRef" , nearbyRef);
                    game.registry.set("reactionsRef" , reactionsRef);
                },
            },

            scene:[ArenaScene]
        });

        return ()=>{
            gameRef.current?.destroy(true);
            gameRef.current = null
        };


    },[mapTemplate, othersRef, selfRef, moveRef, namesRef, nearbyRef, reactionsRef]);

    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.registry.set("selfId", selfId);
        }
    }, [selfId]);

    return <div ref ={containerRef} className="h-full w-full"/>



}
