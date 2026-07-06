import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


//what is a class value and why it is arrary here 
//clsx is used to join the classes names and drops the false ones
export function cn(...inputs: ClassValue[]) {
    //clsx(inputs) it turns everything in a plain string
    //twMerge — resolves Tailwind conflicts, keeping the last.
    return twMerge(clsx(inputs))
}
