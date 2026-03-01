const mockEventsKey = "cmms.mock.events";
const mockEventsVersionKey = "cmms.mock.events.version";
const mockSessionKey = "cmms.mock.session";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function readLocalStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const storageKeys = {
  mockEventsKey,
  mockEventsVersionKey,
  mockSessionKey
};
