import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useUserAuth } from './UserAuthContext';

const WishlistCtx = createContext(null);

const LS_KEY = 'gb_wishlist';

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}

function writeLocal(slugs) {
  localStorage.setItem(LS_KEY, JSON.stringify(slugs));
}

function clearLocal() {
  localStorage.removeItem(LS_KEY);
}

export function WishlistProvider({ children }) {
  const { user } = useUserAuth();
  const [slugs, setSlugs] = useState([]);
  const prevUserId = useRef(null);

  useEffect(() => {
    if (user) {
      const localSlugs = readLocal();
      const justLoggedIn = prevUserId.current === null && localSlugs.length > 0;

      supabase
        .from('wishlists')
        .select('product_slug')
        .eq('user_id', user.id)
        .then(async ({ data, error }) => {
          if (error) return;
          const dbSlugs = data ? data.map(r => r.product_slug) : [];

          if (justLoggedIn) {
            // Merge guest wishlist into DB — upsert items not already saved
            const newSlugs = localSlugs.filter(s => !dbSlugs.includes(s));
            if (newSlugs.length > 0) {
              await supabase.from('wishlists').insert(
                newSlugs.map(s => ({ user_id: user.id, product_slug: s }))
              );
            }
            clearLocal();
            setSlugs([...new Set([...dbSlugs, ...localSlugs])]);
          } else {
            setSlugs(dbSlugs);
          }
        });
    } else {
      setSlugs(readLocal());
    }
    prevUserId.current = user?.id ?? null;
  }, [user?.id]);

  const toggle = useCallback(async (slug) => {
    const prev = slugs;
    const isIn = slugs.includes(slug);
    const next = isIn ? slugs.filter(s => s !== slug) : [...slugs, slug];
    setSlugs(next);

    try {
      if (user) {
        if (isIn) {
          const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_slug', slug);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_slug: slug });
          if (error) throw error;
        }
      } else {
        writeLocal(next);
      }
    } catch {
      setSlugs(prev);
      toast.error('Could not update wishlist');
    }
  }, [slugs, user]);

  const isWishlisted = useCallback((slug) => slugs.includes(slug), [slugs]);

  return (
    <WishlistCtx.Provider value={{ slugs, toggle, isWishlisted }}>
      {children}
    </WishlistCtx.Provider>
  );
}

export const useWishlist = () => useContext(WishlistCtx);
