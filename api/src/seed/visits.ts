/**
 * An hour of browsing, generated deterministically: a fixed PRNG seed walks the real link graph,
 * so the same command always produces the same history. Walks behave like a person with one tab:
 * they follow links, hit dead ends, go back, search, and come back to favourites.
 */
export interface SeedVisit {
  seedKey: string;
  personId: string;
  address: string;
  via: 'typed' | 'link' | 'search' | 'back' | 'history' | 'directory';
  from: string | null;
  at: Date;
}

/** 2026-11-03 09:00 UTC — the hour everyone was online. */
export const SEED_HOUR_START = new Date('2026-11-03T09:00:00.000Z');

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Session {
  personId: string;
  /** Minutes after the start of the hour. */
  startMin: number;
  steps: number;
  entry: { address: string; via: 'typed' | 'search' | 'directory' | 'history'; query?: string };
  /** Prefer links not yet visited — the person who has been nearly everywhere. */
  explorer?: boolean;
  backChance?: number;
}

const SESSIONS: Session[] = [
  { personId: 'dolores', startMin: 0, steps: 16, entry: { address: 'maps.zz', via: 'typed' }, explorer: true },
  { personId: 'ada', startMin: 2, steps: 4, entry: { address: 'tidepool.zz', via: 'typed' } },
  { personId: 'bashir', startMin: 4, steps: 5, entry: { address: 'nightsky.zz', via: 'search', query: 'moon tides' } },
  { personId: 'chen', startMin: 6, steps: 18, entry: { address: 'sourdough.zz', via: 'typed' }, backChance: 0.08 },
  { personId: 'marisol', startMin: 9, steps: 3, entry: { address: 'tidepool.zz', via: 'typed' } },
  { personId: 'emeka', startMin: 11, steps: 4, entry: { address: 'trickster.zz', via: 'typed' } },
  { personId: 'priya', startMin: 14, steps: 3, entry: { address: 'moths.zz', via: 'typed' } },
  { personId: 'oskar', startMin: 17, steps: 4, entry: { address: 'lighthouse.zz', via: 'typed' } },
  { personId: 'ada', startMin: 21, steps: 5, entry: { address: 'tidepool.zz', via: 'history' } },
  { personId: 'dolores', startMin: 24, steps: 16, entry: { address: 'sourdough.zz', via: 'search', query: 'rye bread starter' }, explorer: true },
  { personId: 'emeka', startMin: 28, steps: 6, entry: { address: 'bike-repair.zz', via: 'search', query: 'puncture' } },
  { personId: 'wen', startMin: 31, steps: 3, entry: { address: 'tea.zz', via: 'typed' } },
  { personId: 'bashir', startMin: 34, steps: 6, entry: { address: 'foghorn.zz', via: 'directory' } },
  { personId: 'tobias', startMin: 37, steps: 4, entry: { address: 'garden.zz', via: 'typed' } },
  { personId: 'chen', startMin: 40, steps: 6, entry: { address: 'kelp.zz', via: 'search', query: 'kelp forest otters' } },
  { personId: 'dolores', startMin: 43, steps: 14, entry: { address: 'trickster.zz', via: 'directory' }, explorer: true },
  { personId: 'lena', startMin: 46, steps: 3, entry: { address: 'maps.zz', via: 'typed' } },
  { personId: 'ada', startMin: 49, steps: 3, entry: { address: 'tidepool.zz', via: 'typed' } },
  { personId: 'marisol', startMin: 52, steps: 2, entry: { address: 'kelp.zz', via: 'typed' } },
  { personId: 'emeka', startMin: 54, steps: 3, entry: { address: 'nightsky.zz', via: 'search', query: 'planets' } },
];

export function generateVisits(graph: Map<string, string[]>): SeedVisit[] {
  const rand = mulberry32(20261103);
  const visits: Omit<SeedVisit, 'seedKey'>[] = [];
  const seenBy = new Map<string, Set<string>>();
  const hourEnd = SEED_HOUR_START.getTime() + 60 * 60 * 1000;

  for (const s of SESSIONS) {
    const seen = seenBy.get(s.personId) ?? new Set<string>();
    seenBy.set(s.personId, seen);
    let t = SEED_HOUR_START.getTime() + s.startMin * 60_000 + Math.floor(rand() * 40_000);
    const stack: string[] = [];
    const add = (address: string, via: SeedVisit['via'], from: string | null) => {
      if (t >= hourEnd) return false;
      visits.push({ personId: s.personId, address, via, from, at: new Date(t) });
      seen.add(address);
      t += 15_000 + Math.floor(rand() * 75_000);
      return true;
    };

    const entryFrom = s.entry.via === 'search' ? `about:search?q=${encodeURIComponent(s.entry.query ?? '')}`
      : s.entry.via === 'history' ? 'about:history'
      : s.entry.via === 'directory' ? 'about:start'
      : null;
    if (!add(s.entry.address, s.entry.via, entryFrom)) continue;
    stack.push(s.entry.address);

    for (let i = 0; i < s.steps; i++) {
      const here = stack[stack.length - 1];
      const links = graph.get(here);
      const isNowhere = links === undefined;
      const wantBack = stack.length > 1 && (isNowhere || rand() < (s.backChance ?? 0.18));
      if (wantBack || !links || links.length === 0) {
        if (stack.length < 2) break;
        stack.pop();
        if (!add(stack[stack.length - 1], 'back', here)) break;
        continue;
      }
      let choices = links;
      if (s.explorer) {
        const fresh = links.filter((l) => !seen.has(l));
        if (fresh.length) choices = fresh;
      }
      const next = choices[Math.floor(rand() * choices.length)];
      if (!add(next, 'link', here)) break;
      stack.push(next);
    }
  }

  visits.sort((a, b) => a.at.getTime() - b.at.getTime() || a.personId.localeCompare(b.personId));
  return visits.map((v, i) => ({ ...v, seedKey: `seed-${String(i).padStart(4, '0')}` }));
}

