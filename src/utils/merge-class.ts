import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatString = (str: string) => {
    return str.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}
