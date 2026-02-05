export const COLORS: Record<string, string> & {
  mention?: string;
  topic?: string;
  postLink?: string;
  link?: string;
};
export const SPACING: Record<string, number>;
export const SIZES: Record<string, number>;
export const LAYOUT: Record<string, number>;
export const HEADER: Record<string, number | string>;
export const MODAL: Record<string, number | string>;
export function toTailwind(): object;
export function toCssVars(): string;
