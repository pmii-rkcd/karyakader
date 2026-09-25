'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
export function useBrowserLocation() {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => '');
}
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
