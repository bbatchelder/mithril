import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with `clsx` semantics, then dedupe conflicting Tailwind
 * utilities with `tailwind-merge`. The standard shadcn `cn` helper.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
