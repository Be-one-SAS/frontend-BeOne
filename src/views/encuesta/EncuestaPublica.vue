<template>
  <div class="eq-bg">
    <div class="eq-card">

      <!-- Loading -->
      <div v-if="loading" class="eq-loading">
        <div class="eq-spinner" />
        <p>Cargando encuesta…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="eq-state eq-error">
        <div class="eq-icon-wrap eq-icon-red">✗</div>
        <h2>{{ error }}</h2>
        <p>Si crees que esto es un error, contacta al equipo de BeOne.</p>
      </div>

      <!-- Enviado -->
      <div v-else-if="enviado" class="eq-state eq-success">
        <div class="eq-icon-wrap eq-icon-green">✓</div>
        <h2>¡Gracias por tu respuesta!</h2>
        <p>Tu opinión nos ayuda a mejorar continuamente nuestro servicio.</p>
        <p class="eq-brand">BeOne Entretenimiento</p>
      </div>

      <!-- Formulario -->
      <template v-else-if="encuesta">

        <!-- Imagen portada -->
        <div
          v-if="encuesta.imagen"
          class="eq-cover"
          :style="{ backgroundImage: `url(${encuesta.imagen})` }"
        />

        <!-- Header -->
        <div class="eq-header">
          <div class="eq-logo">BeOne</div>
          <div class="eq-logo-sub">Entretenimiento</div>
        </div>

        <div class="eq-body">
          <h1 class="eq-title">{{ encuesta.titulo || 'Encuesta de Satisfacción' }}</h1>
          <p v-if="encuesta.descripcion" class="eq-desc">{{ encuesta.descripcion }}</p>
          <p class="eq-evento">
            {{ encuesta.quotation?.empresa ?? encuesta.quotation?.cliente?.name ?? 'Evento' }}
            <span v-if="encuesta.quotation?.operationWindow?.eventStartAt" class="eq-fecha">
              · {{ formatDate(encuesta.quotation.operationWindow.eventStartAt) }}
            </span>
          </p>

          <!-- Items dinámicos -->
          <div v-for="item in encuesta.items" :key="item.id" class="eq-field">
            <label class="eq-label">
              {{ item.label }}
              <span v-if="item.requerida" class="eq-required">*</span>
            </label>

            <!-- NPS 0-10 -->
            <template v-if="item.tipo === 'NPS'">
              <div class="eq-nps-row">
                <button
                  v-for="n in 10" :key="n"
                  class="eq-nps-btn"
                  :class="{ 'eq-nps-selected': answers[item.id]?.num === n, [`eq-nps-${npsColor(n)}`]: true }"
                  type="button"
                  @click="setNum(item.id, n)"
                >{{ n }}</button>
              </div>
              <div class="eq-nps-labels">
                <span>Nada probable</span><span>Muy probable</span>
              </div>
            </template>

            <!-- Estrellas 1-5 -->
            <template v-else-if="item.tipo === 'STARS'">
              <div class="eq-stars-row">
                <button
                  v-for="s in 5" :key="s"
                  class="eq-star"
                  :class="{ 'eq-star-on': (answers[item.id]?.num ?? 0) >= s }"
                  type="button"
                  @click="setNum(item.id, s)"
                >★</button>
              </div>
            </template>

            <!-- Texto libre -->
            <template v-else-if="item.tipo === 'TEXT'">
              <textarea
                v-model="answers[item.id].txt"
                class="eq-textarea"
                rows="3"
                placeholder="Escribe tu respuesta aquí…"
              />
            </template>

            <!-- Sí / No -->
            <template v-else-if="item.tipo === 'YESNO'">
              <div class="eq-yn-row">
                <button
                  class="eq-yn-btn"
                  :class="{ 'eq-yn-selected eq-yn-yes': answers[item.id]?.bool === true }"
                  type="button"
                  @click="setBool(item.id, true)"
                >Sí, definitivamente</button>
                <button
                  class="eq-yn-btn"
                  :class="{ 'eq-yn-selected eq-yn-no': answers[item.id]?.bool === false }"
                  type="button"
                  @click="setBool(item.id, false)"
                >No por ahora</button>
              </div>
            </template>
          </div>

          <!-- Vacío -->
          <p v-if="!encuesta.items?.length" class="eq-empty-items">
            Esta encuesta aún no tiene preguntas configuradas.
          </p>

          <!-- Submit -->
          <button
            v-if="encuesta.items?.length"
            class="eq-submit"
            :disabled="!canSubmit || submitting"
            type="button"
            @click="enviar"
          >
            <span v-if="submitting">Enviando…</span>
            <span v-else>Enviar respuesta</span>
          </button>
          <p v-if="hasRequired" class="eq-hint">* Campos obligatorios</p>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getEncuestaPublic, responderEncuesta } from '@/services/encuestas.service'

const route = useRoute()

const loading    = ref(true)
const error      = ref(null)
const enviado    = ref(false)
const submitting = ref(false)
const encuesta   = ref(null)

// answers: { [itemId]: { num, txt, bool } }
const answers = reactive({})

const initAnswers = (items) => {
  for (const item of items) {
    answers[item.id] = { num: null, txt: '', bool: null }
  }
}

const setNum  = (id, val) => { answers[id].num = val }
const setBool = (id, val) => { answers[id].bool = val }

const npsColor = (n) => n >= 9 ? 'green' : n >= 7 ? 'yellow' : 'red'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

const hasRequired = computed(() => encuesta.value?.items?.some(i => i.requerida))

const canSubmit = computed(() => {
  if (!encuesta.value?.items?.length) return false
  return encuesta.value.items.every(item => {
    if (!item.requerida) return true
    const a = answers[item.id]
    if (!a) return false
    if (item.tipo === 'NPS' || item.tipo === 'STARS') return a.num !== null
    if (item.tipo === 'TEXT') return a.txt?.trim().length > 0
    if (item.tipo === 'YESNO') return a.bool !== null
    return true
  })
})

onMounted(async () => {
  try {
    const res = await getEncuestaPublic(route.params.token)
    encuesta.value = res.data
    initAnswers(res.data.items ?? [])
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Esta encuesta no está disponible'
  } finally {
    loading.value = false
  }
})

const enviar = async () => {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const respuestas = encuesta.value.items.map(item => {
      const a = answers[item.id]
      const entry = { itemId: item.id }
      if (item.tipo === 'NPS' || item.tipo === 'STARS') {
        if (a.num !== null) entry.valorNumerico = a.num
      } else if (item.tipo === 'TEXT') {
        if (a.txt?.trim()) entry.valorTexto = a.txt.trim()
      } else if (item.tipo === 'YESNO') {
        if (a.bool !== null) entry.valorBoolean = a.bool
      }
      return entry
    }).filter(r => Object.keys(r).length > 1)

    await responderEncuesta(route.params.token, { respuestas })
    enviado.value = true
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al enviar la respuesta'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.eq-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #073B42 0%, #16213e 60%, #0d1b2a 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px 16px;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.eq-card {
  background: #ffffff; border-radius: 20px;
  width: 100%; max-width: 540px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35); overflow: hidden;
}

/* Cover */
.eq-cover {
  height: 140px; background-size: cover; background-position: center;
}

/* Loading */
.eq-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px; gap: 16px; color: #64748b;
}
.eq-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #e2e8f0; border-top-color: #073B42;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* States */
.eq-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 32px; text-align: center;
}
.eq-icon-wrap {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 900; margin-bottom: 20px;
}
.eq-icon-green { background: #d1fae5; color: #065f46; }
.eq-icon-red   { background: #fee2e2; color: #991b1b; }
.eq-state h2 { font-size: 20px; font-weight: 700; color: #0f1a2e; margin: 0 0 10px; }
.eq-state p  { font-size: 14px; color: #64748b; margin: 0 0 6px; }
.eq-brand { font-weight: 700; color: #073B42 !important; }

/* Header */
.eq-header { background: #073B42; padding: 20px 32px 18px; text-align: center; }
.eq-logo     { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
.eq-logo-sub { font-size: 10px; color: #8EEAF3; letter-spacing: 3px; text-transform: uppercase; margin-top: 3px; }

/* Body */
.eq-body    { padding: 24px 32px 32px; }
.eq-title   { font-size: 20px; font-weight: 800; color: #0f1a2e; margin: 0 0 6px; }
.eq-desc    { font-size: 13px; color: #475569; margin: 0 0 8px; }
.eq-evento  { font-size: 13px; color: #64748b; margin: 0 0 22px; }
.eq-fecha   { color: #94a3b8; }

/* Field */
.eq-field    { margin-bottom: 22px; }
.eq-label    { display: block; font-size: 13px; font-weight: 600; color: #0f1a2e; margin-bottom: 10px; }
.eq-required { color: #e94560; margin-left: 2px; }

/* NPS */
.eq-nps-row { display: flex; gap: 5px; flex-wrap: wrap; }
.eq-nps-btn {
  width: 40px; height: 40px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #f8faff; font-size: 13px; font-weight: 700; color: #475569;
  cursor: pointer; transition: all 0.13s;
}
.eq-nps-btn:hover { border-color: #073B42; color: #073B42; }
.eq-nps-selected.eq-nps-green  { background: #d1fae5; border-color: #16a34a; color: #065f46; }
.eq-nps-selected.eq-nps-yellow { background: #fef3c7; border-color: #d97706; color: #92400e; }
.eq-nps-selected.eq-nps-red    { background: #fee2e2; border-color: #dc2626; color: #991b1b; }
.eq-nps-labels { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 5px; }

/* Stars */
.eq-stars-row { display: flex; gap: 4px; }
.eq-star {
  font-size: 28px; background: none; border: none; cursor: pointer;
  color: #e2e8f0; transition: color 0.1s; padding: 0; line-height: 1;
}
.eq-star:hover, .eq-star-on { color: #f59e0b; }

/* Yes/No */
.eq-yn-row { display: flex; gap: 10px; }
.eq-yn-btn {
  flex: 1; padding: 10px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #f8faff; font-size: 13px; font-weight: 600; color: #475569;
  cursor: pointer; transition: all 0.13s;
}
.eq-yn-btn:hover { border-color: #073B42; }
.eq-yn-selected.eq-yn-yes { background: #d1fae5; border-color: #16a34a; color: #065f46; }
.eq-yn-selected.eq-yn-no  { background: #fee2e2; border-color: #dc2626; color: #991b1b; }

/* Textarea */
.eq-textarea {
  width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: 13px; color: #0f1a2e;
  font-family: inherit; resize: vertical; outline: none;
  transition: border-color 0.13s; box-sizing: border-box;
}
.eq-textarea:focus { border-color: #073B42; }
.eq-textarea::placeholder { color: #94a3b8; }

/* Empty / Submit */
.eq-empty-items { text-align: center; color: #94a3b8; font-size: 13px; padding: 20px 0; }

.eq-submit {
  width: 100%; padding: 14px; border-radius: 10px; border: none;
  background: #073B42; color: #ffffff; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: background 0.15s; font-family: inherit;
}
.eq-submit:hover:not(:disabled) { background: #138E9C; }
.eq-submit:disabled { background: #94a3b8; cursor: not-allowed; }
.eq-hint { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 10px; }
</style>
