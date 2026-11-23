import { createAuthClient } from 'better-auth/react';
import { User as UserType } from '../types';
import { isSuperAdminEmail } from '../constants/adminConfig';
import {
  auth as firebaseAuth,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithFirebaseGoogle,
  signOutFirebase,
  type FirebaseUser
} from './firebase';

const API_BASE = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const TOKEN_STORAGE_KEY = 'elora-ba-token';

export const buildAuthUrl = (path: string) => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${clean}` : clean;
};

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function dispatchAuthChanged(user: UserType | null = null) {
  try {
    window.dispatchEvent(new CustomEvent('elora-auth-changed', { detail: user }));
  } catch {}
}

const resolvedBaseUrl =
  API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const betterAuthReact = createAuthClient({
  baseURL: resolvedBaseUrl,
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
    auth: {
      type: 'Bearer',
      token: () => getStoredToken() || ''
    },
    onResponse: async (ctx) => {
      const headerToken = ctx.response.headers.get('set-auth-token');
      if (headerToken) {
        setStoredToken(headerToken);
      }
    }
  }
});

async function parseJsonSafe<T = any>(response: Response): Promise<T> {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const raw = await response.text();
  if (contentType.includes('text/html') || raw.includes('<!DOCTYPE html>')) {
    throw new Error(`Authentication server returned HTML (${response.status}) instead of JSON.`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Invalid JSON response (${response.status})`);
  }
}

export interface BetterAuthSession {
  token: string;
  expiresAt: string;
  provider?: string;
}

export interface BetterAuthResponse {
  user: UserType | null;
  session?: BetterAuthSession | null;
  token?: string;
  error?: string;
  message?: string;
}

function buildUserFromFirebase(fbUser: FirebaseUser): UserType {
  const cleanEmail = String(fbUser.email || '').trim().toLowerCase();
  const isAdmin = isSuperAdminEmail(cleanEmail);
  return {
    id: fbUser.uid,
    name: fbUser.displayName || (cleanEmail ? cleanEmail.split('@')[0] : 'Member'),
    username: cleanEmail ? cleanEmail.split('@')[0] : fbUser.uid.slice(0, 10),
    email: cleanEmail,
    phone: fbUser.phoneNumber || '',
    avatar:
      fbUser.photoURL ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail || fbUser.uid)}`,
    role: isAdmin ? 'admin' : 'user',
    ...(isAdmin ? { adminRoleName: 'Super Admin', permissions: ['*'] } : {}),
    addresses: []
  };
}

function waitForFirebaseAuthUser(timeoutMs = 1800): Promise<FirebaseUser | null> {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser);
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsub();
        resolve(firebaseAuth.currentUser);
      }
    }, timeoutMs);
    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        unsub();
        resolve(fbUser);
      }
    });
  });
}

export const authClient = {
  react: betterAuthReact,

  async getProviders(): Promise<{ emailAndPassword: boolean; google: boolean; firebaseGoogle?: boolean }> {
    try {
      const res = await fetch(buildAuthUrl('/api/auth/providers'), {
        credentials: 'include'
      });
      if (!res.ok) {
        return {
          emailAndPassword: true,
          google: isFirebaseConfigured,
          firebaseGoogle: isFirebaseConfigured
        };
      }
      const data = await parseJsonSafe<any>(res);
      return {
        emailAndPassword: data?.emailAndPassword !== false,
        google: Boolean(data?.google) || isFirebaseConfigured,
        firebaseGoogle: Boolean(data?.firebaseGoogle) || isFirebaseConfigured
      };
    } catch {
      return {
        emailAndPassword: true,
        google: isFirebaseConfigured,
        firebaseGoogle: isFirebaseConfigured
      };
    }
  },

  async getSession(): Promise<BetterAuthResponse> {
    try {
      const res = await fetch(buildAuthUrl('/api/auth/get-session'), {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders()
      });

      let sessionUser: UserType | null = null;
      let sessionObj: BetterAuthSession | null = null;

      if (res.ok) {
        const data = await parseJsonSafe<BetterAuthResponse>(res);
        if (data?.session?.token) {
          setStoredToken(data.session.token);
        }
        if (data?.user) {
          sessionUser = data.user;
          sessionObj = data.session || null;
        }
      }

      // If Better Auth cookie session wasn't returned, validate stored Bearer token via /api/auth/profile
      if (!sessionUser && getStoredToken()) {
        try {
          const profRes = await fetch(buildAuthUrl('/api/auth/profile'), {
            method: 'GET',
            credentials: 'include',
            headers: authHeaders()
          });
          if (profRes.ok) {
            const profData = await parseJsonSafe<any>(profRes);
            if (profData?.user) {
              return {
                user: profData.user as UserType,
                session: {
                  token: getStoredToken() || '',
                  expiresAt: '',
                  provider: profData.user.authProvider || 'firebase-google'
                }
              };
            }
          } else if (profRes.status === 401 || profRes.status === 403) {
            setStoredToken(null);
          }
        } catch {}
      }

      if (!sessionUser) {
        // Static Firebase Hosting mode fallback: hydrate directly from active Firebase Auth user
        const fbUser = await waitForFirebaseAuthUser();
        if (fbUser?.email) {
          const fallbackUser = buildUserFromFirebase(fbUser);
          const idToken = await fbUser.getIdToken().catch(() => '');
          return {
            user: fallbackUser,
            session: {
              token: idToken,
              expiresAt: '',
              provider: 'firebase-google'
            }
          };
        }
        return { user: null, session: null };
      }

      // Enrich Better Auth user with stored addresses & profile details
      let fullUser: UserType = sessionUser;
      try {
        const profRes = await fetch(buildAuthUrl('/api/auth/profile'), {
          method: 'GET',
          credentials: 'include',
          headers: authHeaders()
        });
        if (profRes.ok) {
          const profData = await parseJsonSafe<any>(profRes);
          if (profData?.user) fullUser = { ...sessionUser, ...profData.user };
        }
      } catch {}

      return {
        user: fullUser,
        session: sessionObj
      };
    } catch {
      const fbUser = await waitForFirebaseAuthUser().catch(() => null);
      if (fbUser?.email) {
        return {
          user: buildUserFromFirebase(fbUser),
          session: { token: '', expiresAt: '', provider: 'firebase-google' }
        };
      }
      return { user: null, session: null };
    }
  },

  async signUpEmail(payload: {
    name: string;
    username?: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<BetterAuthResponse> {
    const res = await fetch(buildAuthUrl('/api/auth/sign-up/email'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const setTokenHeader = res.headers.get('set-auth-token');
    const data = await parseJsonSafe<BetterAuthResponse>(res);
    if (!res.ok || !data?.user) {
      throw new Error(data?.message || data?.error || 'Could not create account.');
    }
    const token = data.token || setTokenHeader || data.session?.token || null;
    if (token) setStoredToken(token);
    dispatchAuthChanged(data.user);
    return { ...data, token: token || undefined };
  },

  async signInEmail(payload: { email: string; password: string }): Promise<BetterAuthResponse> {
    const res = await fetch(buildAuthUrl('/api/auth/sign-in/email'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const setTokenHeader = res.headers.get('set-auth-token');
    const data = await parseJsonSafe<BetterAuthResponse>(res);
    if (!res.ok || !data?.user) {
      throw new Error(data?.message || data?.error || 'Invalid email or password.');
    }
    const token = data.token || setTokenHeader || data.session?.token || null;
    if (token) setStoredToken(token);

    let fullUser = data.user;
    try {
      const profRes = await fetch(buildAuthUrl('/api/auth/profile'), {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders()
      });
      if (profRes.ok) {
        const profData = await parseJsonSafe<any>(profRes);
        if (profData?.user) fullUser = { ...data.user, ...profData.user };
      }
    } catch {}

    dispatchAuthChanged(fullUser);
    return { ...data, user: fullUser, token: token || undefined };
  },

  async signInSocialGoogle(callbackURL: string = '/'): Promise<BetterAuthResponse> {
    if (isFirebaseConfigured) {
      const { firebaseUser, idToken } = await signInWithFirebaseGoogle();
      try {
        const res = await fetch(buildAuthUrl('/api/auth/firebase-google'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        const isJsonBackend = contentType.includes('application/json');

        // On pure static Firebase Hosting (no Express backend mounted), /api/* rewrites to index.html
        if (!isJsonBackend || res.status === 404 || res.status === 405) {
          const fbFallbackUser = buildUserFromFirebase(firebaseUser);
          dispatchAuthChanged(fbFallbackUser);
          return {
            user: fbFallbackUser,
            token: idToken,
            session: { token: idToken, expiresAt: '', provider: 'firebase-google' }
          };
        }

        const setTokenHeader = res.headers.get('set-auth-token');
        const data = await parseJsonSafe<BetterAuthResponse>(res);
        if (!res.ok || !data?.user) {
          throw new Error(data?.message || data?.error || 'Could not complete Google Sign-In.');
        }
        const token = data.token || setTokenHeader || data.session?.token || null;
        if (token) setStoredToken(token);

        let fullUser = data.user;
        try {
          const profRes = await fetch(buildAuthUrl('/api/auth/profile'), {
            method: 'GET',
            credentials: 'include',
            headers: authHeaders()
          });
          if (profRes.ok) {
            const profData = await parseJsonSafe<any>(profRes);
            if (profData?.user) fullUser = { ...data.user, ...profData.user };
          }
        } catch {}

        dispatchAuthChanged(fullUser);
        return { ...data, user: fullUser, token: token || undefined };
      } catch (err: any) {
        const msg = String(err?.message || '');
        const isBackendUnavailable =
          msg.includes('HTML') ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('Load failed');
        if (isBackendUnavailable) {
          const fbFallbackUser = buildUserFromFirebase(firebaseUser);
          dispatchAuthChanged(fbFallbackUser);
          return {
            user: fbFallbackUser,
            token: idToken,
            session: { token: idToken, expiresAt: '', provider: 'firebase-google' }
          };
        }
        throw err;
      }
    }

    await betterAuthReact.signIn.social({
      provider: 'google',
      callbackURL
    });
    return { user: null, session: null };
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    const res = await fetch(buildAuthUrl('/api/auth/forgot-password'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await parseJsonSafe<any>(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Could not initiate password recovery.');
    }
    return true;
  },

  async signOut(): Promise<void> {
    const headers = authHeaders();
    setStoredToken(null);
    await signOutFirebase();
    await Promise.allSettled([
      fetch(buildAuthUrl('/api/auth/firebase-sign-out'), {
        method: 'POST',
        credentials: 'include',
        headers
      }),
      fetch(buildAuthUrl('/api/auth/sign-out'), {
        method: 'POST',
        credentials: 'include',
        headers
      })
    ]);
    dispatchAuthChanged(null);
  },

  getStoredToken
};
