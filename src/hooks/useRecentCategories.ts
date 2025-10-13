import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_RECENT = 6;

export function useRecentCategories() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const loadRecent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const key = `recent_categories_${user?.id ?? 'anon'}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setRecent(JSON.parse(stored));
        } catch {
          setRecent([]);
        }
      }
    };
    loadRecent();
  }, []);

  const addRecent = async (categoryName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const key = `recent_categories_${user?.id ?? 'anon'}`;
    
    const updated = [categoryName, ...recent.filter(c => c !== categoryName)].slice(0, MAX_RECENT);
    setRecent(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  return { recent, addRecent };
}
