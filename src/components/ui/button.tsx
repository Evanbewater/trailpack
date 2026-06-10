import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-golden text-canopy hover:bg-[var(--golden-light)] font-bold shadow-sm transition-colors duration-200 cursor-pointer",
  secondary:
    "glass-subtle text-paper hover:bg-white/80 border border-[var(--line-subtle)] shadow-sm transition-colors duration-200 cursor-pointer",
  ghost:
    "bg-transparent text-mist hover:bg-white/50 hover:text-paper transition-colors duration-200 cursor-pointer",
  danger:
    "bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 cursor-pointer",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
