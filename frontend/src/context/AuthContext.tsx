'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshToken: async () => {},
});

function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('aarogya_token=') || document.cookie.includes('portal_role=');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (hasSessionCookie()) {
      return { uid: 'session_cookie_user', email: '' } as User;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const clearAllSessionData = useCallback(async () => {
    // 1. Clear Firebase Auth
    try { await signOut(auth); } catch {}
    
    // 2. Clear API Cache/Session (if we add server-side logout in the future)
    try { await authApi.logout(); } catch {}
    
    // 3. Clear Local and Session Storage
    localStorage.clear();
    sessionStorage.clear();

    // 4. Clear all known cookies manually
    const cookiesToClear = [
      'aarogya_token', 'portal_role', 'user_name', 'user_role', 
      'hospital_id', 'hospital_name', 'hospital_taluka',
      'dhic_district', 'gov_department'
    ];
    
    cookiesToClear.forEach(cookie => {
      document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax;`;
    });
  }, []);

  const handleLogout = useCallback(async (isSessionExpired = false) => {
    setLoading(true);
    await clearAllSessionData();
    setLoading(false);
    
    // Determine if current route is public
    const publicRoutes = ['/', '/login', '/citizen/search', '/citizen/nearby'];
    const isPublic = publicRoutes.some(route => window.location.pathname === route || window.location.pathname.startsWith(route + '/'));

    if (isSessionExpired) {
        window.location.href = '/login?expired=true';
    } else if (isPublic) {
        window.location.reload();
    } else {
        window.location.href = '/login';
    }
  }, [clearAllSessionData]);

  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken(true);
            document.cookie = `aarogya_token=${token}; path=/; max-age=86400; SameSite=Lax;`;
        } catch (error) {
            console.error("Token refresh failed, ending session", error);
            handleLogout(true);
        }
    }
  }, [handleLogout]);

  useEffect(() => {
    let unsubscribe: () => void;
    let isMounted = true;
    let nullUserTimer: ReturnType<typeof setTimeout> | null = null;

    // Safety fallback: Ensure loading is ALWAYS set to false after 1.5s max
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.log("[AUTH CONTEXT] Safety timeout reached — ensuring loading state resolves.");
        if (hasSessionCookie() && !user) {
          setUser({ uid: 'session_cookie_user', email: '' } as User);
        }
        setLoading(false);
      }
    }, 1500);

    const setupAuthListener = async () => {
      console.log("[AUTH CONTEXT] Initializing AuthListener...");
      
      try {
        console.log("[AUTH CONTEXT] Waiting for authStateReady...");
        // 1-second timeout race to prevent indefinite hang if Firebase JS SDK is delayed
        await Promise.race([
          auth.authStateReady(),
          new Promise((resolve) => setTimeout(resolve, 1000))
        ]);
        console.log("[AUTH CONTEXT] authStateReady check completed!");
      } catch (err) {
        console.error("[AUTH CONTEXT] authStateReady failed!", err);
      }

      if (!isMounted) return;

      unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
        console.log("[AUTH CONTEXT] onIdTokenChanged fired. User:", currentUser ? currentUser.uid : "null");
        
        if (nullUserTimer) {
          clearTimeout(nullUserTimer);
          nullUserTimer = null;
        }

        if (currentUser) {
          try {
            const token = await currentUser.getIdToken();
            document.cookie = `aarogya_token=${token}; path=/; max-age=86400; SameSite=Lax;`;
            sessionStorage.removeItem('aarogya_login_in_progress');
            if (isMounted) setUser(currentUser);
          } catch (err) {
            console.error("[AUTH CONTEXT] Error getting ID token", err);
          }
          if (isMounted) setLoading(false);
        } else {
          nullUserTimer = setTimeout(async () => {
            if (!isMounted) return;
            
            const loginInProgress = sessionStorage.getItem('aarogya_login_in_progress');
            const sessionCookieExists = hasSessionCookie();

            if (loginInProgress === 'true' || sessionCookieExists) {
              console.log("[AUTH CONTEXT] Session cookies or login-in-progress detected — maintaining session.");
              sessionStorage.removeItem('aarogya_login_in_progress');
              if (sessionCookieExists && isMounted) {
                setUser({ uid: 'session_cookie_user', email: '' } as User);
              }
              setLoading(false);
              return;
            }
            
            console.log("[AUTH CONTEXT] No user & no session cookie after debounce. Clearing session.");
            setUser(null);
            
            const isProtected = ['/hospital', '/dhic', '/government', '/citizen']
              .some(prefix => pathname.startsWith(prefix));
            const isPublicException = pathname.startsWith('/citizen/search') || 
                                      pathname.startsWith('/citizen/nearby');
            
            if (isProtected && !isPublicException) {
              await clearAllSessionData();
              window.location.href = '/login';
            }
            setLoading(false);
          }, 1000);
        }
      });
    };

    setupAuthListener().catch((err) => {
       console.error("[AUTH CONTEXT] setupAuthListener encountered an error:", err);
       if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (nullUserTimer) clearTimeout(nullUserTimer);
      if (unsubscribe) unsubscribe();
    };
  }, [handleLogout, clearAllSessionData, pathname, user]);

  // Periodic token refresh (Firebase does it automatically, but this ensures our cookie stays alive)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshToken();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
