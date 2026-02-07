<template>
  <div class="relative w-screen h-screen overflow-hidden bg-[#f4f6f8]">

    <!-- ================= MOSAICO FULLSCREEN ================= -->
    <div class="absolute inset-0 z-0">
      <div class="grid w-full h-full" :style="gridStyle">
        <div v-for="(item, index) in gridImages" :key="index" class="relative w-full h-full overflow-hidden">
          <img :src="item.current"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
            :class="item.active ? 'opacity-40' : 'opacity-[0.05]'" />
        </div>
      </div>
    </div>


    <!-- ================= CARD LOGIN ================= -->
    <div class="absolute inset-0 flex justify-center items-center z-20">
      <div class="w-full max-w-[600px] mx-3 py-10 px-10 bg-white/50 backdrop-blur-md rounded-4xl shadow-xl">
        <div class="w-full max-w-sm mx-auto flex flex-col min-h-[480px]">

          <!-- LOGO -->
          <div class="flex justify-center mb-6">
            <img src="/assets/logo.png" alt="BeOne Logo" class="h-12 object-contain" />
          </div>

          <!-- CONTENIDO -->
          <div class="flex-1">

            <h2 class="text-3xl font-bold text-gray-900 mb-2 text-center">
              Iniciar sesión
            </h2>

            <p class="text-sm text-gray-500 mb-6 text-center">
              ¡Introduce tu email y contraseña para iniciar sesión!
            </p>

            <form @submit.prevent="handleLogin" class="space-y-4">

              <InputLabel v-model="email" label="Email*" type="email" placeholder="mail@ejemplo.com" required />

              <div class="relative w-full">
                <InputLabel v-model="password" label="Password*" :type="showPassword ? 'text' : 'password'" required />

                <button type="button" class="absolute right-3 top-[34px] text-gray-500" @mousedown="showPassword = true"
                  @mouseup="showPassword = false" @mouseleave="showPassword = false">
                  <IconEyes />
                </button>
              </div>

              <div class="w-full mt-10">
                <BaseButton type="submit" variant="primary" :loading="isLoading">
                  {{ isLoading ? "Iniciando..." : "Iniciar sesión" }}
                </BaseButton>
              </div>

            </form>

          </div>

          <!-- DERECHOS -->
          <div class="pt-3">
            <p class="text-xs text-gray-500 text-center">
              © 2026 BeOne. Todos los derechos reservados.
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { auth } from "../../services/user.service"
import { useAuth } from "../../composables/useAuth"
import IconEyes from "../../Icons/IconEyes.vue"
import InputLabel from "../../components/input/InputLabel.vue"
import BaseButton from "../../components/ui/BaseButton.vue"

/* ================= LOGIN ================= */

const router = useRouter()
const email = ref("")
const password = ref("")
const isLoading = ref(false)
const showPassword = ref(false)
const authStore = useAuth()

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

    const { access_token, user } = response.data
    authStore.login(user, access_token)
    router.push("/")

    
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

/* ================= MOSAICO PERFECTO FULLSCREEN ================= */

const imagesPool = [
  "/assets/gallery/1.webp",
  "/assets/gallery/2.webp",
  "/assets/gallery/3.webp",
  "/assets/gallery/4.webp",
  "/assets/gallery/5.webp",
  "/assets/gallery/6.webp",
]

const getRandomImage = () =>
  imagesPool[Math.floor(Math.random() * imagesPool.length)]

const columns = ref(10)
const rows = ref(6)

const calculateGrid = () => {
  const width = window.innerWidth

  if (width < 640) columns.value = 4
  else if (width < 1024) columns.value = 6
  else if (width < 1536) columns.value = 8
  else columns.value = 10

  rows.value = Math.ceil(window.innerHeight / (window.innerWidth / columns.value))
}

const totalItems = computed(() => columns.value * rows.value)

const gridImages = ref([])

const generateGrid = () => {
  gridImages.value = Array.from({ length: totalItems.value }).map(() => ({
    current: getRandomImage(),
    active: false,
  }))
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  gridTemplateRows: `repeat(${rows.value}, 1fr)`
}))

let interval = null

const triggerFade = () => {
  const changesCount = Math.floor(Math.random() * 6) + 4

  for (let i = 0; i < changesCount; i++) {
    const randomIndex = Math.floor(Math.random() * gridImages.value.length)
    const item = gridImages.value[randomIndex]

    item.current = getRandomImage()
    item.active = true

    setTimeout(() => {
      item.active = false
    }, 3000)
  }
}

onMounted(() => {
  calculateGrid()
  generateGrid()
  window.addEventListener("resize", () => {
    calculateGrid()
    generateGrid()
  })
  interval = setInterval(triggerFade, 2500)
})

onUnmounted(() => {
  clearInterval(interval)
  window.removeEventListener("resize", calculateGrid)
})
</script>