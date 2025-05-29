// stores/auth.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(false);

  function loadFromStorage() {
    const token = localStorage.getItem("authToken");
    isAuthenticated.value = !!token;
  }

  return { isAuthenticated, loadFromStorage };
});