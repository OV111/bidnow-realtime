const KEY = 'bidnow.token';

// DEV ONLY: lets you open /auctions/a-1?token=<jwt> to log in as a mock user without a login page.
// In production the token comes from the auth flow (ideally an HttpOnly cookie), never from the URL:
// URL tokens leak through history, server logs, referrers and copied links.
function takeTokenFromUrl(): string | null {
  if (!import.meta.env.DEV) return null;
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('token');
  if (!fromUrl) return null;
  localStorage.setItem(KEY, fromUrl);
  // Remove it from the address bar so it does not stay in history or get shared.
  url.searchParams.delete('token');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  return fromUrl;
}

export function getToken(): string | null {
  try {
    return takeTokenFromUrl() ?? localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    return;
  }
}

export function getUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1] ?? '';
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
