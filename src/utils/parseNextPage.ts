export function parseNextPage(nextUrl: string | null): number | null {
  if (!nextUrl) return null;

  try {
    const u = new URL(nextUrl);
    const page = u.searchParams.get('page');
    if (page) return Number(page);

    const offset = u.searchParams.get('offset');
    if (offset) {
      const limit = u.searchParams.get('limit');
      const limitNum = limit ? Number(limit) : null;
      if (limitNum && Number.isFinite(limitNum) && limitNum > 0) {
        return Math.floor(Number(offset) / limitNum);
      }
      return Number(offset);
    }

    return null;
  } catch {
    const m = nextUrl.match(/[?&]page=(\d+)/);
    if (m) return Number(m[1]);

    const offsetMatch = nextUrl.match(/[?&]offset=(\d+)/);
    const limitMatch = nextUrl.match(/[?&]limit=(\d+)/);
    if (offsetMatch) {
      const offset = Number(offsetMatch[1]);
      if (limitMatch) {
        const limit = Number(limitMatch[1]);
        return limit > 0 ? Math.floor(offset / limit) : offset;
      }
      return offset;
    }

    return null;
  }
}
