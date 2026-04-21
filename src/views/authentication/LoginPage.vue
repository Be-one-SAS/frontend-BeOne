<template>
  <div class="login-root">

    <!-- ══════════════════════════════════════════════════
         PANEL IZQUIERDO — Branding (solo desktop)
    ══════════════════════════════════════════════════ -->
    <div class="brand-panel">

      <!-- Mosaico de fondo (lógica intacta del componente original) -->
      <div class="absolute inset-0 z-0">
        <div class="grid w-full h-full" :style="gridStyle">
          <div
            v-for="(item, index) in gridImages"
            :key="index"
            class="relative w-full h-full overflow-hidden"
          >
            <img
              :src="item.current"
              class="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
              :class="item.active ? 'opacity-60' : 'opacity-10'"
            />
          </div>
        </div>
      </div>

      <!-- Gradiente sobre el mosaico -->
      <div class="brand-gradient" />

      <!-- Contenido del panel izquierdo -->
      <div class="brand-content">

        <!-- Logo -->
        <img
          src="/assets/logo.png"
          alt="BeOne"
          class="brand-logo"
        />

        <!-- Texto central -->
        <div class="brand-copy">
          <h1 class="brand-headline">
            Gestiona tus eventos<br />con precisión
          </h1>
          <p class="brand-sub">
            Plataforma integral para cotizaciones, operaciones
            e inventario de BeOne Eventos Corporativos.
          </p>
        </div>

        <!-- Stats -->
        <div class="brand-stats">
          <div class="stat-item">
            <p class="stat-num">+500</p>
            <p class="stat-lbl">Eventos realizados</p>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <p class="stat-num">+120</p>
            <p class="stat-lbl">Clientes corporativos</p>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <p class="stat-num">8</p>
            <p class="stat-lbl">Ciudades activas</p>
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         PANEL DERECHO — Formulario
    ══════════════════════════════════════════════════ -->
    <div class="form-panel">
      <div class="form-inner">

        <!-- Logo (solo mobile) -->
        <img
          src="/assets/logo.png"
          alt="BeOne"
          class="form-logo-mobile"
        />

        <!-- Header -->
        <div class="form-header">
          <h2 class="form-title">Bienvenido 👋</h2>
          <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Formulario (lógica intacta) -->
        <form @submit.prevent="handleLogin" class="form-fields">

          <InputLabel
            v-model="email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@beone.co"
            required
          />

          <div class="pw-wrap">
            <InputLabel
              v-model="password"
              label="Contraseña"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="pw-eye"
              @mousedown="showPassword = true"
              @mouseup="showPassword = false"
              @mouseleave="showPassword = false"
            >
              <IconEyes />
            </button>
          </div>

          <!-- Error de login -->
          <Transition name="error-fade">
            <div v-if="loginError" class="login-error">
              <AlertCircle class="error-icon" />
              <span>{{ loginError }}</span>
            </div>
          </Transition>

          <div class="form-submit">
            <BaseButton type="submit" variant="primary" :loading="isLoading">
              {{ isLoading ? 'Verificando...' : 'Iniciar sesión' }}
            </BaseButton>
          </div>

        </form>

        <!-- Footer -->
        <p class="form-footer">
          © 2026 BeOne. Todos los derechos reservados.
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { AlertCircle } from "lucide-vue-next"
import { auth } from "../../services/user.service"
import { useAuth } from "../../composables/useAuth"
import IconEyes from "../../Icons/IconEyes.vue"
import InputLabel from "../../components/input/InputLabel.vue"
import BaseButton from "../../components/ui/BaseButton.vue"

/* ================= LOGIN ================= */

const router    = useRouter()
const email     = ref("")
const password  = ref("")
const isLoading = ref(false)
const showPassword = ref(false)
const loginError   = ref("")
const authStore = useAuth()

const handleLogin = () => {
  if (email.value && password.value) login()
}

const login = async () => {
  try {
    isLoading.value = true
    loginError.value = ""

    const response = await auth({
      email:    email.value,
      password: password.value,
    })

    const { access_token, user } = response.data
    authStore.login(user, access_token)
    router.push("/dashboard")

  } catch (error) {
    const status = error?.response?.status
    const serverMsg = (error?.response?.data?.message ?? '').toLowerCase()
    if (status === 404 || serverMsg.includes('not found') || serverMsg.includes('no encontrado')) {
      loginError.value = 'El usuario no fue encontrado.'
    } else {
      loginError.value = 'Credenciales incorrectas. Inténtalo de nuevo.'
    }
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
const rows    = ref(6)

const calculateGrid = () => {
  const width = window.innerWidth

  if (width < 640)        columns.value = 4
  else if (width < 1024)  columns.value = 6
  else if (width < 1536)  columns.value = 8
  else                    columns.value = 10

  rows.value = Math.ceil(window.innerHeight / (window.innerWidth / columns.value))
}

const totalItems = computed(() => columns.value * rows.value)

const gridImages = ref([])

const generateGrid = () => {
  gridImages.value = Array.from({ length: totalItems.value }).map(() => ({
    current: getRandomImage(),
    active:  false,
  }))
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  gridTemplateRows:    `repeat(${rows.value}, 1fr)`,
}))

let interval = null

const triggerFade = () => {
  const changesCount = Math.floor(Math.random() * 6) + 4

  for (let i = 0; i < changesCount; i++) {
    const randomIndex = Math.floor(Math.random() * gridImages.value.length)
    const item        = gridImages.value[randomIndex]

    item.current = getRandomImage()
    item.active  = true

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

<style scoped>
/* ── Root: dos paneles horizontales ──────────────────── */
.login-root {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #FFFFFF;
}

/* ══════════════════════════════════════════════════════
   PANEL IZQUIERDO — Branding
══════════════════════════════════════════════════════ */
.brand-panel {
  position: relative;
  width: 55%;
  flex-shrink: 0;
  overflow: hidden;
  display: none; /* oculto en mobile */
}

/* Gradiente azul profundo sobre el mosaico */
.brand-gradient {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: linear-gradient(
    135deg,
    rgba(5, 78, 175, 0.90) 0%,
    rgba(5, 78, 175, 0.78) 50%,
    rgba(10, 61, 143, 0.88) 100%
  );
}

/* Contenido sobre el gradiente */
.brand-content {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 40px;
  color: #FFFFFF;
}

.brand-logo {
  height: 36px;
  object-fit: contain;
  align-self: flex-start;
  /* Invertir a blanco */
  filter: brightness(0) invert(1);
}

.brand-copy { display: flex; flex-direction: column; gap: 16px; }

.brand-headline {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
  color: #FFFFFF;
}

.brand-sub {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.72);
  max-width: 360px;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* Stats en la parte inferior */
.brand-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item { text-align: center; }

.stat-num {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.1;
}

.stat-lbl {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.58);
  font-family: 'Inter', sans-serif;
  margin: 3px 0 0;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════
   PANEL DERECHO — Formulario
══════════════════════════════════════════════════════ */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 40px 32px;
  overflow-y: auto;
}

.form-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Logo solo en mobile */
.form-logo-mobile {
  height: 32px;
  object-fit: contain;
  align-self: center;
  display: none;
}

.form-header { display: flex; flex-direction: column; gap: 4px; }

.form-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}

.form-subtitle {
  font-size: 13px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* Formulario */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pw-wrap { position: relative; }

.pw-eye {
  position: absolute;
  right: 12px;
  top: 34px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}

.pw-eye:hover { color: #475569; }

/* Error de login */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #FEE2E2;
  border-radius: 10px;
  font-size: 12px;
  color: #B91C1C;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.error-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.form-submit { margin-top: 4px; }

/* Footer */
.form-footer {
  font-size: 11px;
  color: #94A3B8;
  text-align: center;
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid #EBF3FC;
  margin-top: auto;
}

/* ── Transición error ────────────────────────────────── */
.error-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.error-fade-leave-active { transition: opacity 0.15s ease; }
.error-fade-enter-from   { opacity: 0; transform: translateY(-4px); }
.error-fade-leave-to     { opacity: 0; }

/* ── Responsive ──────────────────────────────────────── */
@media (min-width: 768px) {
  .brand-panel { display: flex; }

  /* Ocultar logo mobile */
  .form-logo-mobile { display: none !important; }
}

@media (max-width: 767px) {
  .form-panel { padding: 32px 24px; }
  .form-logo-mobile { display: block; }
}
</style>
