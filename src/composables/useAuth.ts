// src/composables/useAuth.ts
import { createGlobalState } from '@vueuse/core';
import { ref, computed } from 'vue';
import axios from 'axios';
import { useNotifications } from './useNotifications';

export interface User {
  countryId: null
  createdAt: string
  email: string
  id: number
  roles: string[]
  statusId: number
  updatedAt: string
  username: string
  fullName?: string
  telefono?: string
  ciudad?: string
  zona?: string
  documento?: string
  sedeId?: number | null
  sedeName?: string | null
  avatar?: string | null
  isViewingAsSede?: boolean
  viewAsSedeId?: number | null
  viewAsSedeName?: string | null
}

const PENDING_LOGOUT_KEY = 'pendingLogoutTokens';
const LOGOUT_MAX_ATTEMPTS = 3;
const LOGOUT_RETRY_DELAY_MS = 700;

const getApiBase = () => import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readPendingLogoutTokens = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_LOGOUT_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const writePendingLogoutTokens = (tokens: string[]) => {
  if (tokens.length) {
    localStorage.setItem(PENDING_LOGOUT_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(PENDING_LOGOUT_KEY);
  }
};

// Intenta revocar un token en el backend (incrementa tokenVersion). Devuelve
// true si quedó revocado o si un 401 confirma que ya estaba invalidado.
const revokeToken = async (authToken: string): Promise<boolean> => {
  const base = getApiBase();
  for (let attempt = 1; attempt <= LOGOUT_MAX_ATTEMPTS; attempt++) {
    try {
      await axios.post(`${base}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401) return true;
      if (attempt < LOGOUT_MAX_ATTEMPTS) await sleep(LOGOUT_RETRY_DELAY_MS * attempt);
    }
  }
  return false;
};

// Reintenta revocar tokens de logouts previos que no se pudieron confirmar
// por fallas de red (p. ej. el usuario cerró sesión estando offline).
const flushPendingLogouts = async () => {
  const pending = readPendingLogoutTokens();
  if (!pending.length) return;

  const stillPending: string[] = [];
  for (const pendingToken of pending) {
    const revoked = await revokeToken(pendingToken);
    if (!revoked) stillPending.push(pendingToken);
  }
  writePendingLogoutTokens(stillPending);
};

flushPendingLogouts();

export const useAuth = createGlobalState(() => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const storedToken = localStorage.getItem('authToken');
  const storedRefreshToken = localStorage.getItem('refreshToken');
  const storedUser = localStorage.getItem('userData');

  if (storedToken && storedUser) {
    token.value = storedToken;
    refreshToken.value = storedRefreshToken;
    user.value = JSON.parse(storedUser);
  }

  const isAuthenticated = computed(() => !!token.value);

  const login = (userData: User, authToken: string, refreshTokenValue: string) => {
    user.value = userData;
    token.value = authToken;
    refreshToken.value = refreshTokenValue;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('refreshToken', refreshTokenValue);
    localStorage.setItem('userData', JSON.stringify(userData));
    flushPendingLogouts();
  };

  // Actualiza solo los tokens tras un refresh silencioso (no toca user/userData)
  const setTokens = (authToken: string, refreshTokenValue: string) => {
    token.value = authToken;
    refreshToken.value = refreshTokenValue;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('refreshToken', refreshTokenValue);
  };

  const updateUserData = (userData: User) => {
    user.value = userData;
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // Rol BEONE: entra en modo "ver como el líder de esta sede" (solo lectura).
  // Usa axios directo, como revokeToken(), para evitar el ciclo de import con services/api.ts.
  const enterSede = async (sedeId: number) => {
    const base = getApiBase();
    const { data } = await axios.post(
      `${base}/auth/enter-sede/${sedeId}`,
      {},
      { headers: { Authorization: `Bearer ${token.value}` } },
    );
    setTokens(data.access_token, data.refresh_token);
    updateUserData(data.user);
    useNotifications().reconnect(data.access_token);
    return data.user as User;
  };

  const exitSede = async () => {
    const base = getApiBase();
    const { data } = await axios.post(
      `${base}/auth/exit-sede`,
      {},
      { headers: { Authorization: `Bearer ${token.value}` } },
    );
    setTokens(data.access_token, data.refresh_token);
    updateUserData(data.user);
    useNotifications().reconnect(data.access_token);
    return data.user as User;
  };

  const setLogout = () => {
    // No bloquea el logout visual: la limpieza del cliente ocurre de inmediato.
    // La revocación en el backend (tokenVersion++) se reintenta en segundo
    // plano y, si la red falla del todo, queda en cola para reintentarse en
    // el próximo arranque de la app o el próximo login exitoso.
    const currentToken = token.value;

    user.value = null;
    token.value = null;
    refreshToken.value = null;
    localStorage.clear();

    if (currentToken) {
      revokeToken(currentToken).then((revoked) => {
        if (!revoked) {
          const pending = readPendingLogoutTokens();
          pending.push(currentToken);
          writePendingLogoutTokens(pending);
        }
      });
    }
  };

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    login,
    setTokens,
    updateUserData,
    enterSede,
    exitSede,
    setLogout,
  };
});