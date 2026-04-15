"use client";
import Cookie from "js-cookie";
import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const cookieStore = {
  get: Cookie.get,
  set: Cookie.set,
  subscribe: (callback: () => void): (() => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
export const useCookie = (name: string, initialValue?: string) =>
  useSyncExternalStore(
    cookieStore.subscribe,
    () => Cookie.get(name),
    () => initialValue,
  );
