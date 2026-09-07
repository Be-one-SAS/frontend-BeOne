<template>
  <div ref="pdfContent" class="pdf-container">

    <!-- ══════════════ HEADER ══════════════ -->
    <div class="np-header">
      <div class="np-header-left">
        <img
          :src="pdfHeader.logo?.url || '/assets/logo.png'"
          alt="Be One Entretenimiento"
          class="np-logo"
          crossorigin="anonymous"
        />

        <div class="np-headline">
          <p class="np-eyebrow">PROPUESTA DE <strong>SERVICIOS</strong></p>
          <h1 class="np-title">VIVE LA EXPERIENCIA</h1>
          <h1 class="np-title np-title-accent">BE ONE</h1>
          <div class="np-title-rule"></div>
        </div>

        <p class="np-intro">
          En respuesta a su amable solicitud, es un gusto para Be One SAS presentar
          nuestra oferta de servicios para la realización de su evento.
        </p>
      </div>

      <div class="np-header-right" :style="heroStyle">
        <div class="np-hero-badges">
          <div class="np-badge">
            <FileText :size="13" class="np-badge-icon" />
            <div class="np-badge-text">
              <span class="np-badge-label">No. Cotización</span>
              <span class="np-badge-value">{{ quotation.numero }}</span>
            </div>
          </div>
          <div class="np-badge">
            <Calendar :size="13" class="np-badge-icon" />
            <div class="np-badge-text">
              <span class="np-badge-label">Fecha de cotización</span>
              <span class="np-badge-value">{{ formatDate(quotation.fechaCotizacion) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ INFO BAR (Cliente / Evento / Unidad) ══════════════ -->
    <div class="np-infobar">
      <div class="np-info-col">
        <div class="np-info-col-title"><User :size="13" /> Cliente</div>
        <div class="np-info-line"><span>Contacto:</span><strong>{{ quotation.contacto || '—' }}</strong></div>
        <div class="np-info-line"><span>Empresa:</span><strong>{{ quotation.empresa || quotation?.cliente?.name || '—' }}</strong></div>
        <div class="np-info-line"><span>Correo:</span><strong>{{ quotation.correo || '—' }}</strong></div>
        <div class="np-info-line"><span>Celular:</span><strong>{{ quotation.celular || '—' }}</strong></div>
      </div>

      <div class="np-info-col">
        <div class="np-info-col-title"><CalendarDays :size="13" /> Información del evento</div>
        <div class="np-info-line"><span>Fecha - evento - inicio:</span><strong>{{ formatDate(quotation.operationWindow?.eventStartAt) }}</strong></div>
        <div class="np-info-line"><span>Fecha - evento - fin:</span><strong>{{ formatDate(quotation.operationWindow?.eventEndAt) }}</strong></div>
        <div class="np-info-line"><span>Locación evento:</span><strong>{{ quotation.ubicacion || '—' }}</strong></div>
        <div class="np-info-line"><span>Link dirección en maps:</span><strong class="np-info-link">{{ quotation.linkMaps || '—' }}</strong></div>
        <div class="np-info-line"><span>Horario inicio evento:</span><strong>{{ formatTime(quotation.operationWindow?.eventStartAt) }}</strong></div>
        <div class="np-info-line"><span>Horario finalización evento:</span><strong>{{ formatTime(quotation.operationWindow?.eventEndAt) }}</strong></div>
        <div class="np-info-line"><span>Número de asistentes:</span><strong>{{ quotation.asistentes || '—' }}</strong></div>
      </div>

      <div class="np-info-col np-info-col-mini">
        <div class="np-mini-block">
          <MapPin :size="16" class="np-mini-icon" />
          <div><span class="np-mini-label">Unidad ejecución:</span><strong class="np-mini-value">{{ quotation.unidadEjecucion || '—' }}</strong></div>
        </div>
        <div class="np-mini-block">
          <Layers :size="16" class="np-mini-icon" />
          <div><span class="np-mini-label">Tipo de suelo:</span><strong class="np-mini-value">{{ quotation.tipoSuelo || '—' }}</strong></div>
        </div>
        <div class="np-mini-block">
          <CalendarCheck :size="16" class="np-mini-icon" />
          <div><span class="np-mini-label">Vigencia de cotización:</span><strong class="np-mini-value">{{ quotation.vigencia || '—' }}</strong></div>
        </div>
      </div>
    </div>

    <!-- ══════════════ PRODUCCIÓN LOGÍSTICA ══════════════ -->
    <div class="np-table-wrap">
      <div class="np-table-header"><Truck :size="15" /> PRODUCCIÓN <strong>LOGÍSTICA</strong></div>
      <table class="np-table">
        <thead>
          <tr>
            <th class="np-th-c">Item</th>
            <th class="np-th-c">Q. Jornada</th>
            <th class="np-th-c">Cantidad</th>
            <th>Descripción</th>
            <th class="np-th-r">Precio unitario</th>
            <th class="np-th-r">Subtotal ítem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fila, idx) in filaItems" :key="fila.key">
            <td class="np-td-c">{{ idx + 1 }}</td>
            <td class="np-td-c">{{ fila.jornada }}</td>
            <td class="np-td-c">{{ fila.cantidad }}</td>
            <td class="np-td-desc">
              <div class="np-row-icon">
                <img v-if="fila.imagen" :src="fila.imagen" :alt="fila.nombre" crossorigin="anonymous" />
                <Package v-else :size="18" />
              </div>
              <div class="np-row-desc-text">
                <strong>{{ fila.nombre }}</strong>
                <p v-if="fila.descripcion">{{ fila.descripcion }}</p>
              </div>
            </td>
            <td class="np-td-num">{{ formatCurrency(fila.unitPrice) }}</td>
            <td class="np-td-num">{{ formatCurrency(fila.subtotalItem) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════════ TOTALES + COMPROMISO ══════════════ -->
    <div class="np-summary-row">
      <div class="np-total-card">
        <div class="np-total-tag"><Tag :size="18" /></div>
        <div class="np-total-label">Valor total</div>
        <div class="np-total-amount">{{ formatCurrency(total) }}</div>
        <p class="np-total-thanks">Gracias por permitirnos ser parte de experiencias que conectan y dejan huella.</p>
        <p class="np-total-signature">Be One</p>
      </div>

      <div class="np-breakdown-card">
        <div class="np-breakdown-row">
          <span>Subtotal</span>
          <strong>{{ formatCurrency(subtotalAjustado) }}</strong>
        </div>
        <div class="np-breakdown-row">
          <span>IVA (19%)</span>
          <strong>{{ formatCurrency(iva) }}</strong>
        </div>
        <div class="np-breakdown-row np-breakdown-total">
          <span>Valor total</span>
          <strong>{{ formatCurrency(total) }}</strong>
        </div>
      </div>

      <div class="np-compromiso-card">
        <div class="np-compromiso-title"><ShieldCheck :size="15" /> Nuestro compromiso</div>
        <ul class="np-compromiso-list">
          <li><Check :size="12" /> Experiencias memorables</li>
          <li><Check :size="12" /> Seguridad y calidad</li>
          <li><Check :size="12" /> Puntualidad y cumplimiento</li>
          <li><Check :size="12" /> Equipo profesional</li>
        </ul>
      </div>
    </div>

    <!-- ══════════════ ELABORÓ / REVISÓ / QR ══════════════ -->
    <div class="np-signoff-row">
      <div class="np-signoff-col">
        <div class="np-signoff-label">Elaboró</div>
        <div class="np-signoff-name">{{ quotation.createdBy?.fullName || quotation.agenteComercial || '—' }}</div>
        <div class="np-signoff-role">Dirección Comercial</div>
        <div v-if="quotation.createdBy?.telefono" class="np-signoff-contact"><Phone :size="10" /> {{ quotation.createdBy.telefono }}</div>
        <div v-if="quotation.createdBy?.email" class="np-signoff-contact"><Mail :size="10" /> {{ quotation.createdBy.email }}</div>
      </div>

      <div v-if="quotation.responsableOperativo" class="np-signoff-col">
        <div class="np-signoff-label">Revisó</div>
        <div class="np-signoff-name">{{ quotation.responsableOperativo.fullName }}</div>
        <div class="np-signoff-role">Dirección Operativa{{ quotation.unidadEjecucion ? ' ' + quotation.unidadEjecucion : '' }}</div>
        <div v-if="quotation.responsableOperativo.telefono" class="np-signoff-contact"><Phone :size="10" /> {{ quotation.responsableOperativo.telefono }}</div>
        <div v-if="quotation.responsableOperativo.email" class="np-signoff-contact"><Mail :size="10" /> {{ quotation.responsableOperativo.email }}</div>
      </div>

      <div v-if="qrDataUrl" class="np-qr-col">
        <img :src="qrDataUrl" alt="QR portafolio" class="np-qr-img" />
        <div class="np-qr-text">
          <strong>Conoce más de nuestros servicios</strong>
          <p>Escanea el código QR para ver imágenes y videos de nuestras atracciones y montajes.</p>
        </div>
      </div>
    </div>

    <!-- ══════════════ NOTAS / CONDICIONES ══════════════ -->
    <div class="np-footer-notes">
      <div class="np-note-dark">
        <div class="np-note-dark-title"><FileText :size="14" /> Notas importantes</div>
        <ul class="np-note-dark-list">
          <li v-for="(item, i) in nota1Items" :key="i"><Check :size="11" class="np-note-check" /> {{ item }}</li>
        </ul>
      </div>
      <div class="np-note-dark">
        <div class="np-note-dark-title"><ShieldCheck :size="14" /> Condiciones de servicio y política de cancelación</div>
        <p class="np-note-dark-text">
          Para reservar el servicio debemos recibir su confirmación formal con Orden de compra,
          Carta de confirmación o documento que acredite la aceptación de la oferta y pago del
          50% sobre el valor total de la oferta; el 50% restante deberá ser pagado 15 días
          después de radicada la factura.
        </p>
        <p class="np-note-dark-text">
          Con el fin de asegurar la disponibilidad del lugar, atracciones, equipos y/o servicios,
          se sugiere reservar con 30 días de anticipación a la fecha del evento.
        </p>
        <p class="np-note-dark-text np-note-dark-strong">Política de cancelación:</p>
        <p class="np-note-dark-text">
          <strong>Temporada alta (junio a diciembre):</strong> se debe cancelar el evento mínimo 30 días
          hábiles antes de la fecha prevista, de lo contrario no se realizará la devolución del pago de
          anticipo o pago total realizado.
        </p>
        <p class="np-note-dark-text">
          <strong>Temporada baja (enero a mayo):</strong> se debe cancelar el evento mínimo 8 días
          hábiles antes de la fecha prevista, de lo contrario no se realizará la devolución del pago de
          anticipo o pago total realizado.
        </p>
      </div>
    </div>

    <!-- CONSIDERACIONES DE LA COTIZACIÓN -->
    <div v-if="quotation.consideraciones" class="np-note-dark np-note-full">
      <div class="np-note-dark-title"><ClipboardList :size="14" /> Consideraciones de la cotización</div>
      <p class="np-note-dark-text np-note-text-pre">{{ quotation.consideraciones }}</p>
    </div>

    <!-- ══════════════ GALERÍA DE PRODUCTOS (página aparte) ══════════════ -->
    <div v-if="galleryItems.length" class="gallery-page">
      <div class="gallery-panel">
        <div class="np-table-header"><Package :size="15" /> Galería de <strong>productos</strong></div>
        <div class="gallery-grid">
          <div v-for="(g, idx) in galleryItems" :key="'gal-' + idx" class="gallery-card">
            <img
              v-if="g.image"
              :src="g.image"
              :alt="g.nombre"
              class="gallery-thumb"
              crossorigin="anonymous"
            />
            <div v-else class="gallery-thumb-placeholder">Sin foto</div>
            <div class="gallery-name">{{ g.nombre }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ FOOTER FINAL ══════════════ -->
    <div class="np-final-footer">
      <img
        :src="pdfHeader.logo?.url || '/assets/logo.png'"
        alt="Be One Entretenimiento"
        class="np-footer-logo"
        crossorigin="anonymous"
      />
      <div class="np-footer-cats">
        <div class="np-footer-cat"><PartyPopper :size="16" /><span>Eventos<br />Corporativos</span></div>
        <div class="np-footer-cat"><Music :size="16" /><span>Conciertos<br />y Festivales</span></div>
        <div class="np-footer-cat"><Sparkles :size="16" /><span>Atracciones<br />de Gran Formato</span></div>
        <div class="np-footer-cat"><Users :size="16" /><span>Activaciones<br />Experienciales</span></div>
      </div>
      <p class="np-footer-tagline">Eventos únicos<br />diseñados para impactar.</p>
    </div>
    <div v-if="pdfHeader.partners?.length" class="np-footer-partners">
      <img
        v-for="p in pdfHeader.partners"
        :key="p.id"
        :src="p.imageUrl"
        :alt="p.nombre"
        crossorigin="anonymous"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import api from '@/services/api'
import QRCode from 'qrcode'
import {
  FileText, Calendar, User, CalendarDays, MapPin, Layers, CalendarCheck,
  Truck, Package, Tag, ShieldCheck, Check, Phone, Mail, ClipboardList,
  PartyPopper, Music, Sparkles, Users,
} from 'lucide-vue-next'

const props = defineProps({
  quotation: {
    type: Object,
    required: true
  }
})

const pdfContent = ref(null)

// ── Encabezado configurable (logo + foto del evento + logos de certificación
// + contacto/QR) — editable desde /configuracion → AppConfigService (key
// 'pdf_header').
const pdfHeader = ref({ logo: null, heroImage: null, partners: [], contacto: {} })

onMounted(async () => {
  try {
    const { data } = await api.get('/app-config/pdf-header')
    pdfHeader.value = data
  } catch {
    // Sin config guardada aún (o falla de red) — se queda con los defaults
    // (logo estático, sin foto de evento, sin logos de certificación) y el
    // PDF sigue funcionando.
  }
})

// % de aumento por hora adicional — editable desde /configuracion. Cada
// hora adicional aplica este porcentaje como aumento sobre el subtotal.
const porcentajeHoraAdicional = ref(0)
onMounted(async () => {
  try {
    const { data } = await api.get('/app-config/horas-adicionales')
    porcentajeHoraAdicional.value = data?.porcentajeHora ?? 0
  } catch {
    // Sin config guardada aún (o falla de red) — se queda en 0.
  }
})

// Editable desde /configuracion → sección "Nota 1"; si aún no hay config
// guardada, cae al texto fijo original.
const nota1Items = computed(() => pdfHeader.value.notas?.nota1?.length
  ? pdfHeader.value.notas.nota1
  : [
      'Todos los productos y/o servicios cotizados están sujetos a disponibilidad de inventarios y cambio de costos sin previo aviso.',
      'Los valores de artistas/grupos/shows no incluyen Rider Técnico, el cual se debe cotizar dependiendo del o de los artistas elegidos.',
      'Los valores descritos son por un día de evento o la jornada descrita en la cotización (Q. Jornada).',
      'La vigencia de esta oferta es la descrita al inicio de esta cotización.',
      'Únicamente se reserva el servicio cotizado con carta de aprobación de la oferta, Orden de Compra o documento formal que haga sus veces.',
      'No incluye valor de parqueadero.',
    ])

// Foto del evento en el header — sin una configurada desde /configuracion,
// cae a la foto por defecto del proyecto (public/assets/fondo-login.webp).
const heroStyle = computed(() => {
  const url = pdfHeader.value.heroImage?.url || '/assets/fondo-login.webp'
  return { backgroundImage: `url(${url})` }
})

// QR hacia el portafolio configurado en /configuracion — sin URL, se omite
// el bloque entero en vez de mostrar un QR que no lleve a ningún lado.
const qrDataUrl = ref(null)
watch(() => pdfHeader.value.contacto?.portafolioUrl, async (url) => {
  if (!url) { qrDataUrl.value = null; return }
  try {
    qrDataUrl.value = await QRCode.toDataURL(url, {
      width: 160, margin: 1, color: { dark: '#0F1A2E', light: '#FFFFFF' },
    })
  } catch {
    qrDataUrl.value = null
  }
}, { immediate: true })

// Solo se aceptan imágenes que vengan de nuestro propio servicio de carga
// (R2) — links viejos (Google Drive, etc.) no sirven bytes de imagen directa
// ni CORS, así que se tratan como "sin foto" en vez de intentar cargarlos.
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL
const isUploadedImage = (url) => !!url && !!r2PublicUrl && url.startsWith(r2PublicUrl)

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = formatCOP

// Los ítems propios usan descuentoPct/aumentoPct (nombre de campo real en
// QuotationItem); los de terceros los guardan como descuento/aumento
// (ThirdPartyQuotationItem) — se acepta cualquiera de los dos nombres.
const getDescuentoPct = (item) => item.descuentoPct ?? item.descuento ?? 0
const getAumentoPct   = (item) => item.aumentoPct   ?? item.aumento   ?? 0

// La cantidad efectiva de un ítem es cantidad de producto × Q. Jornada (días).
// cantidadJornada por defecto es 1, así que ítems sin jornada explícita no cambian.
const getQuantity = (item) => {
  const cantidad = item.cantidadProducto ?? item.cantidad ?? item.quantity ?? 1
  const jornada  = item.cantidadJornada ?? 1
  return cantidad * jornada
}

const calculateItemTotal = (item) => {
  const unitPrice = item.unitPrice || item.precioUnitario || item.costo || 0
  const quantity = getQuantity(item)
  const descuentoPct = getDescuentoPct(item)
  const aumentoPct = getAumentoPct(item)
  const subtotal = unitPrice * quantity
  const descuento = subtotal * (descuentoPct / 100)
  const aumento = subtotal * (aumentoPct / 100)
  const horasExtra = subtotal * (item.horasAdicionales || 0) * porcentajeHoraAdicional.value / 100
  return subtotal - descuento + aumento + horasExtra
}

// Filas unificadas (propios + terceros) para la tabla "Producción Logística".
const filaItems = computed(() => {
  const own = (props.quotation.items || []).map((item, i) => ({
    key: 'own-' + i,
    nombre: item.product?.nombre || item.product?.dispositivo || item.producto?.nombre || item.nombre || item.dispositivo || item.descripcion || 'Producto',
    descripcion: item.product?.descripcion || item.descripcion || '',
    imagen: isUploadedImage(item.product?.linkFotoDispositivo) ? item.product.linkFotoDispositivo : null,
    jornada: item.cantidadJornada || item.quantity || 1,
    cantidad: item.cantidadProducto || 1,
    unitPrice: item.unitPrice || 0,
    subtotalItem: calculateItemTotal(item),
  }))

  const third = (props.quotation.thirdPartyItems || []).map((item, i) => ({
    key: 'third-' + i,
    nombre: item.catalogProduct?.nombre || item.catalogProduct?.dispositivo || item.catalogItem?.nombre || item.nombre || item.descripcion || 'Producto de tercero',
    descripcion: item.catalogProduct?.descripcion || item.descripcion || '',
    imagen: isUploadedImage(item.catalogProduct?.linkFotoDispositivo) ? item.catalogProduct.linkFotoDispositivo : null,
    jornada: item.cantidadJornada || 1,
    cantidad: item.cantidad || 1,
    unitPrice: item.precioUnitario || item.costo || 0,
    subtotalItem: item.precioTotal || calculateItemTotal(item),
  }))

  return [...own, ...third]
})

const galleryItems = computed(() => {
  const own = (props.quotation.items || []).map((item) => ({
    nombre: item.product?.nombre || item.product?.dispositivo || item.producto?.nombre || item.nombre || item.dispositivo || item.descripcion || 'Producto',
    image: isUploadedImage(item.product?.linkFotoDispositivo) ? item.product.linkFotoDispositivo : null,
    tercero: false,
  }))

  const third = (props.quotation.thirdPartyItems || []).map((item) => ({
    nombre: item.catalogProduct?.nombre || item.catalogProduct?.dispositivo || item.catalogItem?.nombre || item.nombre || item.descripcion || 'Producto de tercero',
    image: isUploadedImage(item.catalogProduct?.linkFotoDispositivo) ? item.catalogProduct.linkFotoDispositivo : null,
    tercero: true,
  }))

  return [...own, ...third]
})

const subtotal = computed(() => {
  const items = props.quotation.items || []
  const thirdParty = props.quotation.thirdPartyItems || []

  const itemsTotal = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice || 0
    const itemSubtotal = unitPrice * getQuantity(item)
    return sum + itemSubtotal + itemSubtotal * (item.horasAdicionales || 0) * porcentajeHoraAdicional.value / 100
  }, 0)

  const thirdPartyTotal = thirdParty.reduce((sum, item) => {
    const unitPrice = item.precioUnitario || item.costo || 0
    const itemSubtotal = unitPrice * getQuantity(item)
    return sum + itemSubtotal + itemSubtotal * (item.horasAdicionales || 0) * porcentajeHoraAdicional.value / 100
  }, 0)

  return itemsTotal + thirdPartyTotal
})

const descuentoTotal = computed(() => {
  const items = props.quotation.items || []
  const thirdParty = props.quotation.thirdPartyItems || []

  const itemsDescuento = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice || 0
    const descuentoPct = getDescuentoPct(item)
    const subtotal = unitPrice * getQuantity(item)
    return sum + (subtotal * (descuentoPct / 100))
  }, 0)

  const thirdPartyDescuento = thirdParty.reduce((sum, item) => {
    const unitPrice = item.precioUnitario || item.costo || 0
    const descuentoPct = getDescuentoPct(item)
    const subtotal = unitPrice * getQuantity(item)
    return sum + (subtotal * (descuentoPct / 100))
  }, 0)

  return itemsDescuento + thirdPartyDescuento
})

// Aumento — aplica a equipos propios y de terceros. Se refleja en los totales
// pero nunca se muestra al cliente como línea/columna aparte: es un ajuste
// interno de precio, no algo que se le explique.
const aumentoTotal = computed(() => {
  const items = props.quotation.items || []
  const thirdParty = props.quotation.thirdPartyItems || []

  const itemsAumento = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice || 0
    const aumentoPct = getAumentoPct(item)
    const subtotal = unitPrice * getQuantity(item)
    return sum + (subtotal * (aumentoPct / 100))
  }, 0)

  const thirdPartyAumento = thirdParty.reduce((sum, item) => {
    const unitPrice = item.precioUnitario || item.costo || 0
    const aumentoPct = getAumentoPct(item)
    const subtotal = unitPrice * getQuantity(item)
    return sum + (subtotal * (aumentoPct / 100))
  }, 0)

  return itemsAumento + thirdPartyAumento
})

const subtotalAjustado = computed(() => subtotal.value - descuentoTotal.value + aumentoTotal.value)

const iva = computed(() => subtotalAjustado.value * 0.19)

const total = computed(() => subtotalAjustado.value + iva.value)
</script>

<style scoped>
.pdf-container {
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11.5px;
  line-height: 1.55;
  letter-spacing: 0.1px;
  color: #1e293b;
  background: white;
  max-width: 210mm;
  margin: 0 auto;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── HEADER ───────────────────────────────────── */
.np-header {
  display: flex;
  align-items: stretch;
  min-height: 220px;
}

.np-header-left {
  width: 42%;
  flex-shrink: 0;
  padding: 20px 20px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.np-logo {
  display: block;
  align-self: flex-start;
  max-height: 40px;
  max-width: 160px;
  height: auto;
  width: auto;
  object-fit: contain;
}

.np-headline { margin-top: 6px; }

.np-eyebrow {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #27c8d8;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.np-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.12;
  color: #0f1a2e;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  letter-spacing: -0.2px;
}

.np-title-accent { color: #27c8d8; }

.np-title-rule {
  width: 46px;
  height: 3px;
  border-radius: 2px;
  background: #27c8d8;
  margin-top: 8px;
}

.np-intro {
  margin: 6px 0 0;
  font-size: 10.5px;
  color: #64748b;
  line-height: 1.65;
}

.np-header-right {
  flex: 1;
  position: relative;
  clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%);
  background-size: cover;
  background-position: center;
  background-color: #0f1a2e;
}

.np-hero-badges {
  position: absolute;
  top: 16px;
  right: 18px;
  display: flex;
  gap: 8px;
}

.np-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 2px 8px rgba(15, 26, 46, 0.25);
}

.np-badge-icon { color: #27c8d8; flex-shrink: 0; }

.np-badge-text { display: flex; flex-direction: column; line-height: 1.25; }

.np-badge-label {
  font-size: 7px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #64748b;
}

.np-badge-value {
  font-size: 11px;
  font-weight: 800;
  color: #0f1a2e;
}

/* ── INFO BAR ─────────────────────────────────── */
.np-infobar {
  display: flex;
  border-bottom: 2px solid #f1f5f9;
  break-inside: avoid;
  page-break-inside: avoid;
}

.np-info-col {
  flex: 1;
  padding: 14px 18px;
  border-right: 1px solid #eef2f7;
}

.np-info-col:last-child { border-right: none; }

.np-info-col-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #27c8d8;
  margin-bottom: 8px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.np-info-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 9.5px;
  padding: 3px 0;
  border-bottom: 1px dashed #f1f5f9;
}

.np-info-line span {
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
  flex-shrink: 0;
}

.np-info-line strong {
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

.np-info-link { font-size: 8.5px; }

.np-info-col-mini {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.np-mini-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.np-mini-icon {
  color: #27c8d8;
  flex-shrink: 0;
  background: #e6fbfd;
  border-radius: 8px;
  padding: 6px;
  width: 28px;
  height: 28px;
  box-sizing: border-box;
}

.np-mini-label {
  display: block;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #94a3b8;
}

.np-mini-value {
  display: block;
  font-size: 11px;
  color: #1e293b;
  font-weight: 700;
}

/* ── PRODUCCIÓN LOGÍSTICA ─────────────────────── */
.np-table-wrap {
  margin: 18px 24px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.np-table-header {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f1a2e;
  color: #ffffff;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.6px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.np-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
}

.np-table thead th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  text-align: left;
  padding: 8px 10px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #e2e8f0;
}

.np-th-c { text-align: center; }
.np-th-r { text-align: right; }

.np-table tbody tr {
  break-inside: avoid;
  page-break-inside: avoid;
  border-bottom: 1px solid #eef2f7;
}

.np-table tbody td {
  padding: 10px;
  vertical-align: middle;
}

.np-td-c { text-align: center; color: #475569; font-weight: 600; }

.np-td-desc { display: flex; align-items: center; gap: 10px; }

.np-row-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e6fbfd;
  color: #27c8d8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.np-row-icon img { width: 100%; height: 100%; object-fit: cover; }

.np-row-desc-text strong {
  display: block;
  color: #0f1a2e;
  font-size: 10.5px;
}

.np-row-desc-text p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 9px;
  line-height: 1.5;
}

.np-td-num {
  text-align: right;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-weight: 700;
  font-size: 10px;
  color: #0f1a2e;
  white-space: nowrap;
}

/* ── TOTALES + COMPROMISO ─────────────────────── */
.np-summary-row {
  display: flex;
  gap: 14px;
  margin: 0 24px 18px;
  align-items: stretch;
  break-inside: avoid;
  page-break-inside: avoid;
}

.np-total-card {
  flex: 1.1;
  background: #0f1a2e;
  border-radius: 12px;
  padding: 16px 18px;
  color: #ffffff;
}

.np-total-tag {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(39, 200, 216, 0.18);
  color: #27c8d8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.np-total-label {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8;
}

.np-total-amount {
  font-size: 20px;
  font-weight: 800;
  margin: 2px 0 8px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.np-total-thanks {
  font-size: 9px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 0 0 8px;
}

.np-total-signature {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  font-size: 15px;
  color: #27c8d8;
  margin: 0;
}

.np-breakdown-card {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.np-breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10.5px;
}

.np-breakdown-row span { color: #64748b; font-weight: 600; }
.np-breakdown-row strong {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  color: #1e293b;
  font-size: 11px;
}

.np-breakdown-total {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}
.np-breakdown-total span { color: #0f1a2e; font-weight: 700; font-size: 11.5px; }
.np-breakdown-total strong { color: #27c8d8; font-size: 14px; }

.np-compromiso-card {
  flex: 1.1;
  background: #0f1a2e;
  border-radius: 12px;
  padding: 16px 18px;
  color: #ffffff;
}

.np-compromiso-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #27c8d8;
  margin-bottom: 10px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.np-compromiso-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }

.np-compromiso-list li {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: #e2e8f0;
}

.np-compromiso-list li svg { color: #27c8d8; flex-shrink: 0; }

/* ── ELABORÓ / REVISÓ / QR ─────────────────────── */
.np-signoff-row {
  display: flex;
  gap: 16px;
  margin: 0 24px 18px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
  break-inside: avoid;
  page-break-inside: avoid;
}

.np-signoff-col { flex: 1; }

.np-signoff-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #27c8d8;
  margin-bottom: 3px;
}

.np-signoff-name { font-size: 11.5px; font-weight: 700; color: #0f1a2e; }
.np-signoff-role { font-size: 9px; color: #64748b; margin-bottom: 4px; }

.np-signoff-contact {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: #475569;
  margin-top: 2px;
}
.np-signoff-contact svg { color: #94a3b8; flex-shrink: 0; }

.np-qr-col {
  flex: 1.3;
  display: flex;
  align-items: center;
  gap: 10px;
}

.np-qr-img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.np-qr-text strong {
  display: block;
  font-size: 9.5px;
  color: #0f1a2e;
  margin-bottom: 2px;
}

.np-qr-text p {
  margin: 0;
  font-size: 8.5px;
  color: #64748b;
  line-height: 1.5;
}

/* ── NOTAS / CONDICIONES (dark) ────────────────── */
.np-footer-notes {
  display: flex;
  gap: 14px;
  margin: 0 24px 14px;
}

.np-note-dark {
  flex: 1;
  background: #0f1a2e;
  border-radius: 12px;
  padding: 14px 16px;
  color: #cbd5e1;
  break-inside: avoid;
  page-break-inside: avoid;
}

.np-note-full { margin: 0 24px 18px; }

.np-note-dark-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #ffffff;
  margin-bottom: 8px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

.np-note-dark-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

.np-note-dark-list li {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 9px;
  line-height: 1.5;
}

.np-note-check { color: #27c8d8; flex-shrink: 0; margin-top: 2px; }

.np-note-dark-text {
  font-size: 9px;
  line-height: 1.6;
  margin: 0 0 6px;
}
.np-note-dark-text:last-child { margin-bottom: 0; }
.np-note-dark-text strong { color: #ffffff; }
.np-note-dark-strong { color: #ffffff; font-weight: 700; margin-bottom: 4px; }

.np-note-text-pre { white-space: pre-wrap; word-break: break-word; }

/* ── GALERÍA DE PRODUCTOS ─────────────────────── */
.gallery-page {
  margin: 20px 24px 0;
  break-before: page;
  page-break-before: always;
  padding-top: 20px;
}

.gallery-panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
}

.gallery-card {
  width: calc(25% - 12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.gallery-thumb {
  display: block;
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.gallery-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 110px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 9px;
}

.gallery-name {
  font-size: 10.5px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  line-height: 1.4;
}

/* ── FOOTER FINAL ─────────────────────────────── */
.np-final-footer {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 24px;
  border-top: 2px solid #0f1a2e;
  break-inside: avoid;
  page-break-inside: avoid;
}

.np-footer-logo { height: 30px; width: auto; flex-shrink: 0; }

.np-footer-cats {
  display: flex;
  gap: 16px;
  flex: 1;
}

.np-footer-cat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  flex: 1;
}

.np-footer-cat svg { color: #27c8d8; }

.np-footer-cat span {
  font-size: 7.5px;
  font-weight: 600;
  color: #475569;
  line-height: 1.3;
}

.np-footer-tagline {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  font-size: 11px;
  color: #0f1a2e;
  text-align: right;
  line-height: 1.3;
  margin: 0;
  flex-shrink: 0;
}

.np-footer-partners {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 10px 24px 18px;
  flex-wrap: wrap;
}

.np-footer-partners img {
  max-height: 28px;
  max-width: 100px;
  width: auto;
  object-fit: contain;
}
</style>
