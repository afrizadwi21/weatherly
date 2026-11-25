"use client";

import { useSyncExternalStore } from "react";

export interface WeatherlyUserSession {
  id: string;
  email: string;
  name: string;
  savedLocations: string[];
  notificationsEnabled: Record<string, boolean>;
  savedAIInsights: string[];
  savedRoutes: string[];
}

const STORAGE_KEY = "weatherly_session_v1";
const SESSION_EVENT = "weatherly-session-change";

let cachedRaw: string | null = null;
let cachedSession: WeatherlyUserSession | null = null;

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function getStoredSession(): WeatherlyUserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedSession = null;
      return null;
    }
    if (raw === cachedRaw && cachedSession) {
      return cachedSession;
    }
    const parsed = JSON.parse(raw) as WeatherlyUserSession;
    if (!parsed.id) {
      parsed.id = `usr-${Date.now()}`;
    }
    cachedRaw = raw;
    cachedSession = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: WeatherlyUserSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      cachedRaw = null;
      cachedSession = null;
    } else {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(STORAGE_KEY, raw);
      cachedRaw = raw;
      cachedSession = session;
    }
  } catch {
    /* ignore storage error */
  }
  notify();
}

export function signInWithEmail(email: string, name?: string, id?: string): WeatherlyUserSession {
  const cleanEmail = email.trim().toLowerCase();
  const derivedName =
    name?.trim() ||
    cleanEmail
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const session: WeatherlyUserSession = {
    id: id || `usr-${Date.now()}`,
    email: cleanEmail,
    name: derivedName,
    savedLocations: [],
    notificationsEnabled: {},
    savedAIInsights: [],
    savedRoutes: [],
  };
  setStoredSession(session);
  return session;
}

export function signOutSession() {
  setStoredSession(null);
}

export function toggleFavoriteLocation(locId: string) {
  const current = getStoredSession();
  if (!current) return;
  const exists = current.savedLocations.includes(locId);
  const nextLocations = exists
    ? current.savedLocations.filter((id) => id !== locId)
    : [...current.savedLocations, locId];
  const nextNotifs = { ...current.notificationsEnabled };
  if (!exists) {
    nextNotifs[locId] = true;
  }
  setStoredSession({
    ...current,
    savedLocations: nextLocations,
    notificationsEnabled: nextNotifs,
  });
}

export function toggleLocationNotification(locId: string) {
  const current = getStoredSession();
  if (!current) return;
  const nextState = !current.notificationsEnabled[locId];
  setStoredSession({
    ...current,
    notificationsEnabled: {
      ...current.notificationsEnabled,
      [locId]: nextState,
    },
  });
}

export function toggleSavedAIInsight(questionId: string) {
  const current = getStoredSession();
  if (!current) return;
  const exists = current.savedAIInsights.includes(questionId);
  const nextSaved = exists
    ? current.savedAIInsights.filter((id) => id !== questionId)
    : [...current.savedAIInsights, questionId];
  setStoredSession({
    ...current,
    savedAIInsights: nextSaved,
  });
}

export function toggleSavedRoute(routeId: string) {
  const current = getStoredSession();
  if (!current) return;
  const exists = current.savedRoutes.includes(routeId);
  const nextRoutes = exists
    ? current.savedRoutes.filter((id) => id !== routeId)
    : [...current.savedRoutes, routeId];
  setStoredSession({
    ...current,
    savedRoutes: nextRoutes,
  });
}

function subscribeSession(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(SESSION_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(SESSION_EVENT, handler);
  };
}

export function useWeatherlySession(): WeatherlyUserSession | null {
  return useSyncExternalStore(subscribeSession, getStoredSession, () => null);
}
