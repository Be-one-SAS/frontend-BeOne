<template>
  <div class="min-h-screen flex justify-center items-center bg-[#f4f6f8] overflow-hidden">

    <!-- CARD LOGIN -->
    <div class="w-full md:w-[600px] flex items-center justify-center p-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg relative z-20">
      <div class="w-full max-w-sm">

        <h2 class="text-3xl font-bold text-gray-900 mb-2">
          Iniciar sesión
        </h2>
        <p class="text-sm text-gray-500 mb-6">
          ¡Introduce tu email y contraseña para iniciar sesión!
        </p>

  
        <div class="flex items-center mb-6">
          <hr class="flex-grow border-gray-200" />
          <span class="mx-3 text-sm text-gray-400">o</span>
          <hr class="flex-grow border-gray-200" />
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">

          <div>
            <label class="text-sm text-gray-600">Email*</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              placeholder="mail@ejemplo.com"
            />
          </div>

          <div>
            <label class="text-sm text-gray-600">Password*</label>
            <div class="relative mt-1">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-2 border rounded-lg pr-10 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-3 flex items-center text-gray-500"
                @mousedown="showPassword = true"
                @mouseup="showPassword = false"
                @mouseleave="showPassword = false"
              >
                <IconEyes />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition"
          >
            {{ isLoading ? "Iniciando..." : "Iniciar sesión" }}
          </button>
        </form>

        <p class="text-xs text-gray-400 mt-10 text-center">
          © 2026 BeOne. Todos los derechos reservados.
        </p>
      </div>
    </div>

    <!-- MOSAICO FONDO -->
    <div 
    class="hidden md:flex items-center absolute right-0 w-1/2 h-full overflow-hidden p-0 z-0"
    
    >
      <div class="grid grid-cols-4 2xl:grid-cols-6 gap-2 w-full">

        <div
          v-for="(item, index) in gridImages"
          :key="index"
          class="relative h-45 w-45 2xl:h-50 2xl:w-50"
        >
          <!-- Imagen actual -->
          <img
            :src="item.current"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
            :class="{ 'opacity-5': item.fade }"
          />

          <!-- Imagen siguiente -->
          <img
            :src="item.next"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
            :class="{ 'opacity-0': item.fade, 'opacity-5': !item.fade }"
          />
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth } from "../../services/user.service"
import { useAuth } from "../../composables/useAuth"
import IconEyes from "../../Icons/IconEyes.vue"

const router = useRouter()
const email = ref("")
const password = ref("")
const isLoading = ref(false)
const showPassword = ref(false)
const authStore = useAuth()

/* ================= LOGIN ================= */

const handleLogin = () => {
  if (email.value && password.value) login()
}

const login = async () => {
  try {
    isLoading.value = true
    const response = await auth({
      email: email.value,
      password: password.value,
    })

    if (response.status === 201) {
      const { access_token, user } = response.data
      authStore.login(user, access_token)
      router.push("/")
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

/* ================= MOSAICO DINÁMICO ================= */

const imagesPool = [
  "/assets/gallery/1.webp",
  "/assets/gallery/2.webp",
  "/assets/gallery/3.webp",
  "/assets/gallery/4.webp",
  "/assets/gallery/5.webp",
  "/assets/gallery/6.webp",
]

const gridSize = 36

const getRandomImage = () =>
  imagesPool[Math.floor(Math.random() * imagesPool.length)]

const gridImages = ref(
  Array.from({ length: gridSize }).map(() => ({
    current: getRandomImage(),
    next: getRandomImage(),
    fade: false,
  }))
)

let interval = null

const triggerMultipleFades = () => {
  const changesCount = Math.floor(Math.random() * 4) + 3 // 3 a 6 imágenes

  const usedIndexes = new Set()

  for (let i = 0; i < changesCount; i++) {
    let randomIndex

    do {
      randomIndex = Math.floor(Math.random() * gridImages.value.length)
    } while (usedIndexes.has(randomIndex))

    usedIndexes.add(randomIndex)

    const item = gridImages.value[randomIndex]

    const randomDelay = Math.random() * 3000

    setTimeout(() => {
      item.fade = true

      setTimeout(() => {
        item.current = item.next
        item.next = getRandomImage()
        item.fade = false
      }, 3000)
    }, randomDelay)
  }
}

onMounted(() => {
  interval = setInterval(triggerMultipleFades, 3000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>