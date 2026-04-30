import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "../lib/api";

const AppSessionContext = createContext(null);

export function AppSessionProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      if (!session?.accessToken) {
        setIsReady(true);
        return;
      }

      try {
        const { user } = await authApi.getMe(session.accessToken);

        if (cancelled) {
          return;
        }

        const nextSession = {
          ...session,
          user,
        };

        setSession(nextSession);
        setStoredSession(nextSession);
      } catch {
        if (!cancelled) {
          clearStoredSession();
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      accessToken: session?.accessToken || null,
      isAuthenticated: Boolean(session?.accessToken),
      isReady,
      saveAuthSession(payload) {
        const nextSession = {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
        };

        setSession(nextSession);
        setStoredSession(nextSession);
      },
      setUser(user) {
        setSession((current) => {
          if (!current) {
            return current;
          }

          const nextSession = {
            ...current,
            user,
          };

          setStoredSession(nextSession);
          return nextSession;
        });
      },
      async logout() {
        try {
          if (session?.accessToken) {
            await authApi.logout(session.accessToken);
          }
        } catch {
          // Ignore logout transport errors and clear the local session anyway.
        } finally {
          clearStoredSession();
          setSession(null);
        }
      },
    }),
    [isReady, session],
  );

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }

  return context;
}
