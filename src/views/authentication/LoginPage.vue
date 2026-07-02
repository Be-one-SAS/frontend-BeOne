<template>
  <div class="login-root">

    <!-- ══════════════════════════════════════════════════
         PANEL IZQUIERDO — Branding
    ══════════════════════════════════════════════════ -->
    <div class="brand-panel">

      <!-- Mosaico de fondo -->
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
              :class="item.active ? 'opacity-70' : 'opacity-20'"
            />
          </div>
        </div>
      </div>

      <!-- Overlay oscuro con teal -->
      <div class="brand-overlay" />

      <!-- Contenido -->
      <div class="brand-content">

        <!-- Logo -->
        <img src="/assets/logo.png" alt="BeOne" class="brand-logo" />

        <!-- Copy central -->
        <div class="brand-copy">
          <p class="brand-eyebrow">Plataforma de gestión</p>
          <h1 class="brand-headline">
            Eventos corporativos<br />con precisión total.
          </h1>
          <p class="brand-sub">
            Cotizaciones, operaciones e inventario en un solo lugar.
          </p>
          <div class="brand-features">
            <div class="brand-feat">
              <span class="brand-feat-dot" />
              Gestión de cotizaciones en tiempo real
            </div>
            <div class="brand-feat">
              <span class="brand-feat-dot" />
              Control operativo y de inventario
            </div>
            <div class="brand-feat">
              <span class="brand-feat-dot" />
              Reportes financieros automatizados
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="brand-stats">
          <div class="stat-item">
            <p class="stat-num">+500</p>
            <p class="stat-lbl">Eventos realizados</p>
          </div>
          <div class="stat-div" />
          <div class="stat-item">
            <p class="stat-num">+120</p>
            <p class="stat-lbl">Clientes corporativos</p>
          </div>
          <div class="stat-div" />
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

        <!-- Logo mobile -->
        <img src="/assets/logo.png" alt="BeOne" class="form-logo-mobile" />

        <!-- Header -->
        <div class="form-header">
          <h2 class="form-title">Bienvenido de vuelta</h2>
          <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="form-fields" novalidate>

          <!-- Email -->
          <div class="lf-field" :class="{ 'lf-field--filled': email }">
            <input
              id="lf-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder=" "
              class="lf-input"
              :class="{ 'lf-input--error': loginError }"
            />
            <label for="lf-email" class="lf-label">Correo electrónico</label>
            <div class="lf-border" />
          </div>

          <!-- Password -->
          <div class="lf-field" :class="{ 'lf-field--filled': password }">
            <input
              id="lf-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder=" "
              class="lf-input lf-input--pw"
              :class="{ 'lf-input--error': loginError }"
            />
            <label for="lf-password" class="lf-label">Contraseña</label>
            <div class="lf-border" />
            <button
              type="button"
              class="pw-toggle"
              :class="{ 'pw-toggle--active': showPassword }"
              tabindex="-1"
              @mousedown.prevent="showPassword = true"
              @mouseup="showPassword = false"
              @mouseleave="showPassword = false"
              @touchstart.prevent="showPassword = true"
              @touchend="showPassword = false"
            >
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>

          <!-- Error -->
          <Transition name="err">
            <div v-if="loginError" class="login-error">
              <AlertCircle :size="14" style="flex-shrink:0" />
              <span>{{ loginError }}</span>
            </div>
          </Transition>

          <!-- Submit -->
          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="!isLoading">Iniciar sesión</span>
            <span v-else class="submit-loading">
              <span class="submit-spinner" />
              Verificando...
            </span>
          </button>

        </form>

        <!-- Footer -->
        <p class="form-footer">© {{ new Date().getFullYear() }} BeOne. Todos los derechos reservados.</p>

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

/* ── Login ── */
const router       = useRouter()
const email        = ref("")
const password     = ref("")
const isLoading    = ref(false)
const showPassword = ref(false)
const loginError   = ref("")
const authStore    = useAuth()

const handleLogin = () => {
  if (email.value && password.value) login()
}

const login = async () => {
  isLoading.value  = true
  loginError.value = ""
  try {
    const response = await auth({ email: email.value, password: password.value })
    const { access_token, user } = response.data
    authStore.login(user, access_token)
    const role = user?.role ?? user?.roles?.[0]
    router.push(role === 'OPERATIVO' ? '/admin/control' : '/dashboard')
  } catch (error) {
    const status    = error?.response?.status
    const serverMsg = (error?.response?.data?.message ?? '').toLowerCase()
    const serverErr = (error?.response?.data?.error   ?? '').toLowerCase()

    if (status === 404 || serverMsg.includes('not found') || serverErr.includes('not found')) {
      loginError.value = 'El usuario no fue encontrado en el sistema.'
    } else if (status === 401 || serverMsg.includes('credenciales') || serverMsg.includes('incorrect')) {
      loginError.value = 'Credenciales incorrectas. Verifica tu correo y contraseña.'
    } else if (status === 403) {
      loginError.value = 'Acceso denegado. Tu cuenta puede estar desactivada.'
    } else if (status === 429) {
      loginError.value = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      loginError.value = 'La solicitud tardó demasiado. Verifica tu conexión.'
    } else if (!error.response) {
      loginError.value = 'Error de conexión. Verifica tu acceso a internet.'
    } else {
      loginError.value = 'Error al iniciar sesión. Intenta nuevamente.'
    }
  }
  isLoading.value = false
}

/* ── Mosaico ── */
const imagesPool = [
  "/assets/gallery/1.webp", "/assets/gallery/2.webp", "/assets/gallery/3.webp",
  "/assets/gallery/4.webp", "/assets/gallery/5.webp", "/assets/gallery/6.webp",
]

const getRandomImage = () => imagesPool[Math.floor(Math.random() * imagesPool.length)]
const columns  = ref(10)
const rows     = ref(6)

const calculateGrid = () => {
  const w = window.innerWidth
  columns.value = w < 640 ? 4 : w < 1024 ? 6 : w < 1536 ? 8 : 10
  rows.value    = Math.ceil(window.innerHeight / (window.innerWidth / columns.value))
}

const totalItems = computed(() => columns.value * rows.value)
const gridImages = ref([])

const generateGrid = () => {
  gridImages.value = Array.from({ length: totalItems.value }).map(() => ({
    current: getRandomImage(), active: false,
  }))
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  gridTemplateRows:    `repeat(${rows.value}, 1fr)`,
}))

let interval = null

const triggerFade = () => {
  const n = Math.floor(Math.random() * 6) + 4
  for (let i = 0; i < n; i++) {
    const idx  = Math.floor(Math.random() * gridImages.value.length)
    const item = gridImages.value[idx]
    item.current = getRandomImage()
    item.active  = true
    setTimeout(() => { item.active = false }, 3000)
  }
}

onMounted(() => {
  calculateGrid()
  generateGrid()
  window.addEventListener("resize", () => { calculateGrid(); generateGrid() })
  interval = setInterval(triggerFade, 2500)
})

onUnmounted(() => {
  clearInterval(interval)
  window.removeEventListener("resize", calculateGrid)
})
</script>

<style scoped>
/* ── Variables de color ────────────────────────── */
:root {
  --c-teal:       #27C8D8;
  --c-teal-dark:  #1BAEBB;
  --c-teal-glow:  rgba(39, 200, 216, 0.18);
  --c-teal-soft:  rgba(39, 200, 216, 0.10);
}

/* ── Root ──────────────────────────────────────── */
.login-root {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #F8FAFC;
}

/* ════════════════════════════════════════════════
   PANEL IZQUIERDO
════════════════════════════════════════════════ */
.brand-panel {
  position: relative;
  width: 54%;
  flex-shrink: 0;
  overflow: hidden;
  display: none;
}

.brand-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: linear-gradient(
    145deg,
    rgba(4, 38, 46, 0.94) 0%,
    rgba(8, 55, 66, 0.88) 45%,
    rgba(19, 90, 104, 0.82) 100%
  );
}

.brand-content {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 44px 48px;
  color: #fff;
}

.brand-logo {
  height: 34px;
  object-fit: contain;
  align-self: flex-start;
  filter: brightness(0) invert(1);
}

.brand-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #27C8D8;
  margin: 0 0 12px;
  font-family: 'Inter', sans-serif;
}

.brand-copy { display: flex; flex-direction: column; }

.brand-headline {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 36px;
  font-weight: 800;
  line-height: 1.22;
  margin: 0 0 14px;
  color: #fff;
}

.brand-sub {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255,255,255,.62);
  font-family: 'Inter', sans-serif;
  margin: 0 0 28px;
  max-width: 340px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.brand-feat {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255,255,255,.78);
  font-family: 'Inter', sans-serif;
}

.brand-feat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #27C8D8;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(39,200,216,.7);
}

/* Stats */
.brand-stats {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 20px 24px;
  background: rgba(39,200,216,.08);
  border: 1px solid rgba(39,200,216,.2);
  border-radius: 16px;
  backdrop-filter: blur(8px);
}

.stat-item { text-align: center; }

.stat-num {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #27C8D8;
  margin: 0;
  line-height: 1;
}

.stat-lbl {
  font-size: 10px;
  color: rgba(255,255,255,.5);
  font-family: 'Inter', sans-serif;
  margin: 4px 0 0;
  white-space: nowrap;
}

.stat-div {
  width: 1px;
  height: 32px;
  background: rgba(39,200,216,.2);
  flex-shrink: 0;
}

/* ════════════════════════════════════════════════
   PANEL DERECHO
════════════════════════════════════════════════ */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px 32px;
  overflow-y: auto;
}

.form-inner {
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Logo mobile */
.form-logo-mobile {
  height: 30px;
  object-fit: contain;
  align-self: center;
  display: none;
}

/* Header */
.form-header { display: flex; flex-direction: column; gap: 6px; }

.form-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #0B1120;
  margin: 0;
  letter-spacing: -.3px;
}

.form-subtitle {
  font-size: 13.5px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* ── Campos ─────────────────────────────────────── */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Floating label field */
.lf-field {
  position: relative;
}

.lf-input {
  width: 100%;
  height: 54px;
  padding: 18px 16px 6px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  transition: border-color .2s, background .2s, box-shadow .2s;
  box-sizing: border-box;
}

.lf-input--pw { padding-right: 46px; }

.lf-input:focus {
  border-color: #27C8D8;
  background: #fff;
  box-shadow: 0 0 0 3.5px rgba(39,200,216,.14);
}

.lf-input--error {
  border-color: #F87171 !important;
  background: #FFF8F8 !important;
  box-shadow: 0 0 0 3px rgba(248,113,113,.10) !important;
}

/* Floating label */
.lf-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  pointer-events: none;
  transition: top .18s ease, font-size .18s ease, color .18s ease, transform .18s ease;
  transform-origin: left center;
}

.lf-input:focus ~ .lf-label,
.lf-input:not(:placeholder-shown) ~ .lf-label {
  top: 10px;
  transform: translateY(0) scale(.8);
  font-size: 14px;
  color: #27C8D8;
  font-weight: 600;
}

.lf-input--error ~ .lf-label {
  color: #F87171 !important;
}

/* Password toggle */
.pw-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color .15s, background .15s;
}

.pw-toggle:hover, .pw-toggle--active {
  color: #27C8D8;
  background: rgba(39,200,216,.08);
}

/* Error banner */
.login-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 14px;
  background: #FFF5F5;
  border: 1px solid #FECACA;
  border-radius: 10px;
  font-size: 12.5px;
  color: #DC2626;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  line-height: 1.4;
}

/* Submit button */
.submit-btn {
  width: 100%;
  height: 50px;
  background: #27C8D8;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background .2s, box-shadow .2s, transform .1s;
  letter-spacing: .2px;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #1BAEBB;
  box-shadow: 0 4px 18px rgba(39,200,216,.35);
}

.submit-btn:active:not(:disabled) {
  transform: scale(.985);
}

.submit-btn:disabled {
  opacity: .7;
  cursor: not-allowed;
}

.submit-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-spinner {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Footer */
.form-footer {
  font-size: 11.5px;
  color: #CBD5E1;
  text-align: center;
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding-top: 20px;
  border-top: 1px solid #F1F5F9;
}

/* ── Transición error ───────────────────────────── */
.err-enter-active { transition: opacity .2s ease, transform .2s ease; }
.err-leave-active { transition: opacity .15s ease; }
.err-enter-from   { opacity: 0; transform: translateY(-6px); }
.err-leave-to     { opacity: 0; }

/* ── Responsive ─────────────────────────────────── */
@media (min-width: 768px) {
  .brand-panel { display: flex; }
  .form-logo-mobile { display: none !important; }
}

@media (max-width: 767px) {
  .form-panel { padding: 36px 24px; background: #F8FAFC; }
  .form-inner { max-width: 100%; gap: 24px; }
  .form-logo-mobile { display: block; }
  .form-title { font-size: 22px; }
}
</style>
