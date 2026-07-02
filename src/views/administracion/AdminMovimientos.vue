<template>
  <div class="mov-page">

    <!-- Header -->
    <div class="mov-header">
      <div>
        <h1 class="mov-title">Movimientos económicos</h1>
        <p class="mov-sub">Bitácora de dinero que entra (pagos) y sale (órdenes de compra)</p>
      </div>
      <button class="mov-refresh" @click="load" :disabled="loading">
        <RefreshCw :size="15" :class="{ spin: loading }" />
      </button>
    </div>

    <!-- Filtros -->
    <div class="mov-filters">
      <select v-if="sedes.length" v-model="filtros.sedeId" class="mov-select" @change="load">
        <option value="">Todas las sedes</option>
        <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
      <input v-model="filtros.fechaInicio" type="date" class="mov-select" @change="load" />
      <input v-model="filtros.fechaFin" type="date" class="mov-select" @change="load" />
      <select v-model="filtroTipo" class="mov-select">
        <option value="">Ingresos y egresos</option>
        <option value="INGRESO">Solo ingresos</option>
        <option value="EGRESO">Solo egresos</option>
      </select>
    </div>

    <div v-if="loading && !data" class="mov-loading">
      <div class="mov-spinner" /><span>Cargando movimientos…</span>
    </div>
    <div v-else-if="error" class="mov-error">
      <AlertCircle :size="18" /> {{ error }}
      <button @click="load">Reintentar</button>
    </div>

    <template v-else-if="data">
      <!-- KPIs -->
      <div class="mov-kpis">
        <div class="mov-kpi mov-kpi--in">
          <div class="mov-kpi-icon"><ArrowDownCircle :size="18" color="#166534" /></div>
          <div>
            <span class="mov-kpi-label">Total ingresos</span>
            <span class="mov-kpi-value val-pos">{{ formatCOP(data.totalIngresos) }}</span>
          </div>
        </div>
        <div class="mov-kpi mov-kpi--out">
          <div class="mov-kpi-icon"><ArrowUpCircle :size="18" color="#991B1B" /></div>
          <div>
            <span class="mov-kpi-label">Total egresos</span>
            <span class="mov-kpi-value val-neg">{{ formatCOP(data.totalEgresos) }}</span>
          </div>
        </div>
        <div class="mov-kpi" :class="data.balance >= 0 ? 'mov-kpi--in' : 'mov-kpi--out'">
          <div class="mov-kpi-icon"><Scale :size="18" :color="data.balance >= 0 ? '#166534' : '#991B1B'" /></div>
          <div>
            <span class="mov-kpi-label">Balance del período</span>
            <span class="mov-kpi-value" :class="data.balance >= 0 ? 'val-pos' : 'val-neg'">{{ formatCOP(data.balance) }}</span>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="mov-table-wrap">
        <table class="mov-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Cotización</th>
              <th>Sede</th>
              <th class="mov-th-monto">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movimientosFiltrados" :key="m.id">
              <td class="mov-td-fecha">{{ fmtDate(m.fecha) }}</td>
              <td>
                <span class="mov-badge" :class="m.tipo === 'INGRESO' ? 'mov-badge--in' : 'mov-badge--out'">
                  <ArrowDownCircle v-if="m.tipo === 'INGRESO'" :size="11" />
                  <ArrowUpCircle v-else :size="11" />
                  {{ m.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso' }}
                </span>
              </td>
              <td class="mov-td-cat">{{ m.categoria }}</td>
              <td class="mov-td-desc">{{ m.descripcion }}</td>
              <td class="mov-td-cot">
                <span v-if="m.cotizacion?.id">#{{ m.cotizacion.numero }} — {{ m.cotizacion.empresa || 'Sin empresa' }}</span>
              </td>
              <td class="mov-td-sede">{{ m.sede }}</td>
              <td class="mov-td-monto" :class="m.tipo === 'INGRESO' ? 'val-pos' : 'val-neg'">
                {{ m.tipo === 'INGRESO' ? '+' : '−' }}{{ formatCOP(m.monto) }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!movimientosFiltrados.length" class="mov-empty">
          No hay movimientos para los filtros seleccionados
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, AlertCircle, ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-vue-next'
import { formatCOP } from '@/utils/currency.js'
import { getMovimientos } from '@/services/administracion.service.js'
import { getSedes } from '@/services/sedes.service.js'

const loading = ref(false)
const error   = ref(null)
const data    = ref(null)
const sedes   = ref([])
const filtroTipo = ref('')

const filtros = ref({ sedeId: '', fechaInicio: '', fechaFin: '' })

const movimientosFiltrados = computed(() => {
  if (!data.value) return []
  if (!filtroTipo.value) return data.value.movimientos
  return data.value.movimientos.filter(m => m.tipo === filtroTipo.value)
})

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

async function load() {
  loading.value = true
  error.value   = null
  try {
    data.value = await getMovimientos({
      sedeId: filtros.value.sedeId || undefined,
      fechaInicio: filtros.value.fechaInicio || undefined,
      fechaFin: filtros.value.fechaFin || undefined,
    })
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando movimientos'
  } finally {
    loading.value = false
  }
}

async function loadSedes() {
  try {
    const { data: res } = await getSedes()
    sedes.value = res
  } catch (e) {
    sedes.value = []
  }
}

onMounted(() => { load(); loadSedes() })
</script>

<style scoped>
.mov-page {
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mov-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mov-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #0F1A2E;
  margin: 0;
}
.mov-sub { font-size: 13px; color: #64748B; margin: 3px 0 0; }
.mov-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  color: #64748B;
  transition: border-color .15s, color .15s;
}
.mov-refresh:hover { border-color: #27C8D8; color: #27C8D8; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.mov-filters { display: flex; flex-wrap: wrap; gap: 10px; }
.mov-select {
  padding: 8px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  color: #0F1A2E;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  outline: none;
}
.mov-select:focus { border-color: #27C8D8; }

.mov-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px;
  color: #64748B;
  font-size: 14px;
}
.mov-spinner {
  width: 30px; height: 30px;
  border: 3px solid #E2E8F0;
  border-top-color: #27C8D8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.mov-error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  color: #DC2626;
  font-size: 13px;
  font-weight: 500;
}
.mov-error button {
  margin-left: auto;
  padding: 5px 12px;
  border: 1.5px solid #DC2626;
  border-radius: 8px;
  background: none;
  color: #DC2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.mov-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.mov-kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E5EAF0;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
}
.mov-kpi--in  { border-left: 3px solid #6EE7B7; }
.mov-kpi--out { border-left: 3px solid #FCA5A5; }
.mov-kpi-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: #F8FAFC;
  flex-shrink: 0;
}
.mov-kpi-label { display: block; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
.mov-kpi-value { display: block; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; }
.val-pos { color: #059669; }
.val-neg { color: #DC2626; }

.mov-table-wrap {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E5EAF0;
  overflow: hidden;
  overflow-x: auto;
}
.mov-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.mov-table thead tr { background: #F8FAFC; }
.mov-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 1.5px solid #E5EAF0;
  white-space: nowrap;
}
.mov-th-monto { text-align: right; }
.mov-table td { padding: 10px 14px; border-bottom: 1px solid #F1F5FA; color: #374151; vertical-align: middle; }
.mov-table tbody tr:hover td { background: #F8FEFF; }
.mov-table tr:last-child td { border-bottom: none; }
.mov-td-fecha { white-space: nowrap; color: #64748B; }
.mov-td-cat { font-weight: 600; color: #0F1A2E; white-space: nowrap; }
.mov-td-desc { max-width: 260px; }
.mov-td-cot a { color: #27C8D8; text-decoration: none; font-weight: 600; white-space: nowrap; }
.mov-td-cot a:hover { text-decoration: underline; }
.mov-td-sede { white-space: nowrap; color: #64748B; }
.mov-td-monto { text-align: right; font-weight: 700; white-space: nowrap; }

.mov-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.mov-badge--in  { background: #F0FDF4; color: #166534; }
.mov-badge--out { background: #FEF2F2; color: #991B1B; }

.mov-empty {
  text-align: center;
  padding: 40px;
  color: #94A3B8;
  font-size: 13px;
  font-style: italic;
}
</style>
