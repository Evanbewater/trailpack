import { type InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--line-subtle)] bg-white/70 px-3 py-2 text-sm text-paper backdrop-blur-sm placeholder:text-fog transition-colors duration-200 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 ${className}`}
      {...props}
    />
  );
}
