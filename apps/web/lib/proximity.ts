
export type Point ={ x:number , y:number};
export const PROXIMITY_RADIUS = 3;

//this takes a square zone around you 
export function tileApart(a:Point , b:Point):number{
    return Math.max(Math.abs(a.x - b.x) , Math.abs(a.y - b.y));
}

export function isNearby(a:Point , b:Point , radius = PROXIMITY_RADIUS){
    //what is this and this syntax <= radius
    return tileApart(a,b) <= radius;
}

