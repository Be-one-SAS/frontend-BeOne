<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth";
import { getSedes } from "../../services/sedes.service";
import { getCommissionsReport, getCommissionsExport, getCommissionsVendedores } from "../../services/quotation.service";
import { formatCOP } from "../../utils/currency.js";
import SelectLabel from "../../components/input/SelectLabel.vue";
import BaseTable from "../../components/ui/BaseTable.vue";

const { user } = useAuth();
const userRoles = computed(() => user.value?.roles ?? []);
// Igual a ADMIN_ROLES en backend-BeOne/src/quotations/quotations.service.ts —
// determina quién ve utilidad/margen/comisión estructural/reserva.
const ADMIN_ROLES_COMISIONES = ['ADMINISTRADOR', 'ADMIN', 'DIRECCION', 'LIDER', 'SUPERVISOR'];
const isAdminComisiones = computed(() => userRoles.value.some(r => ADMIN_ROLES_COMISIONES.includes(r)));
// Esta vista siempre mira TODAS las sedes (allSedes=true en la request), sin
// importar la sede propia del usuario — el filtro de sede sirve para acotar,
// no para "desbloquear" acceso, así que se muestra siempre en esta página.
const mostrarFiltroSede = computed(() => isAdminComisiones.value);

const estados = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "Aprobada", value: "Aprobada" },
  { label: "Rechazada", value: "Rechazada" },
  { label: "Vencida",   value: "Vencida"   },
];

const filtros = ref({ fechaDesde: '', fechaHasta: '', estado: '', search: '', sedeId: '', vendedor: '' });
const rowsRaw = ref([]);
const totals = ref(null);
const loading = ref(false);
const exporting = ref(false);
const sedeOptions = ref([]);
const vendedorOptions = ref([]);

// Paginación por COTIZACIÓN (no por fila): una cotización con varios ítems
// aporta varias filas, así que el backend pagina antes de explotar por producto.
const PAGE_LIMIT = 30;
const page = ref(1);
const totalPages = ref(1);
const totalQuotations = ref(0);
const visiblePages = computed(() => {
  const start = Math.max(1, page.value - 2);
  const end = Math.min(totalPages.value, page.value + 2);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
});

// Una fila por producto (propio o de tercero). El % de comisión es el mismo
// para todos los productos de una misma cotización (el motor de pricing
// calcula un único margen equivalente ponderado, no uno por producto) — lo
// que cambia por fila es el $ de comisión, proporcional a la venta de ese producto.
const columnsBase = [
  { key: 'numero', label: 'Cotización', width: '90px' },
  { key: 'producto', label: 'Producto' },
  { key: 'tipo', label: 'Tipo', width: '90px' },
  { key: 'empresa', label: 'Cliente' },
  { key: 'vendedorNombre', label: 'Vendedor' },
  { key: 'cantidad', label: 'Cant.', width: '70px' },
  { key: 'costo', label: 'Costo' },
  { key: 'venta', label: 'Venta' },
  { key: 'comisionVisiblePct', label: '% Comisión' },
  { key: 'comisionVisibleMonto', label: 'Comisión $' },
];
const columnsAdmin = [
  { key: 'margenEquivalente', label: 'Margen equiv.' },
  { key: 'comisionEstructuralPct', label: '% Estructural' },
  { key: 'comisionEstructuralMonto', label: 'Estructural $' },
  { key: 'reserva', label: 'Reserva' },
];
const columns = computed(() =>
  isAdminComisiones.value ? [...columnsBase, ...columnsAdmin] : columnsBase
);

const rows = computed(() => rowsRaw.value);

const cargarSedes = async () => {
  if (!mostrarFiltroSede.value) return;
  try {
    const { data } = await getSedes();
    sedeOptions.value = (Array.isArray(data) ? data : []).map(s => ({ value: s.id, label: s.nombre }));
  } catch (error) {
    console.error("[Comisiones] Error cargando sedes:", error);
  }
};

const cargarVendedores = async () => {
  try {
    const { data } = await getCommissionsVendedores({ allSedes: true });
    vendedorOptions.value = (Array.isArray(data) ? data : []).map(nombre => ({ value: nombre, label: nombre }));
  } catch (error) {
    console.error("[Comisiones] Error cargando vendedores:", error);
  }
};

const cargarComisiones = async () => {
  loading.value = true;
  try {
    const { data } = await getCommissionsReport({
      ...filtros.value,
      allSedes: true,
      page: page.value,
      pageLimit: PAGE_LIMIT,
    });
    rowsRaw.value = data.data;
    totals.value = data.totals;
    totalPages.value = data.totalPages;
    totalQuotations.value = data.totalQuotations;
  } catch (error) {
    console.error("[Comisiones] Error cargando comisiones:", error);
  } finally {
    loading.value = false;
  }
};

const aplicarFiltros = () => {
  page.value = 1;
  cargarComisiones();
};

const cambiarPagina = (p) => {
  if (p < 1 || p > totalPages.value || p === page.value) return;
  page.value = p;
  cargarComisiones();
};

// Exporta TODO el resultado filtrado (sin paginar, tope de seguridad 2000
// cotizaciones en el backend), no solo la página visible en pantalla.
const exportarCSV = async () => {
  exporting.value = true;
  try {
    const { data } = await getCommissionsExport({ ...filtros.value, allSedes: true });
    const headers = ['Cotización', 'Producto', 'Tipo', 'Cliente', 'Vendedor', 'Fecha', 'Estado', 'Cantidad', 'Costo', 'Venta', '% Comisión', 'Comisión $'];
    if (isAdminComisiones.value) headers.push('Margen equiv.', '% Estructural', 'Estructural $', 'Reserva');

    const csvRows = data.data.map(r => {
      const row = [
        r.numero,
        r.producto,
        r.tipo === 'PROPIO' ? 'Propio' : 'Tercero',
        r.empresa || '',
        r.vendedorNombre || '',
        r.fechaCotizacion ? new Date(r.fechaCotizacion).toLocaleDateString('es-CO') : '',
        r.estado || '',
        r.cantidad,
        r.costo,
        r.venta,
        r.comisionVisiblePct,
        r.comisionVisibleMonto,
      ];
      if (isAdminComisiones.value) row.push(r.margenEquivalente, r.comisionEstructuralPct, r.comisionEstructuralMonto, r.reserva);
      return row;
    });

    const csv = [headers, ...csvRows].map(row => row.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comisiones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[Comisiones] Error exportando CSV:", error);
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  cargarSedes();
  cargarVendedores();
  cargarComisiones();
});
</script>

<template>
  <div class="com-page">

    <div class="com-header">
      <div>
        <h1 class="com-title">Comisiones</h1>
        <p class="com-subtitle">Comisión, utilidad y margen por cotización (Motor de Pricing V2)</p>
      </div>
    </div>

    <div v-if="isAdminComisiones && totals" class="com-kpis">
      <div class="com-kpi">
        <span class="com-kpi-label">Venta total</span>
        <span class="com-kpi-value">{{ formatCOP(totals.ventaTotal) }}</span>
      </div>
      <div class="com-kpi">
        <span class="com-kpi-label">Comisión visible</span>
        <span class="com-kpi-value">{{ formatCOP(totals.comisionVisibleTotal) }}</span>
      </div>
      <div class="com-kpi" v-if="totals.comisionEstructuralTotal != null">
        <span class="com-kpi-label">Comisión estructural</span>
        <span class="com-kpi-value">{{ formatCOP(totals.comisionEstructuralTotal) }}</span>
      </div>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- FILTROS                                    -->
    <!-- ══════════════════════════════════════════ -->
    <div class="com-filters">
      <input v-model="filtros.fechaDesde" type="date" class="com-input" title="Desde" />
      <input v-model="filtros.fechaHasta" type="date" class="com-input" title="Hasta" />

      <SelectLabel
        v-model="filtros.estado"
        :options="estados"
        placeholder="Todos los estados"
      />

      <input
        v-model="filtros.search"
        type="text"
        placeholder="Número o empresa…"
        class="com-input"
      />

      <SelectLabel
        v-model="filtros.vendedor"
        :options="vendedorOptions"
        placeholder="Todos los vendedores"
      />

      <SelectLabel
        v-if="mostrarFiltroSede"
        v-model="filtros.sedeId"
        :options="sedeOptions"
        placeholder="Todas las unidades"
      />

      <button type="button" class="com-btn-apply" :disabled="loading" @click="aplicarFiltros">
        {{ loading ? 'Cargando…' : 'Aplicar filtros' }}
      </button>

      <button type="button" class="com-btn-export" :disabled="exporting || !rows.length" @click="exportarCSV">
        {{ exporting ? 'Exportando…' : 'Exportar CSV' }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════ -->
    <!-- TABLA                                      -->
    <!-- ══════════════════════════════════════════ -->
    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      empty-text="No hay cotizaciones con comisión en este período"
      :page-size="500"
    >
      <template #cell-tipo="{ value }">{{ value === 'PROPIO' ? 'Propio' : 'Tercero' }}</template>
      <template #cell-costo="{ value }">{{ formatCOP(value) }}</template>
      <template #cell-venta="{ value }">{{ formatCOP(value) }}</template>
      <template #cell-comisionVisiblePct="{ value }">{{ value }}%</template>
      <template #cell-comisionVisibleMonto="{ value }">{{ formatCOP(value) }}</template>
      <template v-if="isAdminComisiones" #cell-margenEquivalente="{ value }">{{ value != null ? value.toFixed(2) + '%' : '—' }}</template>
      <template v-if="isAdminComisiones" #cell-comisionEstructuralPct="{ value }">{{ value }}%</template>
      <template v-if="isAdminComisiones" #cell-comisionEstructuralMonto="{ value }">{{ formatCOP(value) }}</template>
      <template v-if="isAdminComisiones" #cell-reserva="{ value }">{{ formatCOP(value) }}</template>
    </BaseTable>

    <!-- Paginación por cotización (no por fila) -->
    <div v-if="totalPages > 1" class="com-pagination">
      <span class="com-pag-info">Página {{ page }} de {{ totalPages }} · {{ totalQuotations }} cotizaciones</span>
      <div class="com-pag-btns">
        <button class="com-pag-btn" :disabled="page <= 1" @click="cambiarPagina(page - 1)">‹</button>
        <button
          v-for="p in visiblePages"
          :key="p"
          class="com-pag-btn"
          :class="{ 'com-pag-btn--active': p === page }"
          @click="cambiarPagina(p)"
        >{{ p }}</button>
        <button class="com-pag-btn" :disabled="page >= totalPages" @click="cambiarPagina(page + 1)">›</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.com-page { width: 100%; }

.com-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }

.com-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  margin: 0 0 4px;
  line-height: 1.2;
}

.com-subtitle {
  font-size: 13px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.com-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.com-kpi {
  background: #fff;
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.com-kpi-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3, #94A3B8);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.com-kpi-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-1, #0F1A2E);
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.com-filters {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06);
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .com-filters { grid-template-columns: repeat(5, 1fr); }
}

.com-input {
  width: 100%;
  background: #F8FAFC;
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-1, #0F1A2E);
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.com-input:focus {
  border-color: var(--primary, #27C8D8);
  box-shadow: 0 0 0 3px rgba(39,200,216, 0.1);
}

.com-input::placeholder { color: var(--text-3, #94A3B8); }

.com-btn-apply {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--primary, #27C8D8);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.com-btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }
.com-btn-apply:hover:not(:disabled) { opacity: 0.9; }

.com-btn-export {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fff;
  color: var(--text-1, #0F1A2E);
  border: 1px solid #E2EBF6;
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.com-btn-export:disabled { opacity: 0.5; cursor: not-allowed; }
.com-btn-export:hover:not(:disabled) { background: #F8FAFC; }

/* ─── Paginación ───────────────────────────────────────── */
.com-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.com-pag-info {
  font-size: 12px;
  color: var(--text-3, #94A3B8);
  font-family: 'Inter', sans-serif;
}

.com-pag-btns { display: flex; gap: 4px; }

.com-pag-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #E2EBF6;
  background: #fff;
  color: var(--text-1, #0F1A2E);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.com-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.com-pag-btn:hover:not(:disabled) { background: #F8FAFC; }

.com-pag-btn--active {
  background: var(--primary, #27C8D8);
  border-color: var(--primary, #27C8D8);
  color: #fff;
}
</style>
