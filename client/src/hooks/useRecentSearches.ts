import { useState, useCallback } from 'react';

export interface RecentSearch {
  destination: string;
  checkin: string;
  checkout: string;
  adults: number;
  savedAt: number;
}

const LS_KEY = 'staybook_recent_searches';
const MAX = 5;

function load(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as RecentSearch[];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>(load);

  const addSearch = useCallback((entry: Omit<RecentSearch, 'savedAt'>) => {
    setSearches((prev) => {
      const filtered = prev.filter((s) => s.destination.toLowerCase() !== entry.destination.toLowerCase());
      const next = [{ ...entry, savedAt: Date.now() }, ...filtered].slice(0, MAX);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { searches, addSearch };
}
