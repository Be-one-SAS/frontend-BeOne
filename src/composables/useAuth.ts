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

const LOGOUT_MAX_ATTEMPTS = 3;
const LOGOUT_RETRY_DELAY_MS = 700;

const getApiBase = () => import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// access_token/refresh_token viajan como cookies httpOnly — el navegador las
// adjunta solo en cada request (withCredentials), nunca pasan por JS ni por
// localStorage. Solo se cachea `user` (datos de perfil, no sensibles) para
// que la UI no parpadee mientras se confirma la sesión contra /auth/me.
const revokeSession = async (): Promise<boolean> => {
  const base = getApiBase();
  for (let attempt = 1; attempt <= LOGOUT_MAX_ATTEMPTS; attempt++) {
    try {
      await axios.post(`${base}/auth/logout`, {}, { withCredentials: true });
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401) return true; // ya estaba invalidada
      if (attempt < LOGOUT_MAX_ATTEMPTS) await sleep(LOGOUT_RETRY_DELAY_MS * attempt);
    }
  }
  // Si las 3 veces falla (p. ej. error de red), se abandona: no hay token que
  // guardar para reintentar en la próxima carga (httpOnly = inaccesible desde
  // JS), y el access_token igual expira solo del lado del servidor (12h).
  return false;
};

export const useAuth = createGlobalState(() => {
  const user = ref<User | null>(null);
  const storedUser = localStorage.getItem('userData');
  if (storedUser) {
    try { user.value = JSON.parse(storedUser); } catch { /* ignora cache corrupta */ }
  }

  const isAuthenticated = computed(() => !!user.value);

  // Confirma contra el backend si la cookie de sesión sigue siendo válida.
  // Se memoiza: solo hace la llamada real una vez por carga de la app —
  // navegaciones subsecuentes del router reusan el mismo resultado.
  //
  // El access_token dura 12h y el refresh_token 7 días: si al recargar el
  // sitio el access_token ya expiró (cookie borrada sola por el navegador)
  // pero el refresh_token sigue vigente, un 401 acá NO debe desloguear de
  // una — primero se intenta /auth/refresh (mismo mecanismo que el
  // interceptor de services/api.ts) y solo si eso también falla se limpia
  // la sesión. Sin esto, cualquier recarga pasadas las 12h forzaba un
  // re-login aunque quedaran días de sesión válida.
  let authCheck: Promise<void> | null = null;
  const ensureAuthLoaded = () => {
    if (!authCheck) {
      const base = getApiBase();
      const clearSession = () => {
        user.value = null;
        localStorage.removeItem('userData');
      };
      authCheck = axios.get(`${base}/auth/me`, { withCredentials: true })
        .then(({ data }) => updateUserData(data))
        .catch(async (error) => {
          if (error?.response?.status !== 401) {
            clearSession();
            return;
          }
          try {
            await axios.post(`${base}/auth/refresh`, {}, { withCredentials: true });
            const { data } = await axios.get(`${base}/auth/me`, { withCredentials: true });
            updateUserData(data);
          } catch {
            clearSession();
          }
        });
    }
    return authCheck;
  };

  const login = (userData: User) => {
    user.value = userData;
    localStorage.setItem('userData', JSON.stringify(userData));
    authCheck = Promise.resolve();
  };

  const updateUserData = (userData: User) => {
    user.value = userData;
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // Rol BEONE: entra en modo "ver como el líder de esta sede" (solo lectura).
  // Usa axios directo, como revokeSession(), para evitar el ciclo de import con services/api.ts.
  const enterSede = async (sedeId: number) => {
    const base = getApiBase();
    const { data } = await axios.post(
      `${base}/auth/enter-sede/${sedeId}`,
      {},
      { withCredentials: true },
    );
    updateUserData(data.user);
    useNotifications().reconnect();
    return data.user as User;
  };

  const exitSede = async () => {
    const base = getApiBase();
    const { data } = await axios.post(
      `${base}/auth/exit-sede`,
      {},
      { withCredentials: true },
    );
    updateUserData(data.user);
    useNotifications().reconnect();
    return data.user as User;
  };

  const setLogout = () => {
    // No bloquea el logout visual: la limpieza del cliente ocurre de inmediato.
    // La revocación en el backend (tokenVersion++ y borrado de las cookies)
    // se reintenta en segundo plano un puñado de veces (revokeSession) — si
    // falla del todo, el access_token expira solo (ver JWT_EXPIRES_IN).
    user.value = null;
    localStorage.removeItem('userData');
    authCheck = Promise.resolve();
    revokeSession();
  };

  return {
    user,
    isAuthenticated,
    ensureAuthLoaded,
    login,
    updateUserData,
    enterSede,
    exitSede,
    setLogout,
  };
});
