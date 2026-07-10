"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";


type ButtonProps = {
  //what does this children does i think 
  children: ReactNode;
  variant?: ButtonVariant;
  //what is this && here does meaning of this button html attrbibute what does it does inthei 
} & ButtonHTMLAttributes<HTMLButtonElement>;

const base = "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none";

//ok so this are the vareint of the button what what type of the button thier will be in the ui

const variants: Record<ButtonVariant, string> = {
  primary: "bg-indigo-500 text-white shadow-sm shadow-indigo-950/40 hover:bg-indigo-400 active:bg-indigo-600",
  secondary: "border border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-800 active:bg-neutral-900",
  ghost: "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 active:bg-neutral-900",
  danger: "bg-red-500 text-white shadow-sm shadow-red-950/30 hover:bg-red-400 active:bg-red-600",
}

export function Button({
  children,
  variant = "primary",
  className,
  //what i this ...rest what does it does like 
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
