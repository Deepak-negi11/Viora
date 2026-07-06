import type { ReactNode } from "react";
import { cn } from "./cn"


// first question come to my mind is that why it is not same as the button i think we can make it similar to the button like the different different variants

type CardProps = {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    //why we even do this like bg-blue-900/50 like i know it means the 50 percent opacity which mena the colour will come light then why not use the light colour only */}
    // why border red or other border are not applying this reason behind that also */}
    <div className={cn("rounded-2xl border border-neutral-800 bg-neutral-900 p-6", className)}>
      {children}

    </div>
  )
}