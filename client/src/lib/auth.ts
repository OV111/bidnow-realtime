const KEY = 'bidnow.token';

export function getToken(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('token');
    if (fromUrl) localStorage.setItem(KEY, fromUrl);
    return fromUrl ?? localStorage.getItem(KEY);
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
