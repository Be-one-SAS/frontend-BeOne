<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label class="block text-gray-700 mb-1" for="email">Correo</label>
            <input
              v-model="email"
              id="email"
              type="email"
              required
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 mb-1" for="password">Contraseña</label>
            <input
              v-model="password"
              id="password"
              type="password"
              required
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const email = ref('')
  const password = ref('')
  
  const handleLogin = () => {
    console.log('Correo:', email.value)
    console.log('Contraseña:', password.value)
    // Aquí podrías llamar a tu API con axios/fetch
  }
  </script>