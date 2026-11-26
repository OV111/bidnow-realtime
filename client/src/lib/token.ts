const KEY = 'bidnow.token';

function saveTokenFromUrl() {
  if (!import.meta.env.DEV) return null;
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('token');
  if (!fromUrl) return null;
  localStorage.setItem(KEY, fromUrl);
  url.searchParams.delete('token');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  return fromUrl;
}

export function getToken() {
  try {
    return saveTokenFromUrl() ?? localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

export function getUserIdFromToken(token: string | null) {
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
