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

const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-neutral-400/60 disabled:opacity-50 disabled:pointer-events-none";

//ok so this are the vareint of the button what what type of the button thier will be in the ui

const variants: Record<ButtonVariant, string> = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-400",
  secondary: "border border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-800",
  ghost: "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 ",
  danger: "bg-red-600 text-white hover:bg-red-500",
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