/**
 * Addresses are the only thing a reader types and the only thing an author can link to.
 *
 * Shape: one or more DNS-style labels ending in the `.zz` top-level label, e.g. `tidepool.zz`,
 * `notes.marisol.zz`. A single site lives at a single address; there are no paths.
 *
 * Kept byte-for-byte in sync with web/lib/address.ts — both halves must agree on what an
 * address is, or a link could be followable in one and not the other.
 */
export const TLD = 'zz';

const ADDRESS_RE = /^(?=.{4,64}$)(?:[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?\.)+zz$/;

/** Forgiving cleanup of what a person typed or an author wrote in an href. */
export function normalizeAddress(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^(?:zz|web):\/\//, '')
    .replace(/\/+$/, '');
}

export function isAddress(candidate: string): boolean {
  return ADDRESS_RE.test(candidate);
}

