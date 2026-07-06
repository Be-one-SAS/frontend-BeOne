<template>
  <div ref="pdfContent" class="pdf-container">
    <!-- HEADER -->
    <div class="pdf-header">
      <div class="header-brand">
        <div class="logo-wrapper">
          <img src="/assets/logo.png" alt="Be One Entretenimiento" class="logo-image" />
        </div>
        <div class="partner-badges">
          <span class="partner-badge">IAAPA</span>
          <span class="partner-badge">FONTUR</span>
          <span class="partner-badge">ACOLAP</span>
        </div>
      </div>
      <div class="header-contact">
        <div class="contact-row"><span class="contact-label">Bogotá:</span> Carrera 71c # 75c 12</div>
        <div class="contact-row"><span class="contact-label">Medellín:</span> Carrera 80b # 34a 35</div>
        <div class="contact-row"><span class="contact-label">PBX:</span> 6015481954</div>
        <div class="contact-row">beone.eventoscorporativos</div>
      </div>
    </div>

    <!-- INFO TABLE -->
    <table class="info-table">
      <thead>
        <tr><th colspan="2" class="section-header">Información de Cotización</th></tr>
      </thead>
      <tbody>
        <tr class="info-row"><td class="info-label">No. Cotización</td><td class="info-value"><strong>{{ quotation.numero }}-2026</strong></td></tr>
        <tr class="info-row"><td class="info-label">Agente Comercial</td><td class="info-value">{{ quotation.agenteComercial || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Fecha de Cotización</td><td class="info-value">{{ formatDate(quotation.fechaCotizacion) }}</td></tr>
        <tr class="info-row"><td class="info-label">Cliente</td><td class="info-value">{{ quotation?.cliente?.name || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Empresa</td><td class="info-value">{{ quotation.empresa || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Contacto</td><td class="info-value">{{ quotation.contacto || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Correo</td><td class="info-value">{{ quotation.correo || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Celular</td><td class="info-value">{{ quotation.celular || '—' }}</td></tr>
      </tbody>
    </table>

    <table class="info-table">
      <thead>
        <tr><th colspan="2" class="section-header">Información del Evento</th></tr>
      </thead>
      <tbody>
        <tr class="info-row"><td class="info-label">Inicio Evento</td><td class="info-value">{{ formatDate(quotation.operationWindow?.eventStartAt) }} {{ formatTime(quotation.operationWindow?.eventStartAt) }}</td></tr>
        <tr class="info-row"><td class="info-label">Fin Evento</td><td class="info-value">{{ formatDate(quotation.operationWindow?.eventEndAt) }} {{ formatTime(quotation.operationWindow?.eventEndAt) }}</td></tr>
        <tr class="info-row"><td class="info-label">Ubicación</td><td class="info-value">{{ quotation.ubicacion || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Link Maps</td><td class="info-value"><span v-if="quotation.linkMaps" class="maps-link">{{ quotation.linkMaps }}</span><span v-else>—</span></td></tr>
        <tr class="info-row"><td class="info-label">Asistentes</td><td class="info-value">{{ quotation.asistentes || '—' }}</td></tr>
        <tr class="info-row"><td class="info-label">Región operativa</td><td class="info-value">{{ quotation.unidadEjecucion || '—' }}{{ quotation.tipoSuelo ? ' · ' + quotation.tipoSuelo : '' }}</td></tr>
        <tr class="info-row"><td class="info-label">Vigencia</td><td class="info-value">{{ quotation.vigencia || '—' }}</td></tr>
      </tbody>
    </table>

    <!-- INTRO -->
    <div class="intro-text">
      En respuesta a su amable solicitud, es un gusto para Be One SAS presentar nuestra oferta de servicios para la realización de su evento.
    </div>

    <!-- NOTA 1 -->
    <div class="note-box">
      <div class="note-box-title">Nota 1</div>
      <ol class="note-box-list">
        <li>Se envía cotización con el fin de ser aprobada por el cliente.</li>
        <li>Se confirma reserva con el 50% del valor del alquiler.</li>
        <li>Se envía factura de venta y se cancela el 50% restante antes del evento.</li>
      </ol>
    </div>

    <!-- SERVICES TABLE -->
    <div class="services-section">
      <div class="services-panel">
        <div class="services-section-header">Producción Logística</div>

        <table class="services-table">
        <thead>
          <tr>
            <th class="col-img">Producto</th>
            <th class="col-q">Q Jornada</th>
            <th class="col-cant">Cantidad</th>
            <th class="col-desc">Descripción</th>
            <th class="col-precio">Precio Unitario</th>
            <th class="col-subtotal">Subtotal</th>
            <th class="col-dcto" v-if="tieneDescuento">% Dcto</th>
            <th class="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(item, idx) in (quotation.items || [])" :key="'own-' + idx">
            <tr>
              <td class="cell-img">
                <img
                  v-if="isUploadedImage(item.product?.linkFotoDispositivo)"
                  :src="item.product.linkFotoDispositivo"
                  :alt="item.product?.nombre || 'Producto'"
                  class="product-thumb"
                  crossorigin="anonymous"
                />
                <div v-else class="product-thumb-placeholder">Sin foto</div>
              </td>
              <td class="cell-c">{{ item.cantidadJornada || item.quantity || 1 }}</td>
              <td class="cell-c">{{ item.cantidadProducto || 1 }}</td>
              <td class="cell-desc">{{ item.product?.nombre || item.product?.dispositivo || item.producto?.nombre || item.nombre || item.dispositivo || item.descripcion || 'Producto' }}</td>
              <td class="cell-num">{{ formatCurrency(item.unitPrice || 0) }}</td>
              <td class="cell-num">{{ formatCurrency((item.unitPrice || 0) * (item.cantidadProducto || item.quantity || 1)) }}</td>
              <td class="cell-c" v-if="tieneDescuento">{{ item.descuentoPct || 0 }}%</td>
              <td class="cell-num">{{ formatCurrency(calculateItemTotal(item)) }}</td>
            </tr>
          </template>
          <template v-for="(item, idx) in (quotation.thirdPartyItems || [])" :key="'third-' + idx">
            <tr class="row-third">
              <td class="cell-img">
                <img
                  v-if="isUploadedImage(item.catalogProduct?.linkFotoDispositivo)"
                  :src="item.catalogProduct.linkFotoDispositivo"
                  :alt="item.catalogProduct?.nombre || 'Producto'"
                  class="product-thumb"
                  crossorigin="anonymous"
                />
                <div v-else class="product-thumb-placeholder">Sin foto</div>
              </td>
              <td class="cell-c">{{ item.cantidadJornada || 1 }}</td>
              <td class="cell-c">{{ item.cantidad || 1 }}</td>
              <td class="cell-desc">
                {{ item.catalogProduct?.nombre || item.catalogItem?.nombre || item.nombre || 'Producto de tercero' }}
                <span class="badge-third">Tercero</span>
              </td>
              <td class="cell-num">{{ formatCurrency(item.precioUnitario || item.costo || 0) }}</td>
              <td class="cell-num">{{ formatCurrency((item.precioUnitario || item.costo || 0) * (item.cantidad || 1)) }}</td>
              <td class="cell-c" v-if="tieneDescuento">{{ item.descuentoPct || 0 }}%</td>
              <td class="cell-num">{{ formatCurrency(item.precioTotal || calculateItemTotal(item)) }}</td>
            </tr>
          </template>
          <tr class="row-total-label">
            <td :colspan="tieneDescuento ? 8 : 7" class="cell-total-label">Valor Total</td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- TOTALS -->
      <div class="totals-wrapper">
        <table class="totals-table">
          <thead>
            <tr>
              <th>Subtotal</th>
              <th v-if="tieneDescuento">Con Descuento</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ formatCurrency(subtotal) }}</td>
              <td v-if="tieneDescuento">{{ formatCurrency(subtotalAjustado) }}</td>
              <td>{{ formatCurrency(subtotalAjustado) }}</td>
            </tr>
            <tr>
              <td :colspan="tieneDescuento ? 2 : 1" class="totals-label">IVA (19%)</td>
              <td>{{ formatCurrency(iva) }}</td>
            </tr>
            <tr class="row-grand-total">
              <td :colspan="tieneDescuento ? 2 : 1" class="totals-label grand">Valor Total</td>
              <td class="grand-value">{{ formatCurrency(total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- NOTA 2 -->
    <div class="note-box">
      <div class="note-box-title">Nota 2</div>
      <p class="note-text"><strong>Condiciones del servicio:</strong> La presente cotización tiene una validez de {{ quotation.vigencia || '30 días' }}. Los precios están expresados en pesos colombianos e incluyen IVA cuando aplica.</p>
      <p class="note-text"><strong>Política de cancelación:</strong> Cancelaciones con menos de 48 horas de anticipación al evento tendrán un cargo del 50% del valor total. No-shows (no presentación) tendrán un cargo del 100%.</p>
    </div>

    <!-- GALERÍA DE PRODUCTOS (página aparte) -->
    <div v-if="galleryItems.length" class="gallery-page">
      <div class="gallery-panel">
        <div class="services-section-header">Galería de Productos</div>
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
            <span v-if="g.tercero" class="badge-third">Tercero</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="pdf-footer">
      <p class="footer-text">Gracias por confiar en Be One Entretenimiento</p>
      <p class="footer-date">Documento generado el {{ new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatCOP } from '@/utils/currency.js'

const props = defineProps({
  quotation: {
    type: Object,
    required: true
  }
})

const pdfContent = ref(null)

// Solo se aceptan imágenes que vengan de nuestro propio servicio de carga
// (R2) — links viejos (Google Drive, etc.) no sirven bytes de imagen directa
// ni CORS, así que se tratan como "sin foto" en vez de intentar cargarlos.
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL
const isUploadedImage = (url) => !!url && !!r2PublicUrl && url.startsWith(r2PublicUrl)

const galleryItems = computed(() => {
  const own = (props.quotation.items || []).map((item) => ({
    nombre: item.product?.nombre || item.product?.dispositivo || item.producto?.nombre || item.nombre || item.dispositivo || item.descripcion || 'Producto',
    image: isUploadedImage(item.product?.linkFotoDispositivo) ? item.product.linkFotoDispositivo : null,
    tercero: false,
  }))

  const third = (props.quotation.thirdPartyItems || []).map((item) => ({
    nombre: item.catalogProduct?.nombre || item.catalogItem?.nombre || item.nombre || 'Producto de tercero',
    image: isUploadedImage(item.catalogProduct?.linkFotoDispositivo) ? item.catalogProduct.linkFotoDispositivo : null,
    tercero: true,
  }))

  return [...own, ...third]
})

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
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

const calculateItemTotal = (item) => {
  const unitPrice = item.unitPrice || item.precioUnitario || item.costo || 0
  const quantity = item.cantidadProducto || item.cantidad || item.quantity || 1
  const descuentoPct = item.descuentoPct || 0
  const aumentoPct = item.aumentoPct || 0
  const subtotal = unitPrice * quantity
  const descuento = subtotal * (descuentoPct / 100)
  const aumento = subtotal * (aumentoPct / 100)
  return subtotal - descuento + aumento
}

const subtotal = computed(() => {
  const items = props.quotation.items || []
  const thirdParty = props.quotation.thirdPartyItems || []

  const itemsTotal = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice || 0
    const quantity = item.cantidadProducto || item.quantity || 1
    return sum + (unitPrice * quantity)
  }, 0)

  const thirdPartyTotal = thirdParty.reduce((sum, item) => {
    const unitPrice = item.precioUnitario || item.costo || 0
    const quantity = item.cantidad || 1
    return sum + (unitPrice * quantity)
  }, 0)

  return itemsTotal + thirdPartyTotal
})

const descuentoTotal = computed(() => {
  const items = props.quotation.items || []
  const thirdParty = props.quotation.thirdPartyItems || []

  const itemsDescuento = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice || 0
    const quantity = item.cantidadProducto || item.quantity || 1
    const descuentoPct = item.descuentoPct || 0
    const subtotal = unitPrice * quantity
    return sum + (subtotal * (descuentoPct / 100))
  }, 0)

  const thirdPartyDescuento = thirdParty.reduce((sum, item) => {
    const unitPrice = item.precioUnitario || item.costo || 0
    const quantity = item.cantidad || 1
    const descuentoPct = item.descuentoPct || 0
    const subtotal = unitPrice * quantity
    return sum + (subtotal * (descuentoPct / 100))
  }, 0)

  return itemsDescuento + thirdPartyDescuento
})

// Aumento — solo aplica a equipos propios (ver useQuotationProducts.ts). Se
// refleja en los totales pero nunca se muestra al cliente como línea/columna
// aparte: es un ajuste interno de precio, no algo que se le explique.
const aumentoTotal = computed(() => {
  const items = props.quotation.items || []
  return items.reduce((sum, item) => {
    const unitPrice = item.unitPrice || 0
    const quantity = item.cantidadProducto || item.quantity || 1
    const aumentoPct = item.aumentoPct || 0
    const subtotal = unitPrice * quantity
    return sum + (subtotal * (aumentoPct / 100))
  }, 0)
})

const tieneDescuento = computed(() => descuentoTotal.value > 0)

const subtotalAjustado = computed(() => subtotal.value - descuentoTotal.value + aumentoTotal.value)

const iva = computed(() => subtotalAjustado.value * 0.19)

const total = computed(() => subtotalAjustado.value + iva.value)
</script>

<style scoped>
.pdf-container {
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px;
  line-height: 1.5;
  color: #1e293b;
  background: white;
  padding: 24px 28px;
  max-width: 210mm;
  margin: 0 auto;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── HEADER ───────────────────────────────────── */
.pdf-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.header-brand {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
}

.logo-image {
  display: block;
  max-height: 44px;
  max-width: 200px;
  height: auto;
  width: auto;
}

.partner-badges {
  display: flex;
  gap: 6px;
}

.partner-badge {
  font-size: 8px;
  font-weight: 600;
  color: #64748b;
  padding: 2px 7px;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  letter-spacing: 0.3px;
}

.header-contact {
  text-align: right;
  font-size: 8.5px;
  color: #64748b;
  line-height: 1.6;
}

.contact-row {
  margin: 1px 0;
}

.contact-label {
  font-weight: 600;
  color: #475569;
}

/* ── SECTION HEADERS ──────────────────────────── */
.section-header {
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 700;
  text-align: left;
  padding: 7px 12px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  border-bottom: 1px solid #e2e8f0;
}

/* ── INFO TABLES ──────────────────────────────── */
.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
}

.info-table td {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  font-size: 9.5px;
  vertical-align: top;
}

.info-label {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  width: 34%;
  white-space: nowrap;
}

.info-value {
  color: #1e293b;
}

.maps-link {
  color: #475569;
  text-decoration: underline;
  word-break: break-all;
}

/* ── INTRO TEXT ───────────────────────────────── */
.intro-text {
  margin: 16px 0;
  padding: 12px 14px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  border-radius: 0 8px 8px 0;
  font-size: 10px;
  font-style: italic;
  color: #334155;
  line-height: 1.6;
  break-inside: avoid;
  page-break-inside: avoid;
}

/* ── NOTES BOX ────────────────────────────────── */
.note-box {
  margin: 12px 0;
  padding: 12px 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.note-box-title {
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.note-box-list {
  margin: 0;
  padding-left: 18px;
  font-size: 9.5px;
  color: #475569;
}

.note-box-list li {
  margin: 3px 0;
}

.note-text {
  font-size: 9.5px;
  color: #475569;
  margin: 6px 0;
  line-height: 1.5;
}

/* ── SERVICES SECTION ─────────────────────────── */
.services-section {
  margin: 20px 0;
}

.services-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.services-section-header {
  background: #f1f5f9;
  color: #1e293b;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  border-bottom: 1px solid #e2e8f0;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.services-table thead th {
  background: #f8fafc;
  color: #1e293b;
  font-weight: 700;
  text-align: left;
  padding: 7px 5px;
  font-size: 8.5px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 1px solid #e2e8f0;
}

.col-img { width: 12%; text-align: center; }
.col-q { width: 7%; text-align: center; }
.col-cant { width: 7%; text-align: center; }
.col-desc { width: 25%; }
.col-precio { width: 13%; text-align: right; }
.col-subtotal { width: 13%; text-align: right; }
.col-dcto { width: 7%; text-align: center; }
.col-total { width: 13%; text-align: right; }

.services-table tbody td {
  padding: 6px 5px;
  border: 1px solid #e2e8f0;
  font-size: 9px;
  vertical-align: top;
}

.services-table tbody tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

.cell-c {
  text-align: center;
  color: #475569;
}

.cell-img {
  text-align: center;
  vertical-align: middle;
  padding: 4px;
}

.product-thumb {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin: 0 auto;
}

.product-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 6.5px;
  text-align: center;
  line-height: 1.2;
}

.cell-desc {
  font-weight: 500;
  color: #1e293b;
}

.cell-num {
  text-align: right;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-weight: 600;
  font-size: 8.5px;
}

.row-third {
  background: #f0f9ff;
}

.badge-third {
  display: inline-block;
  font-size: 7px;
  background: #e2e8f0;
  color: #475569;
  padding: 1px 6px;
  border-radius: 99px;
  margin-left: 5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  vertical-align: middle;
  border: 1px solid #cbd5e1;
}

.row-total-label {
  background: #f1f5f9;
}

.cell-total-label {
  text-align: right;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  padding: 8px 12px;
  font-size: 10px;
  letter-spacing: 0.5px;
  border: 1px solid #e2e8f0;
}

/* ── TOTALS ───────────────────────────────────── */
.totals-wrapper {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  break-inside: avoid;
  page-break-inside: avoid;
}

.totals-table {
  width: 320px;
  border-collapse: collapse;
  font-size: 9.5px;
  border-radius: 10px;
  overflow: hidden;
}

.totals-table thead th {
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 700;
  text-align: center;
  padding: 7px 6px;
  font-size: 8.5px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: 1px solid #e2e8f0;
}

.totals-table tbody td {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  text-align: center;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-weight: 600;
  font-size: 9px;
}

.totals-label {
  text-align: right;
  font-weight: 600;
  color: #475569;
  padding-right: 12px;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
}

.row-grand-total td {
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 700;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
}

.totals-label.grand {
  color: #1e293b;
  font-size: 10px;
}

.grand-value {
  font-size: 12px;
}

/* ── GALERÍA DE PRODUCTOS ─────────────────────── */
.gallery-page {
  margin-top: 20px;
  break-before: page;
  page-break-before: always;
}

.gallery-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
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
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.gallery-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 150px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 9px;
}

.gallery-name {
  font-size: 9.5px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  line-height: 1.3;
}

/* ── FOOTER ───────────────────────────────────── */
.pdf-footer {
  margin-top: 28px;
  padding-top: 14px;
  border-top: 2px solid #e2e8f0;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 10px;
  color: #64748b;
  font-style: italic;
  font-weight: 500;
}

.footer-date {
  margin: 5px 0 0;
  font-size: 8.5px;
  color: #94a3b8;
}
</style>
