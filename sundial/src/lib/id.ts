import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 20);

/** Prefixed, sortable-enough, URL-safe IDs: cli_x9k2..., run_8fh3... */
export function createId(prefix: string): string {
  return `${prefix}_${nano()}`;
}
