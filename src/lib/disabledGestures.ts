/**
 * Manage disabled built-in gestures via localStorage.
 * Disabled gestures are hidden from the library and skipped during detection.
 */

const STORAGE_KEY = "signspeak-disabled-gestures";

export function getDisabledGestures(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function disableGesture(name: string): void {
  const disabled = getDisabledGestures();
  if (!disabled.includes(name)) {
    disabled.push(name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disabled));
  }
}

export function enableGesture(name: string): void {
  const disabled = getDisabledGestures().filter((n) => n !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(disabled));
}

export function isGestureDisabled(name: string): boolean {
  return getDisabledGestures().includes(name);
}
