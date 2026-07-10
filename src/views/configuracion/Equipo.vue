<template>
  <div class="eq-page">
    <div class="eq-header">
      <div>
        <h1 class="eq-title">Equipo</h1>
        <p class="eq-subtitle">
          <span v-if="!loading">{{ totalActivos }} personas activas · {{ sedeBranches.length }} sede{{ sedeBranches.length === 1 ? '' : 's' }}</span>
          <span v-else>Cargando organigrama…</span>
        </p>
      </div>
      <button class="eq-refresh-btn" :disabled="loading" @click="load">
        <RefreshCw :size="15" :class="{ 'eq-spin': loading }" />
      </button>
    </div>

    <div v-if="error" class="eq-error">
      <AlertCircle :size="18" /> {{ error }}
      <button @click="load">Reintentar</button>
    </div>

    <div v-else class="eq-canvas-card">
      <!-- Toolbar: leyenda de niveles + controles de zoom -->
      <div class="eq-toolbar">
        <div class="eq-legend">
          <span class="eq-legend-label">Nivel</span>
          <span v-for="lvl in legendLevels" :key="lvl.rank" class="eq-legend-item">
            <span
              class="eq-legend-dot"
              :style="{ width: legendDotSize(lvl.rank) + 'px', height: legendDotSize(lvl.rank) + 'px', background: legendDotColor(lvl.rank) }"
            ></span>
            {{ lvl.label }}
          </span>
        </div>
        <div class="eq-zoom-controls">
          <button class="eq-zoom-btn" title="Alejar" @click="zoomBy(-0.15)"><Minus :size="14" /></button>
          <button class="eq-zoom-btn eq-zoom-btn--text" title="Centrar" @click="resetView">Centrar</button>
          <button class="eq-zoom-btn" title="Acercar" @click="zoomBy(0.15)"><Plus :size="14" /></button>
        </div>
      </div>

      <!-- Canvas -->
      <div class="eq-canvas-wrap" ref="wrapRef">
        <canvas
          ref="canvasRef"
          class="eq-canvas"
          :class="{ 'eq-canvas--grab': isPanning }"
          @mousemove="onMouseMove"
          @mouseleave="onMouseLeave"
          @mousedown="onMouseDown"
          @wheel.prevent="onWheel"
        ></canvas>

        <div v-if="loading" class="eq-loading-overlay">
          <div class="eq-loading-spinner" />
        </div>

        <Transition name="eq-tip-fade">
          <div
            v-if="tooltip"
            class="eq-tooltip"
            :style="{ left: tooltip.left + 'px', top: tooltip.top + 'px' }"
          >
            <div class="eq-tip-avatar" :style="{ background: tooltip.color }">
              <img v-if="tooltip.avatar" :src="tooltip.avatar" alt="" class="eq-tip-avatar-img" />
              <span v-else>{{ tooltip.initials }}</span>
            </div>
            <div class="eq-tip-body">
              <p class="eq-tip-name">{{ tooltip.name }}</p>
              <p class="eq-tip-role">{{ tooltip.roleLabel }}</p>
              <p v-if="tooltip.sedeName" class="eq-tip-sede"><MapPin :size="10" /> {{ tooltip.sedeName }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RefreshCw, AlertCircle, Plus, Minus, MapPin } from 'lucide-vue-next'
import { getCollaboratorCandidates } from '@/services/users.service.js'

/* ══════════════════════════════════════════════════════════════
   Datos
   ══════════════════════════════════════════════════════════════ */
const loading = ref(true)
const error   = ref(null)
const users   = ref([])

const load = async () => {
  loading.value = true
  error.value   = null
  try {
    const data = await getCollaboratorCandidates()
    users.value = data || []
    await nextTick()
    buildAndAnimate()
  } catch (e) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el equipo'
  } finally {
    loading.value = false
  }
}

/* ══════════════════════════════════════════════════════════════
   Roles → nivel jerárquico (no depende de parentId, que solo está
   cargado a medias — con esto TODOS quedan ubicados de forma
   predecible usando el dato que sí existe siempre: sus roles)
   ══════════════════════════════════════════════════════════════ */
const ROLE_RANK = {
  ADMIN: 1, BEONE: 1,
  ADMINISTRADOR: 1, DIRECCION: 1,
  EJECUTIVO_CUENTA: 2, EJECUTIVO: 2,
  LIDER: 3,
  SUPERVISOR: 4,
  COORDINADOR: 5,
  LOGISTICO: 6, OPERATIVO: 6,
  VISOR: 7,
}
const ROLE_LABEL = {
  ADMIN: 'Admin', BEONE: 'BeOne',
  ADMINISTRADOR: 'Administrador', DIRECCION: 'Dirección',
  LIDER: 'Líder', SUPERVISOR: 'Supervisor', COORDINADOR: 'Coordinador',
  EJECUTIVO_CUENTA: 'Ejecutivo de cuenta', EJECUTIVO: 'Ejecutivo',
  LOGISTICO: 'Logístico', OPERATIVO: 'Operativo', VISOR: 'Visor',
}
const LEVEL_LABEL = {
  0: 'Dirección', 1: 'Dirección', 2: 'Ejecutivo', 3: 'Líder', 4: 'Supervisor',
  5: 'Coordinador', 6: 'Logístico / Operativo', 7: 'Visor',
}

const primaryRole = (roles) =>
  [...(roles || [])].sort((a, b) => (ROLE_RANK[a] ?? 9) - (ROLE_RANK[b] ?? 9))[0]
// ADMIN+BEONE juntos son el nivel más alto de todos (por encima de ADMIN
// solo) — el resto de roles usa su rango normal. Ejecutivo/Ejecutivo de
// cuenta quedan justo debajo del bloque de Dirección, un nivel por encima
// de Líder.
const levelOf = (roles) => {
  if (roles?.includes('ADMIN') && roles?.includes('BEONE')) return 0
  return ROLE_RANK[primaryRole(roles)] ?? 9
}
// Caso especial: daimer003@gmail.com es la cuenta del desarrollador, no un
// admin funcional del negocio — en el organigrama se identifica como tal en
// vez de mostrar el rol técnico "Admin".
const roleLabel = (user) => {
  if (user?.email === 'daimer003@gmail.com') return 'Developer'
  return ROLE_LABEL[primaryRole(user?.roles)] ?? (user?.roles?.[0] ?? '—')
}
const initialsOf = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?'

// Paleta por sede — mismos colores usados en EjecutivosCuenta.vue para que
// una misma persona/sede se reconozca igual en toda la app.
const SEDE_COLORS = ['#27C8D8', '#7C3AED', '#16A34A', '#0EA5E9', '#C2410C', '#DB2777', '#65A30D']
const ROOT_COLOR  = '#B45309' // Dirección General: fuera de cualquier sede, color propio

/* ══════════════════════════════════════════════════════════════
   Construcción del árbol (posiciones en "espacio mundo", antes de
   pan/zoom) — raíz "Dirección General" arriba, una rama por sede
   debajo, y dentro de cada rama una fila por nivel de rol.
   ══════════════════════════════════════════════════════════════ */
const sedeBranches = ref([])
// /users/collaborators ya filtra isActive:true en el backend — no hace
// falta re-filtrar acá.
const totalActivos = computed(() => users.value.length)

const ROW_H     = 116
const NODE_GAP  = 96
const SEDE_GAP  = 64
const ROOT_Y    = 56
const HEADER_GAP = 108

// Nivel 0 (ADMIN+BEONE) es un poco más grande que el resto de Dirección —
// visualmente "el más alto de todos".
const NODE_RADIUS = { 0: 34, 1: 30, 2: 27, 3: 24, 4: 22, 5: 20, 6: 19, 7: 18 }
const nodeRadius = (lvl) => NODE_RADIUS[lvl] ?? 18

let worldNodes = []       // { id, x, y, r, kind:'person'|'sedeHeader', ... }
let worldConnectors = []  // { x1,y1,x2,y2, color, delay }
let worldWidth = 0
let worldHeight = 0

function buildTree() {
  const root = users.value.filter(u => levelOf(u.roles) <= 1)
  const rest = users.value.filter(u => levelOf(u.roles) > 1)

  const bySede = new Map()
  for (const u of rest) {
    const key = u.sedeId ?? 'none'
    if (!bySede.has(key)) bySede.set(key, { id: u.sedeId ?? null, nombre: u.sede?.nombre || 'Sin sede asignada', users: [] })
    bySede.get(key).users.push(u)
  }
  const branches = [...bySede.values()].sort((a, b) => {
    if (a.nombre === 'Sin sede asignada') return 1
    if (b.nombre === 'Sin sede asignada') return -1
    return a.nombre.localeCompare(b.nombre)
  })
  branches.forEach((b, i) => { b.color = b.nombre === 'Sin sede asignada' ? '#94A3B8' : SEDE_COLORS[i % SEDE_COLORS.length] })

  for (const branch of branches) {
    const byLevel = new Map()
    for (const u of branch.users) {
      const lvl = levelOf(u.roles)
      if (!byLevel.has(lvl)) byLevel.set(lvl, [])
      byLevel.get(lvl).push(u)
    }
    branch.levels = [...byLevel.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([level, list]) => ({ level, users: list.sort((a, b) => a.fullName.localeCompare(b.fullName)) }))
  }

  sedeBranches.value = branches
  return { root: root.sort((a, b) => levelOf(a.roles) - levelOf(b.roles) || a.fullName.localeCompare(b.fullName)), branches }
}

function computeLayout() {
  const { root, branches } = buildTree()
  const nodes = []
  const connectors = []
  let delayStep = 0
  const nextDelay = () => (delayStep++) * 28

  // 1. Raíz — DOS filas separadas, no una sola con nodos de distinto tamaño
  // (eso no se distinguía a simple vista). ADMIN+BEONE (nivel 0) va en su
  // propia fila arriba de todo; el resto de Dirección (ADMIN/BEONE solos,
  // ADMINISTRADOR/DIRECCION) va en la fila de abajo, conectada hacia arriba.
  const topTier  = root.filter(u => levelOf(u.roles) === 0)
  const restTier = root.filter(u => levelOf(u.roles) > 0)
  const TOP_TIER_GAP = 112 // deja espacio para la etiqueta nombre/rol del nivel 0 sin chocar con la fila de abajo

  const topRowW = Math.max(0, (topTier.length - 1) * NODE_GAP)
  const topStartX = -topRowW / 2
  topTier.forEach((u, i) => {
    nodes.push({
      id: `u-${u.id}`, kind: 'person', user: u, level: 0,
      x: topStartX + i * NODE_GAP, y: ROOT_Y, r: nodeRadius(0),
      color: ROOT_COLOR, delay: nextDelay(),
    })
  })
  const topCenterX = topTier.length ? topStartX + topRowW / 2 : 0
  const topBottomY = ROOT_Y + nodeRadius(0)

  const direccionY = topTier.length ? ROOT_Y + TOP_TIER_GAP : ROOT_Y
  const restRowW = Math.max(0, (restTier.length - 1) * NODE_GAP)
  const restStartX = -restRowW / 2
  restTier.forEach((u, i) => {
    const nx = restStartX + i * NODE_GAP
    const lvl = levelOf(u.roles)
    const d = nextDelay()
    if (topTier.length) {
      connectors.push({ x1: topCenterX, y1: topBottomY, x2: nx, y2: direccionY - nodeRadius(lvl), color: ROOT_COLOR, delay: d })
    }
    nodes.push({ id: `u-${u.id}`, kind: 'person', user: u, level: lvl, x: nx, y: direccionY, r: nodeRadius(lvl), color: ROOT_COLOR, delay: d })
  })
  const rootCenterX = restTier.length ? restStartX + restRowW / 2 : topCenterX
  const rootBottomY = direccionY + (restTier.length ? nodeRadius(1) : nodeRadius(0))

  // 2. Ramas por sede
  const headerY = direccionY + HEADER_GAP
  const branchMeta = branches.map(branch => {
    const maxRow = Math.max(1, ...branch.levels.map(l => l.users.length))
    return { branch, width: (maxRow - 1) * NODE_GAP + 56 }
  })
  const totalW = branchMeta.reduce((s, b) => s + b.width, 0) + SEDE_GAP * Math.max(0, branchMeta.length - 1)
  let cursorX = -totalW / 2
  let maxY = headerY

  for (const { branch, width } of branchMeta) {
    const centerX = cursorX + width / 2

    connectors.push({ x1: rootCenterX, y1: rootBottomY, x2: centerX, y2: headerY - 22, color: branch.color, delay: nextDelay() })
    nodes.push({
      id: `sede-${branch.id ?? 'none'}`, kind: 'sedeHeader',
      x: centerX, y: headerY, label: branch.nombre, count: branch.users.length,
      color: branch.color, delay: nextDelay(),
    })

    let prevY = headerY
    branch.levels.forEach((lvlGroup, idx) => {
      const rowY = headerY + ROW_H * (idx + 1)
      const rowW = (lvlGroup.users.length - 1) * NODE_GAP
      const rowStartX = centerX - rowW / 2
      lvlGroup.users.forEach((u, i) => {
        const nx = rowStartX + i * NODE_GAP
        const d = nextDelay()
        connectors.push({ x1: centerX, y1: prevY + (prevY === headerY ? 20 : 0), x2: nx, y2: rowY, color: branch.color, delay: d })
        nodes.push({
          id: `u-${u.id}`, kind: 'person', user: u, level: lvlGroup.level,
          x: nx, y: rowY, r: nodeRadius(lvlGroup.level), color: branch.color, delay: d,
        })
      })
      prevY = rowY
      maxY = Math.max(maxY, rowY)
    })

    cursorX += width + SEDE_GAP
  }

  worldNodes = nodes
  worldConnectors = connectors
  worldWidth = totalW
  worldHeight = maxY - ROOT_Y + 80
}

/* ══════════════════════════════════════════════════════════════
   Canvas: cámara (pan/zoom), animación de entrada y dibujo
   ══════════════════════════════════════════════════════════════ */
const wrapRef   = ref(null)
const canvasRef = ref(null)
let ctx = null
let dpr = 1

const camera = { x: 0, y: 0, scale: 1 } // x,y = offset en px de pantalla del origen "mundo"
let animStart = 0
const ANIM_DURATION = 480
let rafId = null
let needsRedraw = true

const isPanning = ref(false)
let panStart = null

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

function worldToScreen(x, y) {
  return { x: camera.x + x * camera.scale, y: camera.y + y * camera.scale }
}
function screenToWorld(x, y) {
  return { x: (x - camera.x) / camera.scale, y: (y - camera.y) / camera.scale }
}

function resizeCanvas() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = wrap.clientWidth
  const h = wrap.clientHeight
  canvas.width  = w * dpr
  canvas.height = h * dpr
  canvas.style.width  = w + 'px'
  canvas.style.height = h + 'px'
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  needsRedraw = true
}

function resetView() {
  const wrap = wrapRef.value
  if (!wrap || !worldWidth) return
  const w = wrap.clientWidth
  const h = wrap.clientHeight
  const pad = 60
  const scaleX = (w - pad * 2) / Math.max(worldWidth, 1)
  const scaleY = (h - pad * 2) / Math.max(worldHeight, 1)
  camera.scale = Math.min(1.05, Math.max(0.35, Math.min(scaleX, scaleY)))
  camera.x = w / 2
  camera.y = pad - ROOT_Y * camera.scale + 26
  needsRedraw = true
}

function zoomBy(delta) {
  const wrap = wrapRef.value
  if (!wrap) return
  const cx = wrap.clientWidth / 2
  const cy = wrap.clientHeight / 2
  const before = screenToWorld(cx, cy)
  camera.scale = Math.min(2.2, Math.max(0.3, camera.scale + delta))
  const after = worldToScreen(before.x, before.y)
  camera.x += cx - after.x
  camera.y += cy - after.y
  needsRedraw = true
}

function onWheel(e) {
  zoomBy(e.deltaY < 0 ? 0.08 : -0.08)
}

function onMouseDown(e) {
  isPanning.value = true
  panStart = { x: e.clientX - camera.x, y: e.clientY - camera.y }
}
function onMouseMoveWindow(e) {
  if (!isPanning.value || !panStart) return
  camera.x = e.clientX - panStart.x
  camera.y = e.clientY - panStart.y
  needsRedraw = true
}
function onMouseUpWindow() {
  isPanning.value = false
  panStart = null
}

/* ─── hover / tooltip ─── */
const tooltip = ref(null)
let hoveredId = null

function onMouseMove(e) {
  if (isPanning.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  const world = screenToWorld(sx, sy)

  let found = null
  for (let i = worldNodes.length - 1; i >= 0; i--) {
    const n = worldNodes[i]
    if (n.kind !== 'person') continue
    const dx = world.x - n.x
    const dy = world.y - n.y
    if (Math.sqrt(dx * dx + dy * dy) <= n.r + 3) { found = n; break }
  }

  if (found) {
    hoveredId = found.id
    tooltip.value = {
      left: sx + 16,
      top: sy - 8,
      name: found.user.fullName,
      roleLabel: roleLabel(found.user),
      sedeName: found.user.sede?.nombre || null,
      initials: initialsOf(found.user.fullName),
      avatar: found.user.avatar || null,
      color: found.color,
    }
    canvasRef.value.style.cursor = 'pointer'
  } else {
    hoveredId = null
    tooltip.value = null
    canvasRef.value.style.cursor = isPanning.value ? 'grabbing' : 'grab'
  }
  needsRedraw = true
}
function onMouseLeave() {
  hoveredId = null
  tooltip.value = null
  needsRedraw = true
}

/* ─── avatares (fotos de perfil) ───
   Se cargan bajo demanda y se cachean por URL; mientras no estén listas (o si
   el usuario no tiene foto) el nodo se dibuja con el círculo de color +
   iniciales de siempre, sin bloquear el render. */
const avatarCache = new Map() // url -> { img, loaded }
function getLoadedAvatar(url) {
  if (!url) return null
  let entry = avatarCache.get(url)
  if (!entry) {
    // Sin crossOrigin: solo se dibuja (drawImage), nunca se lee el canvas de
    // vuelta (getImageData/toDataURL) — pedir CORS acá solo lograría que R2
    // (que no manda Access-Control-Allow-Origin) rechace la carga.
    const img = new Image()
    entry = { img, loaded: false }
    img.onload  = () => { entry.loaded = true; needsRedraw = true }
    img.onerror = () => { entry.loaded = false }
    img.src = url
    avatarCache.set(url, entry)
  }
  return entry.loaded ? entry.img : null
}

/* ─── dibujo ─── */
function draw() {
  if (!ctx) return
  const wrap = wrapRef.value
  const w = wrap.clientWidth
  const h = wrap.clientHeight

  ctx.clearRect(0, 0, w, h)

  // fondo: puntos sutiles
  ctx.save()
  ctx.fillStyle = '#CBD5E1'
  const gridStep = 26 * camera.scale
  if (gridStep > 8) {
    const offX = camera.x % gridStep
    const offY = camera.y % gridStep
    ctx.globalAlpha = 0.35
    for (let gx = offX; gx < w; gx += gridStep) {
      for (let gy = offY; gy < h; gy += gridStep) {
        ctx.beginPath()
        ctx.arc(gx, gy, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()

  const now = performance.now()
  const elapsed = now - animStart

  // conectores
  for (const c of worldConnectors) {
    const t = Math.min(1, Math.max(0, (elapsed - c.delay) / ANIM_DURATION))
    if (t <= 0) continue
    const e = easeOutCubic(t)
    const p1 = worldToScreen(c.x1, c.y1)
    const p2 = worldToScreen(c.x2, c.y2)
    const midY = p1.y + (p2.y - p1.y) * 0.55
    const curX = p1.x + (p2.x - p1.x) * e
    const curY = p1.y + (p2.y - p1.y) * e

    ctx.save()
    ctx.strokeStyle = c.color
    ctx.globalAlpha = 0.4 * e
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.bezierCurveTo(p1.x, midY, p2.x, midY, curX, curY)
    ctx.stroke()
    ctx.restore()
  }

  // nodos
  for (const n of worldNodes) {
    const t = Math.min(1, Math.max(0, (elapsed - n.delay) / ANIM_DURATION))
    if (t <= 0) continue
    const e = easeOutCubic(t)
    const p = worldToScreen(n.x, n.y)
    const isHover = n.id === hoveredId

    if (n.kind === 'sedeHeader') {
      drawSedeHeader(n, p, e)
      continue
    }

    const r = n.r * camera.scale * (0.4 + 0.6 * e) * (isHover ? 1.14 : 1)

    const avatarImg = getLoadedAvatar(n.user.avatar)

    ctx.save()
    ctx.globalAlpha = e

    // sombra + círculo base (de color) — sirve de fondo propio si no hay
    // foto, y de "marco" visible detrás del recorte circular si sí la hay
    ctx.shadowColor = 'rgba(15,26,46,0.22)'
    ctx.shadowBlur = isHover ? 16 : 8
    ctx.shadowOffsetY = 3
    const grad = ctx.createLinearGradient(p.x - r, p.y - r, p.x + r, p.y + r)
    grad.addColorStop(0, lighten(n.color, 14))
    grad.addColorStop(1, n.color)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    if (avatarImg) {
      // foto de perfil, recortada al círculo y ajustada tipo "cover"
      ctx.save()
      ctx.beginPath()
      ctx.arc(p.x, p.y, r - 1, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      const iw = avatarImg.naturalWidth || 1
      const ih = avatarImg.naturalHeight || 1
      const coverScale = Math.max((r * 2) / iw, (r * 2) / ih)
      const dw = iw * coverScale
      const dh = ih * coverScale
      ctx.drawImage(avatarImg, p.x - dw / 2, p.y - dh / 2, dw, dh)
      ctx.restore()
    } else {
      // sin foto — iniciales sobre el círculo de color
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${Math.max(9, r * 0.62)}px 'Inter', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initialsOf(n.user.fullName), p.x, p.y + 0.5)
    }

    // anillo, encima de la foto o las iniciales
    ctx.lineWidth = isHover ? 3 : 2
    ctx.strokeStyle = isHover ? '#fff' : 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // etiqueta nombre/rol debajo (solo si hay zoom suficiente para leerse)
    if (camera.scale > 0.55) {
      ctx.save()
      ctx.globalAlpha = e
      ctx.font = `600 ${11}px 'Inter', sans-serif`
      ctx.fillStyle = isHover ? '#0F1A2E' : '#334155'
      ctx.textAlign = 'center'
      const firstName = n.user.fullName.split(' ')[0]
      ctx.fillText(firstName, p.x, p.y + r + 15)
      ctx.font = `500 9.5px 'Inter', sans-serif`
      ctx.fillStyle = '#94A3B8'
      ctx.fillText(roleLabel(n.user), p.x, p.y + r + 28)
      ctx.restore()
    }
  }
}

function drawSedeHeader(n, p, e) {
  ctx.save()
  ctx.globalAlpha = e
  const scale = 0.5 + 0.5 * e
  const padX = 16 * scale
  const textLabel = `🏢  ${n.label}`
  ctx.font = `700 ${13 * camera.scale}px 'Inter', sans-serif`
  const textW = ctx.measureText(textLabel).width
  const boxW = textW + padX * 2
  const boxH = 30 * camera.scale * scale

  ctx.shadowColor = 'rgba(15,26,46,0.18)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2
  ctx.fillStyle = n.color
  roundRect(ctx, p.x - boxW / 2, p.y - boxH / 2, boxW, boxH, boxH / 2)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(textLabel, p.x, p.y + 1)

  if (camera.scale > 0.5) {
    ctx.font = `600 ${10 * camera.scale}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(`${n.count}`, p.x + boxW / 2 + 14, p.y + 1)
  }
  ctx.restore()
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function lighten(hex, amt) {
  const n = hex.replace('#', '')
  const num = parseInt(n, 16)
  let r = (num >> 16) + amt
  let g = ((num >> 8) & 0xff) + amt
  let b = (num & 0xff) + amt
  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function loop() {
  const elapsed = performance.now() - animStart
  if (elapsed < ANIM_DURATION + 400 || needsRedraw) {
    draw()
    needsRedraw = false
  }
  rafId = requestAnimationFrame(loop)
}

function buildAndAnimate() {
  computeLayout()
  resizeCanvas()
  resetView()
  animStart = performance.now()
  needsRedraw = true
}

/* ══════════════════════════════════════════════════════════════
   Leyenda
   ══════════════════════════════════════════════════════════════ */
// worldNodes es una variable plana (no reactiva, se muta en cada layout por
// performance en el loop de canvas) — la leyenda se deriva de `users`
// directamente, que sí es reactivo, para no quedar pegada al primer render.
const legendLevels = computed(() => {
  const present = new Set(users.value.map(u => levelOf(u.roles)))
  return Object.keys(LEVEL_LABEL)
    .map(Number)
    .filter(r => present.has(r) || r <= 1)
    .filter((r, i, arr) => arr.findIndex(x => LEVEL_LABEL[x] === LEVEL_LABEL[r]) === i)
    .sort((a, b) => a - b)
    .map(rank => ({ rank, label: LEVEL_LABEL[rank] }))
})
function legendDotSize(rank) { return Math.max(10, nodeRadius(rank) * 0.6) }
// Tamaño Y tono comunican el nivel en la leyenda (el color del nodo en el
// árbol identifica la sede, no el nivel — acá sí es una escala secuencial
// clara de más oscuro/arriba a más claro/abajo).
function legendDotColor(rank) {
  const t = rank / 7
  const from = [15, 26, 46]   // #0F1A2E
  const to   = [196, 203, 214] // #C4CBD6
  const mix = (a, b) => Math.round(a + (b - a) * t)
  return `rgb(${mix(from[0], to[0])}, ${mix(from[1], to[1])}, ${mix(from[2], to[2])})`
}

/* ══════════════════════════════════════════════════════════════
   Lifecycle
   ══════════════════════════════════════════════════════════════ */
let resizeObserver = null

onMounted(async () => {
  await load()
  resizeObserver = new ResizeObserver(() => { resizeCanvas(); needsRedraw = true })
  if (wrapRef.value) resizeObserver.observe(wrapRef.value)
  window.addEventListener('mousemove', onMouseMoveWindow)
  window.addEventListener('mouseup', onMouseUpWindow)
  rafId = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('mousemove', onMouseMoveWindow)
  window.removeEventListener('mouseup', onMouseUpWindow)
})
</script>

<style scoped>
.eq-page { width: 100%; }

.eq-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.eq-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: var(--text-1, #0F1A2E);
  margin: 0 0 4px; line-height: 1.2;
}
.eq-subtitle { font-size: 13px; color: var(--text-3, #94A3B8); font-family: 'Inter', sans-serif; margin: 0; }

.eq-refresh-btn {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid #E2EBF6;
  background: #fff; color: #64748B; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.eq-refresh-btn:hover:not(:disabled) { background: #F0FAFB; color: #27C8D8; border-color: #A7EEF5; }
.eq-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.eq-spin { animation: eq-spin 0.9s linear infinite; }
@keyframes eq-spin { to { transform: rotate(360deg); } }

.eq-error {
  display: flex; align-items: center; gap: 10px; padding: 16px 18px;
  background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px;
  color: #B91C1C; font-size: 13px; font-family: 'Inter', sans-serif;
}
.eq-error button {
  margin-left: auto; padding: 6px 14px; border-radius: 8px; border: 1px solid #FECACA;
  background: #fff; color: #B91C1C; font-weight: 600; font-size: 12px; cursor: pointer;
}

.eq-canvas-card {
  background: #fff; border-radius: 18px; border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  overflow: hidden;
}

.eq-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  padding: 14px 18px; border-bottom: 1px solid #F0FAFB;
}
.eq-legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.eq-legend-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: #94A3B8; font-family: 'Inter', sans-serif;
}
.eq-legend-item {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; color: #475569; font-family: 'Inter', sans-serif;
}
.eq-legend-dot { border-radius: 50%; background: linear-gradient(135deg, #94A3B8, #64748B); flex-shrink: 0; }

.eq-zoom-controls { display: flex; align-items: center; gap: 6px; }
.eq-zoom-btn {
  height: 30px; min-width: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid #E2E8F0;
  background: #fff; color: #64748B; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.12s; font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif;
}
.eq-zoom-btn:hover { background: #E0F9FA; color: #27C8D8; border-color: #A7EEF5; }
.eq-zoom-btn--text { width: auto; }

.eq-canvas-wrap {
  position: relative;
  height: min(72vh, 620px);
  background: radial-gradient(ellipse at 50% 0%, #FAFEFF 0%, #F4F9FB 60%, #F0F7F9 100%);
}
.eq-canvas { display: block; width: 100%; height: 100%; cursor: grab; }
.eq-canvas--grab { cursor: grabbing; }

.eq-loading-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.5);
}
.eq-loading-spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid #E0F9FA; border-top-color: #27C8D8;
  animation: eq-spin 0.7s linear infinite;
}

.eq-tooltip {
  position: absolute; z-index: 10; pointer-events: none;
  display: flex; align-items: center; gap: 10px;
  background: #0F1A2E; border-radius: 12px; padding: 10px 14px;
  box-shadow: 0 8px 24px rgba(15,26,46,.28);
  max-width: 240px;
}
.eq-tip-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700; font-family: 'Inter', sans-serif;
  overflow: hidden;
}
.eq-tip-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.eq-tip-body { min-width: 0; }
.eq-tip-name { font-size: 13px; font-weight: 700; color: #fff; margin: 0; font-family: 'Inter', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eq-tip-role { font-size: 11.5px; color: #A7EEF5; margin: 1px 0 0; font-family: 'Inter', sans-serif; }
.eq-tip-sede { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #94A3B8; margin: 3px 0 0; font-family: 'Inter', sans-serif; }

.eq-tip-fade-enter-active, .eq-tip-fade-leave-active { transition: opacity 0.12s ease; }
.eq-tip-fade-enter-from, .eq-tip-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .eq-canvas-wrap { height: 78vh; }
  .eq-toolbar { flex-direction: column; align-items: flex-start; }
}
</style>
