// src/composables/useAuth.ts
import { createGlobalState } from '@vueuse/core';
import { ref, computed } from 'vue';

interface User {
  countryId: null
  createdAt: string
  email: string
  id: number
  roleId: number
  statusId: number
  updatedAt: string
  username: string
}

export const useAuth = createGlobalState(() => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  //Guarda el token en el localStorage
  const storedToken = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('userData');

  if (storedToken && storedUser) {
    token.value = storedToken;
    user.value = JSON.parse(storedUser);
  }

  const isAuthenticated = computed(() => !!token.value);

  const login = (userData: User, authToken: string) => {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const setLogout = () => {
    user.value = null;
    token.value = null;
    localStorage.clear()
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    setLogout,
  };
});