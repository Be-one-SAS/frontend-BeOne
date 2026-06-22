<template>
  <div ref="pdfContent" class="pdf-container">
    <!-- HEADER CON LOGOS -->
    <div class="pdf-header">
      <div class="header-logos">
        <div class="beone-logo">
          <img src="/assets/logo.png" alt="Be One Entretenimiento" class="logo-image" />
        </div>
        <div class="partner-logos">
          <span class="partner-logo">IAAPA</span>
          <span class="partner-logo">FONTUR Colombia</span>
          <span class="partner-logo">ACOLAP</span>
        </div>
      </div>
      <div class="header-address">
        <p class="address-line"><strong>Bogotá:</strong> Carrera 71c # 75c 12</p>
        <p class="address-line"><strong>Medellín:</strong> Carrera 80b # 34a 35</p>
        <p class="address-line"><strong>PBX:</strong> 6015481954</p>
        <p class="address-line">beone.eventoscorporativos</p>
      </div>
    </div>

    <!-- TABLA INFORMACIÓN COTIZACIÓN -->
    <table class="info-table">
      <thead>
        <tr>
          <th colspan="2" class="table-header">INFORMACIÓN DE COTIZACIÓN</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="label">No. COTIZACIÓN</td>
          <td class="value">{{ quotation.numero }}-2026</td>
        </tr>
        <tr>
          <td class="label">AGENTE COMERCIAL</td>
          <td class="value">{{ quotation.agenteComercial || '—' }}</td>
        </tr>
        <tr>
          <td class="label">FECHA DE COTIZACIÓN</td>
          <td class="value">{{ formatDate(quotation.fechaCotizacion) }}</td>
        </tr>
        <tr>
          <td class="label">CLIENTE</td>
          <td class="value">{{ quotation?.cliente?.name || '—' }}</td>
        </tr>
        <tr>
          <td class="label">EMPRESA</td>
          <td class="value">{{ quotation.empresa || '—' }}</td>
        </tr>
        <tr>
          <td class="label">CONTACTO</td>
          <td class="value">{{ quotation.contacto || '—' }}</td>
        </tr>
        <tr>
          <td class="label">CORREO</td>
          <td class="value">{{ quotation.correo || '—' }}</td>
        </tr>
        <tr>
          <td class="label">CELULAR</td>
          <td class="value">{{ quotation.celular || '—' }}</td>
        </tr>
        <tr>
          <td class="label">FECHA - EVENTO - INICIO</td>
          <td class="value">{{ formatDate(quotation.operationWindow?.eventStartAt) }} {{ formatTime(quotation.operationWindow?.eventStartAt) }}</td>
        </tr>
        <tr>
          <td class="label">FECHA - EVENTO - FIN</td>
          <td class="value">{{ formatDate(quotation.operationWindow?.eventEndAt) }} {{ formatTime(quotation.operationWindow?.eventEndAt) }}</td>
        </tr>
        <tr>
          <td class="label">LOCACIÓN EVENTO</td>
          <td class="value">{{ quotation.ubicacion || '—' }}</td>
        </tr>
        <tr>
          <td class="label">LINK DIRECCIÓN EN MAPS</td>
          <td class="value">
            <span v-if="quotation.linkMaps" class="maps-link">{{ quotation.linkMaps }}</span>
            <span v-else>—</span>
          </td>
        </tr>
        <tr>
          <td class="label">HORARIO INICIO EVENTO</td>
          <td class="value">{{ formatTime(quotation.operationWindow?.eventStartAt) }}</td>
        </tr>
        <tr>
          <td class="label">HORARIO FINALIZACIÓN EVENTO</td>
          <td class="value">{{ formatTime(quotation.operationWindow?.eventEndAt) }}</td>
        </tr>
        <tr>
          <td class="label">NÚMERO DE ASISTENTES</td>
          <td class="value">{{ quotation.asistentes || '—' }}</td>
        </tr>
        <tr>
          <td class="label">UNIDAD EJECUCIÓN + TIPO DE SUELO</td>
          <td class="value">
            {{ quotation.unidadEjecucion || '—' }} {{ quotation.unidadEjecucion && quotation.tipoSuelo ? '+' : '' }} {{ quotation.tipoSuelo || '' }}
          </td>
        </tr>
        <tr>
          <td class="label">VIGENCIA DE COTIZACIÓN</td>
          <td class="value">{{ quotation.vigencia || '—' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- TEXTO INTRODUCTORIO -->
    <div class="intro-text">
      <p class="intro-paragraph">
        <em><strong>En respuesta a su amable solicitud, es un gusto para Be One SAS presentar nuestra oferta de servicios para la realización de su evento.</strong></em>
      </p>
    </div>

    <!-- NOTA 1 -->
    <div class="notes-box">
      <p class="note-title">NOTA 1:</p>
      <ol class="note-list">
        <li>Se envía cotización con el fin de ser aprobada por el cliente.</li>
        <li>Se confirma reserva con el 50% del valor del alquiler.</li>
        <li>Se envía factura de venta y se cancela el 50% restante antes del evento.</li>
      </ol>
    </div>

    <!-- TABLA DE SERVICIOS -->
    <div class="services-section">
      <div class="services-header">
        <h3 class="services-title">PRODUCCIÓN LOGÍSTICA</h3>
      </div>
      
      <table class="services-table">
        <thead>
          <tr>
            <th class="th-q-jornada">Q JORNADA</th>
            <th class="th-cantidad">CANTIDAD</th>
            <th class="th-descripcion">DESCRIPCION</th>
            <th class="th-precio">PRECIO UNITARIO</th>
            <th class="th-subtotal">SUBTOTAL ITEM</th>
            <th class="th-descuento">% DESCUENTO</th>
            <th class="th-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <!-- Productos Propios -->
          <template v-for="(item, idx) in (quotation.items || [])" :key="'own-' + idx">
            <tr>
              <td class="td-q-jornada">{{ item.cantidadJornada || item.quantity || 1 }}</td>
              <td class="td-cantidad">{{ item.cantidadProducto || 1 }}</td>
              <td class="td-descripcion">
                {{ item.producto?.nombre || item.product?.nombre || item.nombre || item.dispositivo || item.descripcion || 'Producto' }}
              </td>
              <td class="td-precio">{{ formatCurrency(item.unitPrice || 0) }}</td>
              <td class="td-subtotal">{{ formatCurrency((item.unitPrice || 0) * (item.cantidadProducto || item.quantity || 1)) }}</td>
              <td class="td-descuento">{{ item.descuentoPct || 0 }}%</td>
              <td class="td-total">{{ formatCurrency(calculateItemTotal(item)) }}</td>
            </tr>
          </template>
          
          <!-- Productos de Terceros -->
          <template v-for="(item, idx) in (quotation.thirdPartyItems || [])" :key="'third-' + idx">
            <tr class="third-party-row">
              <td class="td-q-jornada">{{ item.cantidadJornada || 1 }}</td>
              <td class="td-cantidad">{{ item.cantidad || 1 }}</td>
              <td class="td-descripcion">
                {{ item.catalogItem?.nombre || item.nombre || 'Producto de tercero' }}
                <span class="third-party-badge">Tercero</span>
              </td>
              <td class="td-precio">{{ formatCurrency(item.precioUnitario || item.costo || 0) }}</td>
              <td class="td-subtotal">{{ formatCurrency((item.precioUnitario || item.costo || 0) * (item.cantidad || 1)) }}</td>
              <td class="td-descuento">{{ item.descuentoPct || 0 }}%</td>
              <td class="td-total">{{ formatCurrency(item.precioTotal || calculateItemTotal(item)) }}</td>
            </tr>
          </template>
          
          <!-- VALOR TOTAL ROW -->
          <tr class="total-row">
            <td colspan="7" class="td-valor-total">VALOR TOTAL</td>
          </tr>
        </tbody>
      </table>

      <!-- RESUMEN DE TOTALES -->
      <div class="totals-summary">
        <table class="totals-table">
          <thead>
            <tr>
              <th class="th-total-summary">SUB TOTAL</th>
              <th class="th-total-summary">CON DESCUENTO</th>
              <th class="th-total-summary">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-total-summary">{{ formatCurrency(subtotal) }}</td>
              <td class="td-total-summary">{{ formatCurrency(subtotalConDescuento) }}</td>
              <td class="td-total-summary">{{ formatCurrency(subtotalConDescuento) }}</td>
            </tr>
            <tr>
              <td class="td-total-label" colspan="2">IVA (19%)</td>
              <td class="td-total-iva">{{ formatCurrency(iva) }}</td>
            </tr>
            <tr class="total-final-row">
              <td class="td-total-label" colspan="2">VALOR TOTAL</td>
              <td class="td-total-final">{{ formatCurrency(total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- NOTA 2 -->
    <div class="notes-box notes-box-2">
      <p class="note-title">NOTA 2:</p>
      <p class="note-text">
        <strong>Condiciones del servicio:</strong> La presente cotización tiene una validez de {{ quotation.vigencia || '30 días' }}. 
        Los precios están expresados en pesos colombianos e incluyen IVA cuando aplica.
      </p>
      <p class="note-text">
        <strong>Política de cancelación:</strong> Cancelaciones con menos de 48 horas de anticipación al evento 
        tendrán un cargo del 50% del valor total. No-shows (no presentación) tendrán un cargo del 100%.
      </p>
    </div>

    <!-- FOOTER -->
    <div class="pdf-footer">
      <p class="footer-text">Gracias por confiar en Be One Entretenimiento</p>
      <p class="footer-date">
        Documento generado el {{ new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  quotation: {
    type: Object,
    required: true
  }
})

const pdfContent = ref(null)

// Helpers de formato
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

const formatCurrency = (value) => {
  if (!value && value !== 0) return '$ 0'
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
  return '$ ' + numValue.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

const calculateItemTotal = (item) => {
  const unitPrice = item.unitPrice || item.precioUnitario || item.costo || 0
  const quantity = item.cantidadProducto || item.cantidad || item.quantity || 1
  const descuentoPct = item.descuentoPct || 0
  const subtotal = unitPrice * quantity
  const descuento = subtotal * (descuentoPct / 100)
  return subtotal - descuento
}

// Cálculos de totales
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

const subtotalConDescuento = computed(() => {
  return subtotal.value - descuentoTotal.value
})

const iva = computed(() => {
  return subtotalConDescuento.value * 0.19
})

const total = computed(() => {
  return subtotalConDescuento.value + iva.value
})
</script>

<style scoped>
.pdf-container {
  font-family: 'Helvetica', 'Arial', sans-serif;
  font-size: 11px;
  line-height: 1.4;
  color: #1a1a1a;
  background: white;
  padding: 20px;
  max-width: 210mm;
  margin: 0 auto;
}

/* HEADER */
.pdf-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #00BCD4;
}

.header-logos {
  flex: 1;
}

.beone-logo {
  margin-bottom: 8px;
}

.logo-image {
  height: 50px;
  width: auto;
  object-fit: contain;
}

.partner-logos {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.partner-logo {
  font-size: 9px;
  font-weight: 600;
  color: #999;
  padding: 2px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
}

.header-address {
  text-align: right;
  font-size: 9px;
  color: #666;
}

.address-line {
  margin: 2px 0;
}

/* INFO TABLE */
.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
}

.table-header {
  background: #00BCD4;
  color: white;
  font-weight: 600;
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  text-transform: uppercase;
}

.info-table td {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  font-size: 10px;
}

.info-table .label {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
  width: 40%;
}

.info-table .value {
  color: #1a1a1a;
}

.maps-link {
  color: #00BCD4;
  text-decoration: underline;
}

/* INTRO TEXT */
.intro-text {
  margin: 20px 0;
  padding: 12px;
  background: #f9f9f9;
  border-left: 3px solid #00BCD4;
}

.intro-paragraph {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
}

/* NOTES BOX */
.notes-box {
  margin: 15px 0;
  padding: 12px;
  background: #fff9e6;
  border: 1px solid #ffe0b2;
  border-radius: 4px;
}

.note-title {
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  font-size: 10px;
  text-transform: uppercase;
}

.note-list {
  margin: 0;
  padding-left: 20px;
  font-size: 10px;
  color: #555;
}

.note-list li {
  margin: 4px 0;
}

.notes-box-2 .note-text {
  font-size: 10px;
  color: #555;
  margin: 6px 0;
  line-height: 1.5;
}

/* SERVICES SECTION */
.services-section {
  margin: 25px 0;
}

.services-header {
  background: #00BCD4;
  padding: 8px 12px;
  margin-bottom: 0;
}

.services-title {
  margin: 0;
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.services-table thead th {
  background: #00BCD4;
  color: white;
  font-weight: 600;
  text-align: left;
  padding: 8px 6px;
  font-size: 9px;
  text-transform: uppercase;
  border: 1px solid #0097a7;
}

.th-q-jornada { width: 8%; text-align: center; }
.th-cantidad { width: 8%; text-align: center; }
.th-descripcion { width: 35%; }
.th-precio { width: 12%; text-align: right; }
.th-subtotal { width: 12%; text-align: right; }
.th-descuento { width: 8%; text-align: center; }
.th-total { width: 12%; text-align: right; }

.services-table tbody td {
  padding: 8px 6px;
  border: 1px solid #e0e0e0;
  font-size: 10px;
}

.td-q-jornada, .td-cantidad {
  text-align: center;
  color: #666;
}

.td-descripcion {
  font-weight: 500;
  color: #1a1a1a;
}

.td-precio, .td-subtotal, .td-total {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.td-descuento {
  text-align: center;
  color: #666;
}

.third-party-row {
  background: #f0f9ff;
}

.third-party-badge {
  display: inline-block;
  font-size: 8px;
  background: #00BCD4;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 6px;
  font-weight: 600;
}

.total-row {
  background: #00BCD4;
}

.td-valor-total {
  text-align: right;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  padding: 10px 6px;
  font-size: 11px;
}

/* TOTALES SUMMARY */
.totals-summary {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.totals-table {
  width: 350px;
  border-collapse: collapse;
  font-size: 10px;
}

.totals-table thead th {
  background: #00BCD4;
  color: white;
  font-weight: 600;
  text-align: center;
  padding: 8px 6px;
  font-size: 9px;
  text-transform: uppercase;
  border: 1px solid #0097a7;
}

.th-total-summary {
  width: 33.33%;
}

.totals-table tbody td {
  padding: 8px 6px;
  border: 1px solid #e0e0e0;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.td-total-summary {
  font-weight: 600;
  color: #1a1a1a;
}

.td-total-label {
  text-align: right;
  font-weight: 600;
  color: #333;
  padding-right: 12px;
}

.td-total-iva {
  font-weight: 600;
  color: #1a1a1a;
}

.total-final-row td {
  background: #00BCD4;
  color: white;
  font-weight: 700;
  font-size: 11px;
  padding: 10px 6px;
}

.td-total-final {
  font-size: 13px;
}

/* FOOTER */
.pdf-footer {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 2px solid #00BCD4;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 10px;
  color: #666;
  font-style: italic;
}

.footer-date {
  margin: 6px 0 0;
  font-size: 9px;
  color: #999;
}
</style>
