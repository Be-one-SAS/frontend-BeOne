<template>
  <div class="min-h-screen flex">
    <!-- Lado izquierdo: formulario -->
    <div class="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-8 py-12 gap-5">
      <div class="flex flex-col gap-5 max-w-sm w-full">

        <div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h2>
          <p class="text-sm text-gray-500">¡Introduce tu email y contraseña para iniciar sesión!</p>
        </div>

        <button
          class="flex items-center justify-center w-full py-2 mb-4 border rounded-xl bg-white text-black shadow-sm hover:bg-gray-100 ">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon"
            class="w-5 h-5 mr-2 text-red" />
          Iniciar sesión con Google
        </button>

        <div class="flex items-center mb-4">
          <hr class="flex-grow border-gray-200" />
          <span class="mx-2 text-sm text-gray-400">o</span>
          <hr class="flex-grow border-gray-200" />
        </div>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-3">
          <div class="mb-4">
            <label class="block text-gray-700 mb-1" for="email">Email*</label>
            <input v-model="email" id="email" type="email" required
              class="w-full px-4 py-2 border rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mail@ejemplo.com" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 mb-1" for="password">Password*</label>
            <input v-model="password" id="password" type="password" required
              class="w-full px-4 py-2 border rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min. 8 characters" />
          </div>

          <div class="text-right text-sm mb-4 mt-4">
            <a href="#" class="text-blue-500 hover:underline">Forgot password?</a>
          </div>
          <button
  type="submit"
  :disabled="isLoading"
  class="w-full bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition font-medium flex items-center justify-center gap-2"
>
  <svg
    v-if="isLoading"
    class="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    ></path>
  </svg>
  <span>{{ isLoading ? 'Iniciando...' : 'Iniciar sesión' }}</span>
</button>
        </form>

        <p class="text-xs text-gray-400 mt-8 text-center">
          © 2022 BeOne. Todos los derechos reservados.
        </p>
      </div>
    </div>

    <!-- Lado derecho: branding -->
    <div class="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600">
      <div class="max-w-[450px]">
        <img src="/assets/be-one-logo.webp" alt="Logo de BeOne" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../../services/user.service'
import { useAuth } from '../../composables/useAuth'


const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const authStore = useAuth()

const handleLogin = () => {
  if (email.value && password.value) login()
}

/**
 * Inicia la sesion
 */
const login = async () => {
  try {
    isLoading.value = true
    const response = await auth({ email: email.value, password: password.value })
    if (response.status === 201) {
      const { access_token, user } = response.data
      authStore.login(user, access_token);
      router.push("/")

    } else {
      throw new Error('Respuesta vacía de login')
    }
  } catch (error) {
    errorMessage.value = 'Error al iniciar sesión. Verifica el código.'
    console.log('Fallo el servicio auth en LoginView', error)
  } finally {
    isLoading.value = false
  }
}

</script>

<style scoped>
/* Rotación personalizada para la 'o' invertida en "Beone" */
.rotate-180 {
  transform: rotate(180deg);
}
</style>