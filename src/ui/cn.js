/** Joins class names, skipping falsy ones: cn("p-4", active && "bg-brand"). */
export const cn = (...parts) => parts.flat().filter(Boolean).join(" ");
