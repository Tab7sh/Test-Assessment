/**
 * Kept in sync with api/src/common/address.ts — both halves must agree on what an address is.
 */
export const TLD = 'zz';

const ADDRESS_RE = /^(?=.{4,64}$)(?:[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?\.)+zz$/;

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

