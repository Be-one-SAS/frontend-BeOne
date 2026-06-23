<template>
  <div class="orgchart-wrap" ref="wrapRef">
    <canvas
      ref="canvasRef"
      class="orgchart-canvas"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    />
    <div
      v-if="tip.visible"
      class="orgchart-tooltip"
      :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
    >
      <span v-if="tip.tag" class="ott-tag">{{ tip.tag }}</span>
      <span class="ott-name">{{ tip.name }}</span>
      <span v-if="tip.sub" class="ott-sub">{{ tip.sub }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({ sedes: { type: Array, default: () => [] } })

const wrapRef   = ref(null)
const canvasRef = ref(null)
const tip = ref({ visible: false, x: 0, y: 0, name: '', tag: '', sub: '' })

// ── Logical canvas size (CSS pixels) ──────────────────────────────
let lw = 0   // logical width
let lh = 0   // logical height

// ── Layout constants ──────────────────────────────────────────────
const ROOT_W = 180; const ROOT_H = 60
const SEDE_W = 152; const SEDE_H = 54
const USER_W = 132; const USER_H = 46
const GAP_V  = 110  // vertical gap between levels
const GAP_H  = 18   // min horizontal gap between nodes
const PAD    = 24   // canvas horizontal padding

// ── Palette ───────────────────────────────────────────────────────
const PALETTE = ['#054EAF','#0369A1','#0F766E','#6D28D9','#BE185D','#D97706','#047857','#B45309']
const rgba = (hex, a) => {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

// ── Animation ─────────────────────────────────────────────────────
let raf      = null
let prog     = 0
let hovered  = null
let hitList  = []   // [{id, x,y,w,h, tag,name,sub}]

// ── Setup canvas (called on mount and resize) ─────────────────────
function setupCanvas() {
  const canvas = canvasRef.value
  const wrap   = wrapRef.value
  if (!canvas || !wrap) return false
  const W = wrap.clientWidth
  if (W === 0) return false

  const layout = buildLayout(W)
  const H = computeH(layout)

  lw = W
  lh = H

  const dpr = window.devicePixelRatio || 1
  canvas.width  = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  canvas.style.width  = W + 'px'
  canvas.style.height = H + 'px'
  // Always reset transform before scaling (prevents cumulative DPR)
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
  return true
}

// ── Layout ────────────────────────────────────────────────────────
function buildLayout(W) {
  const cx = W / 2

  const root = {
    id: '__root__', type: 'root',
    label: 'BeOne', sub: 'Nivel global',
    x: cx, y: PAD + ROOT_H / 2,
    w: ROOT_W, h: ROOT_H, color: '#0F1A2E',
  }

  const sedes = (props.sedes ?? []).map((s, i) => {
    const color = PALETTE[i % PALETTE.length]
    const users = (s.usuarios ?? []).map(u => ({
      id: `u${u.id}`, type: 'user',
      label: shortName(u.fullName),
      sub: u.role,
      isLider: s.lider?.id === u.id,
      color, w: USER_W, h: USER_H, x: 0, y: 0,
    }))
    return {
      id: `s${s.id}`, type: 'sede',
      label: s.nombre, sub: s.ciudad,
      lider: s.lider?.fullName ?? null,
      activa: s.activa !== false,
      color, w: SEDE_W, h: SEDE_H, x: 0, y: 0,
      children: users,
    }
  })

  // Column widths: each sede column = max(SEDE_W, users_row_width)
  const colW = sedes.map(s => {
    const uRow = s.children.length * USER_W + Math.max(0, s.children.length - 1) * GAP_H
    return Math.max(SEDE_W, uRow)
  })
  const totalW = colW.reduce((a,b) => a+b, 0) + Math.max(0, sedes.length-1) * GAP_H * 2

  // Center sedes; if wider than canvas, spread from PAD
  let sx = totalW <= (W - PAD*2) ? (W - totalW) / 2 : PAD

  const sedeY = root.y + ROOT_H/2 + GAP_V

  sedes.forEach((s, i) => {
    s.x = sx + colW[i] / 2
    s.y = sedeY + SEDE_H / 2

    const uCount = s.children.length
    const uRow   = uCount * USER_W + Math.max(0, uCount-1) * GAP_H
    let ux = s.x - uRow / 2 + USER_W / 2
    const uY = sedeY + SEDE_H/2 + GAP_V

    s.children.forEach(u => {
      u.x = ux
      u.y = uY + USER_H / 2
      ux += USER_W + GAP_H
    })

    sx += colW[i] + GAP_H * 2
  })

  return { root, sedes }
}

function computeH({ sedes }) {
  const hasUsers = sedes.some(s => s.children.length > 0)
  const base = PAD + ROOT_H + GAP_V + SEDE_H
  return hasUsers ? base + GAP_V + USER_H + PAD * 2 : base + PAD * 2
}

// ── Draw ──────────────────────────────────────────────────────────
function draw(p = 1) {
  const canvas = canvasRef.value
  if (!canvas || lw === 0) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, lw, lh)
  hitList = []

  const { root, sedes } = buildLayout(lw)

  // ── Draw connections ────────────────────────────────────────────
  sedes.forEach(s => {
    curve(ctx, root.x, root.y + ROOT_H/2, s.x, s.y - SEDE_H/2, '#CBD5E1', p, 1.5)
    s.children.forEach(u => {
      curve(ctx, s.x, s.y + SEDE_H/2, u.x, u.y - USER_H/2, rgba(s.color, 0.3), p, 1)
    })
  })

  // ── Draw nodes ──────────────────────────────────────────────────
  drawRoot(ctx, root, p)
  sedes.forEach(s => {
    drawSede(ctx, s, p)
    s.children.forEach(u => drawUser(ctx, u, p))
  })

  // ── Empty hint ──────────────────────────────────────────────────
  if (!sedes.length) {
    ctx.save()
    ctx.globalAlpha = p * 0.4
    ctx.fillStyle = '#94A3B8'
    ctx.font = '13px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Crea la primera sede para ver el organigrama aquí', lw/2, lh/2 + 30)
    ctx.restore()
  }
}

// ── Node renderers ────────────────────────────────────────────────
function drawRoot(ctx, n, p) {
  const hs = hovered === n.id ? 1.04 : 1
  ctx.save()
  ctx.globalAlpha = p
  ctx.translate(n.x, n.y)
  ctx.scale(hs, hs)

  ctx.shadowColor   = 'rgba(5,78,175,0.28)'
  ctx.shadowBlur    = hovered === n.id ? 20 : 10
  ctx.shadowOffsetY = 3

  const g = ctx.createLinearGradient(-ROOT_W/2, -ROOT_H/2, ROOT_W/2, ROOT_H/2)
  g.addColorStop(0, '#0F1A2E')
  g.addColorStop(1, '#054EAF')
  rr(ctx, -ROOT_W/2, -ROOT_H/2, ROOT_W, ROOT_H, 14)
  ctx.fillStyle = g; ctx.fill()
  ctx.shadowColor = 'transparent'

  // Icon bg
  ctx.beginPath(); ctx.arc(-ROOT_W/2+26, 0, 14, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill()
  ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('🏛', -ROOT_W/2+26, 1)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 13px Inter, sans-serif'; ctx.textAlign = 'left'
  ctx.fillText('BeOne', -ROOT_W/2+48, -7)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '10px Inter, sans-serif'
  ctx.fillText('Organización · visibilidad global', -ROOT_W/2+48, 9)

  ctx.restore()
  hitList.push({ id: n.id, x: n.x-ROOT_W/2, y: n.y-ROOT_H/2, w: ROOT_W, h: ROOT_H, tag: 'Raíz', name: 'BeOne', sub: 'Todas las sedes' })
}

function drawSede(ctx, n, p) {
  const hs = hovered === n.id ? 1.04 : 1
  ctx.save()
  ctx.globalAlpha = n.activa ? p : p * 0.5
  ctx.translate(n.x, n.y)
  ctx.scale(hs, hs)

  ctx.shadowColor = rgba(n.color, 0.2); ctx.shadowBlur = hovered === n.id ? 16 : 7; ctx.shadowOffsetY = 2
  rr(ctx, -SEDE_W/2, -SEDE_H/2, SEDE_W, SEDE_H, 12); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.shadowColor = 'transparent'

  // Color bar
  rr(ctx, -SEDE_W/2, -SEDE_H/2, 5, SEDE_H, 6)
  ctx.fillStyle = n.color; ctx.fill()

  // Avatar
  ctx.beginPath(); ctx.arc(-SEDE_W/2+24, 0, 13, 0, Math.PI*2)
  ctx.fillStyle = rgba(n.color, 0.1); ctx.fill()
  ctx.fillStyle = n.color; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(n.label.charAt(0).toUpperCase(), -SEDE_W/2+24, 0)

  const tx = -SEDE_W/2 + 44
  ctx.textAlign = 'left'
  ctx.fillStyle = '#0F172A'; ctx.font = 'bold 12px Inter, sans-serif'
  ctx.fillText(clip(ctx, n.label, SEDE_W - 56), tx, -7)
  ctx.fillStyle = '#94A3B8'; ctx.font = '10px Inter, sans-serif'
  ctx.fillText(clip(ctx, n.sub ?? '', SEDE_W - 56), tx, 8)

  ctx.restore()
  hitList.push({
    id: n.id, x: n.x-SEDE_W/2, y: n.y-SEDE_H/2, w: SEDE_W, h: SEDE_H,
    tag: 'Sede', name: n.label,
    sub: n.lider ? `Líder: ${n.lider}` : 'Sin líder asignado',
  })
}

function drawUser(ctx, n, p) {
  const hs = hovered === n.id ? 1.06 : 1
  ctx.save()
  ctx.globalAlpha = p
  ctx.translate(n.x, n.y)
  ctx.scale(hs, hs)

  ctx.shadowColor = rgba(n.color, 0.12); ctx.shadowBlur = hovered === n.id ? 10 : 4; ctx.shadowOffsetY = 1
  rr(ctx, -USER_W/2, -USER_H/2, USER_W, USER_H, 10)
  ctx.fillStyle = n.isLider ? rgba(n.color, 0.07) : '#F8FAFC'; ctx.fill()
  if (n.isLider) {
    ctx.strokeStyle = rgba(n.color, 0.35); ctx.lineWidth = 1.5
    rr(ctx, -USER_W/2, -USER_H/2, USER_W, USER_H, 10); ctx.stroke()
  }
  ctx.shadowColor = 'transparent'

  // Avatar
  ctx.beginPath(); ctx.arc(-USER_W/2+19, 0, 12, 0, Math.PI*2)
  ctx.fillStyle = n.isLider ? n.color : rgba(n.color, 0.18); ctx.fill()
  ctx.fillStyle = n.isLider ? '#fff' : n.color
  ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(n.label.charAt(0).toUpperCase(), -USER_W/2+19, 0)

  const tx = -USER_W/2+36
  ctx.textAlign = 'left'
  ctx.fillStyle = '#0F172A'; ctx.font = `${n.isLider ? 'bold' : ''} 11px Inter, sans-serif`.trim()
  ctx.fillText(clip(ctx, n.label, USER_W - 46), tx, -6)
  ctx.fillStyle = '#94A3B8'; ctx.font = '9.5px Inter, sans-serif'
  ctx.fillText(clip(ctx, n.sub ?? '', USER_W - 46), tx, 7)

  if (n.isLider) {
    ctx.fillStyle = n.color; ctx.font = '9px sans-serif'; ctx.textAlign = 'right'
    ctx.fillText('★', USER_W/2 - 6, 2)
  }

  ctx.restore()
  hitList.push({
    id: n.id, x: n.x-USER_W/2, y: n.y-USER_H/2, w: USER_W, h: USER_H,
    tag: n.sub, name: n.label,
    sub: n.isLider ? '★ Líder de sede' : '',
  })
}

// ── Primitives ────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) {
  const tl = Array.isArray(r) ? r[0] : r
  const tr = Array.isArray(r) ? r[1] : r
  const br = Array.isArray(r) ? r[2] : r
  const bl = Array.isArray(r) ? r[3] : r
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y);              ctx.quadraticCurveTo(x+w, y,   x+w, y+tr)
  ctx.lineTo(x + w, y + h - br);          ctx.quadraticCurveTo(x+w, y+h, x+w-br, y+h)
  ctx.lineTo(x + bl, y + h);              ctx.quadraticCurveTo(x,   y+h, x,  y+h-bl)
  ctx.lineTo(x, y + tl);                  ctx.quadraticCurveTo(x,   y,   x+tl, y)
  ctx.closePath()
}

function curve(ctx, x1, y1, x2, y2, color, p, lw) {
  const mid = (y2 - y1) * 0.45
  ctx.save()
  ctx.globalAlpha = p
  ctx.strokeStyle = color; ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1, y1 + mid, x2, y2 - mid, x2, y2)
  ctx.stroke()
  ctx.restore()
}

function clip(ctx, text, maxW) {
  if (!text || ctx.measureText(text).width <= maxW) return text || ''
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0,-1)
  return t + '…'
}

function shortName(name = '') {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : name
}

// ── Animation ─────────────────────────────────────────────────────
function animateTo(target = 1) {
  if (raf) cancelAnimationFrame(raf)
  setupCanvas()   // called ONCE — sets dimensions and initial transform
  const t0   = performance.now()
  const from = prog
  const dur  = 500

  function tick(now) {
    const t = Math.min((now - t0) / dur, 1)
    const e = t < 0.5 ? 2*t*t : -1+(4-2*t)*t   // easeInOut
    prog = from + (target - from) * e
    draw(prog)   // just draw — no canvas resize here
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

// ── Interaction ───────────────────────────────────────────────────
function onMouseMove(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const found = hitList.find(n => mx >= n.x && mx <= n.x+n.w && my >= n.y && my <= n.y+n.h)
  if (found) {
    if (hovered !== found.id) { hovered = found.id; draw(prog) }
    tip.value = { visible: true, x: mx + 14, y: my - 12, tag: found.tag, name: found.name, sub: found.sub }
    canvasRef.value.style.cursor = 'pointer'
  } else {
    if (hovered !== null) { hovered = null; draw(prog) }
    tip.value.visible = false
    canvasRef.value.style.cursor = 'default'
  }
}

function onMouseLeave() {
  hovered = null; tip.value.visible = false; draw(prog)
}

// ── Lifecycle ─────────────────────────────────────────────────────
let ro = null

onMounted(async () => {
  await nextTick()
  if (setupCanvas()) animateTo(1)
  ro = new ResizeObserver(() => {
    if (setupCanvas()) draw(prog)
  })
  ro.observe(wrapRef.value)
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (ro)  ro.disconnect()
})

watch(() => props.sedes, async () => {
  prog = 0
  await nextTick()
  animateTo(1)
}, { deep: true })
</script>

<style scoped>
.orgchart-wrap {
  position: relative;
  width: 100%;
  background: linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 100%);
  border-radius: 16px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
  min-height: 100px;
}
.orgchart-canvas { display: block; width: 100%; }

.orgchart-tooltip {
  position: absolute;
  background: #0F1A2E;
  color: #fff;
  border-radius: 9px;
  padding: 7px 12px;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
  box-shadow: 0 4px 18px rgba(15,26,46,.28);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 220px;
}
.ott-tag  { font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .05em; }
.ott-name { font-size: 12px; font-weight: 600; }
.ott-sub  { font-size: 10px; color: #94A3B8; }
</style>
