export const AUTH_TOKEN_KEY = "ecourt_token";
export const AUTH_USER_KEY = "ecourt_user";

export function saveSession(token, user) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getDefaultRouteForRole(role) {
  if (role === "judge") return "/judge-panel";
  return "/dashboard";
}
