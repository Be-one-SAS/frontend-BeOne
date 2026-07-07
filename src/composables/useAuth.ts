// src/composables/useAuth.ts
import { createGlobalState } from '@vueuse/core';
import { ref, computed } from 'vue';
import axios from 'axios';

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
}

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

  const setLogout = () => {
    // Best-effort: invalida la sesión en el backend (incrementa tokenVersion,
    // lo que revoca de inmediato access + refresh token). No bloquea el
    // logout visual si la red falla — se usa axios "pelado" (no la instancia
    // `api`) para evitar un import circular con services/api.ts.
    if (token.value) {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3003/api';
      axios.post(`${base}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token.value}` },
      }).catch(() => {});
    }

    user.value = null;
    token.value = null;
    refreshToken.value = null;
    localStorage.clear()
  };

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    login,
    setTokens,
    updateUserData,
    setLogout,
  };
});