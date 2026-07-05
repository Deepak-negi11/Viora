import Image from "next/image"
import Link from "next/link";
import { ModeToggle } from "./dark-mode";


export function Navbar() {
    return (
        //what is this sticky does and this top and the z- also 
        <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                <Link href = "/spaces" className="flex items-center gap-2">
                <Image src={"/logo.jpg"} alt="left" width={32} height={32} className="rounded" />
                <span className="text-sm font-semibold text-neutral-100"> 2D Metaverse</span>
                </Link> 
                    <nav className="flex items-center text-sm gap-4 text-neutral-400 ">
                        <a href="#features" className="hover:text-neutral-100">features</a>
                        <a href="/signin" className="hover:text-neutral-100" >signin</a>
                        <a href="https://github.com/Deepak-negi11/2D-Metaverse" className="hover:text-neutral-100">github</a>
                        <ModeToggle />
                    </nav>


            </div>

        </header>
    );
}