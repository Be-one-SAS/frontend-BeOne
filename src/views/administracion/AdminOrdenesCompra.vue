<template>
  <div class="oc-page">

    <!-- ── Header ──────────────────────────────────────── -->
    <div class="oc-header">
      <div>
        <h1 class="oc-title">Órdenes de Compra</h1>
        <p class="oc-subtitle">Emisión y seguimiento de órdenes de compra vinculadas a cotizaciones aprobadas</p>
      </div>
      <div class="oc-header-actions">
        <button class="oc-btn-ghost" @click="exportCSV" :disabled="!rows.length">
          <Download :size="14" /> Exportar CSV
        </button>
        <button v-if="canDo('OrdenCompraCrear', OC_ROLES)" class="oc-btn-primary" @click="openCreate">
          <Plus :size="14" /> Nueva OC
        </button>
      </div>
    </div>

    <!-- ── KPI cards ───────────────────────────────────── -->
    <div class="oc-kpi-row">
      <div
        v-for="kpi in kpiCards" :key="kpi.key"
        class="oc-kpi"
        :class="{ active: activeTab === kpi.key }"
        @click="setTab(kpi.key)"
      >
        <div class="oc-kpi-top">
          <component :is="kpi.icon" :size="15" :style="{ color: kpi.color }" />
          <span class="oc-kpi-label">{{ kpi.label }}</span>
        </div>
        <span class="oc-kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</span>
        <span v-if="kpi.sub" class="oc-kpi-sub">{{ kpi.sub }}</span>
      </div>
    </div>

    <!-- ── Split layout ────────────────────────────────── -->
    <div class="oc-split">

      <!-- ── Panel izquierdo ────────────────────────────── -->
      <div class="oc-list-panel">

        <!-- Mode switcher -->
        <div class="oc-panel-switcher">
          <button class="oc-panel-btn" :class="{ active: leftPanelMode === 'cotizaciones' }" @click="setLeftPanel('cotizaciones')">
            <FileText :size="13" />
            Cotizaciones aprobadas
            <span class="oc-panel-count" :class="{ 'oc-panel-count-alert': cotizacionesSinOC.length }">
              {{ cotizacionesSinOC.length }}
            </span>
          </button>
          <button class="oc-panel-btn" :class="{ active: leftPanelMode === 'ordenes' }" @click="setLeftPanel('ordenes')">
            <ShoppingCart :size="13" />
            Órdenes de compra
            <span class="oc-panel-count">{{ rows.length }}</span>
          </button>
        </div>

        <div class="oc-list-toolbar">
          <div class="oc-search-wrap">
            <Search :size="13" class="oc-search-icon" />
            <input
              v-model="filters.search"
              class="oc-search-input"
              :placeholder="leftPanelMode === 'cotizaciones' ? 'Buscar evento, cliente…' : 'Buscar evento, proveedor…'"
            />
          </div>
        </div>

        <!-- ═══ MODO COTIZACIONES ═══ -->
        <template v-if="leftPanelMode === 'cotizaciones'">
          <div class="oc-list-tabs">
            <button class="oc-list-tab" :class="{ active: cotFilter === 'pendiente' }" @click="cotFilter = 'pendiente'">
              Sin OC
              <span class="oc-tab-badge" style="background:#FEFCE8;color:#854D0E">{{ cotizacionesSinOC.length }}</span>
            </button>
            <button class="oc-list-tab" :class="{ active: cotFilter === 'todas' }" @click="cotFilter = 'todas'">
              Todas aprobadas
              <span class="oc-tab-badge" style="background:#F0FDF4;color:#166534">{{ cotizacionesAprobadas.length }}</span>
            </button>
          </div>

          <div v-if="loadingCots" class="oc-list-scroll">
            <div v-for="i in 4" :key="i" class="oc-card-sk" />
          </div>

          <div v-else-if="!filteredCots.length" class="oc-list-empty">
            <FileText :size="32" class="opacity-20" />
            <p>No hay cotizaciones{{ cotFilter === 'pendiente' ? ' sin orden de compra' : ' aprobadas' }}</p>
          </div>

          <div v-else class="oc-list-scroll">
            <div
              v-for="cot in filteredCots"
              :key="cot.id"
              class="oc-card oc-cot-card"
              :class="{ selected: selectedCot?.id === cot.id, 'has-oc': ocsByCot(cot).length > 0 }"
              @click="selectCot(cot)"
            >
              <div class="oc-card-head">
                <span class="oc-card-id"># {{ cot.numero }}</span>
                <div class="oc-cot-badges">
                  <span v-if="ocsByCot(cot).length" class="oc-cot-has-oc">
                    <CheckCircle2 :size="10" /> {{ ocsByCot(cot).length }} OC
                  </span>
                  <span class="oc-estado-pill" style="background:#F0FDF4;color:#166534">Aprobada</span>
                </div>
              </div>
              <p class="oc-card-evento">{{ cot.description || cot.empresa || 'Sin nombre' }}</p>
              <div class="oc-card-dates">
                <CalendarDays :size="11" />
                <span>{{ fmtDateShort(cot.operationWindow?.eventStartAt) }}</span>
                <span v-if="cot.operationWindow?.eventEndAt" class="oc-date-sep">→</span>
                <span v-if="cot.operationWindow?.eventEndAt">{{ fmtDateShort(cot.operationWindow.eventEndAt) }}</span>
              </div>
              <div class="oc-card-proveedor">
                <Users :size="11" />
                <span>{{ cot.cliente?.name || cot.empresa || cot.contacto || '—' }}</span>
              </div>
              <div class="oc-card-footer">
                <span class="oc-cot-agente">{{ cot.agenteComercial || '—' }}</span>
                <div class="oc-card-total">
                  <span class="oc-card-total-label">Total cot.</span>
                  <span class="oc-card-total-val">{{ fmtMoney(cot.total) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══ MODO ÓRDENES ═══ -->
        <template v-else>
          <div class="oc-list-tabs">
            <button
              v-for="tab in listTabs" :key="tab.key"
              class="oc-list-tab"
              :class="{ active: activeTab === tab.key }"
              @click="setTab(tab.key)"
            >
              {{ tab.label }}
              <span v-if="tab.count" class="oc-tab-badge" :style="tab.badgeStyle">{{ tab.count }}</span>
            </button>
          </div>

          <div v-if="loading" class="oc-list-scroll">
            <div v-for="i in 5" :key="i" class="oc-card-sk" />
          </div>

          <div v-else-if="error" class="oc-list-error">
            <AlertCircle :size="16" /> {{ error }}
            <button @click="load">Reintentar</button>
          </div>

          <div v-else-if="!filteredRows.length" class="oc-list-empty">
            <ShoppingCart :size="32" class="opacity-20" />
            <p>Sin órdenes{{ filters.search ? ' para esta búsqueda' : '' }}</p>
            <button v-if="!filters.search && canDo('OrdenCompraCrear', OC_ROLES)" class="oc-btn-primary oc-btn-sm" @click="openCreate">
              <Plus :size="12" /> Crear OC
            </button>
          </div>

          <div v-else class="oc-list-scroll">
            <div
              v-for="row in filteredRows"
              :key="row.id"
              class="oc-card"
              :class="{ selected: selectedOC?.id === row.id }"
              @click="selectOC(row)"
            >
              <div class="oc-card-head">
                <span class="oc-card-id">{{ row.numero || `OC-${row.id}` }}</span>
                <span class="oc-estado-pill" :style="estadoStyle(row.estado)">{{ estadoLabel(row.estado) }}</span>
              </div>

              <p class="oc-card-evento">{{ row.quotation?.description || row.quotation?.empresa || 'Sin evento' }}</p>

              <div class="oc-card-dates">
                <CalendarDays :size="11" />
                <span>{{ fmtDateShort(row.quotation?.operationWindow?.eventStartAt) }}</span>
                <span class="oc-date-sep">·</span>
                <span>{{ fmtDate(row.fechaEmision) }}</span>
              </div>

              <div class="oc-card-proveedor">
                <Building2 :size="11" />
                <span>{{ row.proveedorNombre || '—' }}</span>
              </div>

              <p class="oc-card-desc">{{ row.descripcion }}</p>

              <div class="oc-card-footer">
                <div class="oc-card-qty">
                  <span>{{ row.cantidad }} × {{ fmtMoney(row.precioUnitario) }}</span>
                </div>
                <div class="oc-card-total">
                  <span class="oc-card-total-label">Total OC</span>
                  <span class="oc-card-total-val">{{ fmtMoney(row.precioTotal) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="oc-list-footer">
            <span>{{ filteredRows.length }} de {{ rows.length }} OC</span>
            <button class="oc-btn-ghost oc-btn-xs" @click="load"><RefreshCw :size="12" /></button>
          </div>
        </template>

      </div><!-- /oc-list-panel -->

      <!-- ── Panel derecho: detalle ─────────────────────── -->
      <div class="oc-detail-panel">

        <!-- ── DETALLE DE COTIZACIÓN ─────────────────────── -->
        <template v-if="selectedCot && leftPanelMode === 'cotizaciones'">
          <div class="oc-det-header">
            <div class="oc-det-title-row">
              <div>
                <h2 class="oc-det-title">{{ selectedCot.description || selectedCot.empresa || 'Sin nombre' }}</h2>
                <div class="oc-det-meta">
                  <span class="oc-det-ref">Cotización # {{ selectedCot.numero }}</span>
                  <span class="oc-det-dot" />
                  <CalendarDays :size="12" />
                  <span>{{ fmtDate(selectedCot.operationWindow?.eventStartAt) }}</span>
                  <span v-if="selectedCot.operationWindow?.eventEndAt"> → {{ fmtDate(selectedCot.operationWindow.eventEndAt) }}</span>
                </div>
              </div>
              <span class="oc-estado-pill oc-estado-lg" style="background:#F0FDF4;color:#166534">Aprobada</span>
            </div>

            <button v-if="canDo('OrdenCompraCrear', OC_ROLES)" class="oc-emitir-btn" @click="emitirOC(selectedCot)">
              <Plus :size="16" />
              Emitir Orden de Compra
            </button>
          </div>

          <div class="oc-det-body">
            <div class="oc-det-row-2">
              <div class="oc-det-card">
                <div class="oc-det-card-title"><Users :size="13" /> Cliente</div>
                <div class="oc-det-info-grid">
                  <div class="oc-info-row">
                    <span class="oc-info-label">Nombre</span>
                    <span class="oc-info-val oc-strong">{{ selectedCot.cliente?.name || selectedCot.empresa || selectedCot.contacto || '—' }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Agente comercial</span>
                    <span class="oc-info-val">{{ selectedCot.agenteComercial || '—' }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Fecha cotización</span>
                    <span class="oc-info-val">{{ fmtDate(selectedCot.fechaCotizacion) }}</span>
                  </div>
                </div>
              </div>
              <div class="oc-det-card">
                <div class="oc-det-card-title"><CalendarDays :size="13" /> Evento</div>
                <div class="oc-det-info-grid">
                  <div class="oc-info-row">
                    <span class="oc-info-label">Descripción</span>
                    <span class="oc-info-val">{{ selectedCot.description || '—' }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Fecha inicio</span>
                    <span class="oc-info-val">{{ fmtDate(selectedCot.operationWindow?.eventStartAt) }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Fecha fin</span>
                    <span class="oc-info-val">{{ fmtDate(selectedCot.operationWindow?.eventEndAt) }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Total cotización</span>
                    <span class="oc-info-val oc-strong oc-primary">{{ fmtMoney(selectedCot.total) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- OCs emitidas -->
            <div class="oc-det-section">
              <div class="oc-det-section-header">
                <div class="oc-det-section-title">
                  <ShoppingCart :size="13" /> Órdenes de compra emitidas ({{ ocsByCot(selectedCot).length }})
                </div>
                <button v-if="canDo('OrdenCompraCrear', OC_ROLES)" class="oc-btn-ghost oc-btn-sm" @click="emitirOC(selectedCot)">
                  <Plus :size="12" /> Nueva OC
                </button>
              </div>

              <div v-if="!ocsByCot(selectedCot).length" class="oc-cot-no-ocs">
                <ShoppingCart :size="28" class="opacity-20" />
                <p>No hay órdenes de compra para esta cotización.</p>
                <button v-if="canDo('OrdenCompraCrear', OC_ROLES)" class="oc-emitir-btn-sm" @click="emitirOC(selectedCot)">
                  <Plus :size="14" /> Emitir primera OC
                </button>
              </div>

              <div v-for="oc in ocsByCot(selectedCot)" :key="oc.id" class="oc-linked-card" @click="selectOC(oc); setLeftPanel('ordenes')">
                <div class="oc-linked-head">
                  <span class="oc-card-id">{{ oc.numero }}</span>
                  <span class="oc-estado-pill" :style="estadoStyle(oc.estado)">{{ estadoLabel(oc.estado) }}</span>
                </div>
                <div class="oc-linked-info">
                  <span><Building2 :size="11" /> {{ oc.proveedorNombre || '—' }}</span>
                  <span class="oc-linked-desc">{{ oc.descripcion }}</span>
                  <span class="oc-primary oc-strong">{{ fmtMoney(oc.precioTotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Empty state ──────────────────────────── -->
        <div v-else-if="!selectedOC" class="oc-detail-empty">
          <div class="oc-detail-empty-inner">
            <template v-if="leftPanelMode === 'cotizaciones'">
              <FileText :size="48" class="opacity-10" />
              <h3>Selecciona una cotización</h3>
              <p>Elige una cotización aprobada para ver sus detalles y emitir la orden de compra correspondiente.</p>
            </template>
            <template v-else>
              <ShoppingCart :size="48" class="opacity-10" />
              <h3>Selecciona una orden de compra</h3>
              <p>Haz clic en cualquier OC de la lista para ver el detalle completo.</p>
            </template>
            <button v-if="canDo('OrdenCompraCrear', OC_ROLES)" class="oc-btn-primary" @click="openCreate">
              <Plus :size="14" /> Nueva orden de compra
            </button>
          </div>
        </div>

        <!-- ── DETALLE DE OC ──────────────────────────── -->
        <template v-else>
          <div class="oc-det-header">
            <div class="oc-det-title-row">
              <div>
                <h2 class="oc-det-title">{{ selectedOC.quotation?.description || selectedOC.quotation?.empresa || 'Sin nombre' }}</h2>
                <div class="oc-det-meta">
                  <span class="oc-det-ref">{{ selectedOC.numero }}</span>
                  <span class="oc-det-dot" />
                  <CalendarDays :size="12" />
                  <span>{{ fmtDate(selectedOC.quotation?.operationWindow?.eventStartAt) }}</span>
                  <span class="oc-det-dot" />
                  <span>Emitida {{ fmtDate(selectedOC.fechaEmision) }}</span>
                </div>
              </div>
              <div class="oc-det-header-right">
                <span class="oc-estado-pill oc-estado-lg" :style="estadoStyle(selectedOC.estado)">
                  {{ estadoLabel(selectedOC.estado) }}
                </span>
                <div class="oc-tools-wrap" ref="toolsRef">
                  <button class="oc-tools-btn" @click="toolsOpen = !toolsOpen">
                    <MoreHorizontal :size="16" />
                  </button>
                  <div v-if="toolsOpen" class="oc-tools-menu">
                    <button class="oc-tools-item" @click="exportDetailCSV(); toolsOpen = false">
                      <Download :size="13" /> Exportar detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Acciones de estado -->
            <div class="oc-estado-actions">
              <button
                v-for="action in estadoActions"
                :key="action.next"
                v-show="action.from.includes(selectedOC.estado) && canDo('OrdenCompraCambiarEstado', OC_ROLES)"
                class="oc-estado-action-btn"
                :style="{ background: action.bg, color: action.color, borderColor: action.color }"
                @click="changeEstado(action.next)"
                :disabled="savingEstado"
              >
                <component :is="action.icon" :size="13" />
                {{ action.label }}
              </button>
            </div>
          </div>

          <div class="oc-det-body">

            <!-- Evento + Cotización -->
            <div class="oc-det-row-2">
              <div class="oc-det-card">
                <div class="oc-det-card-title"><CalendarDays :size="13" /> Evento</div>
                <div class="oc-det-info-grid">
                  <div class="oc-info-row">
                    <span class="oc-info-label">Descripción</span>
                    <span class="oc-info-val">{{ selectedOC.quotation?.description || '—' }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Fecha inicio</span>
                    <span class="oc-info-val">{{ fmtDate(selectedOC.quotation?.operationWindow?.eventStartAt) }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Cliente</span>
                    <span class="oc-info-val oc-strong">{{ selectedOC.quotation?.cliente?.name || selectedOC.quotation?.empresa || '—' }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Cotización</span>
                    <span class="oc-info-val oc-link-style"># {{ selectedOC.quotation?.numero }}</span>
                  </div>
                </div>
              </div>

              <div class="oc-det-card">
                <div class="oc-det-card-title"><Building2 :size="13" /> Proveedor</div>
                <div class="oc-det-info-grid">
                  <div class="oc-info-row">
                    <span class="oc-info-label">Razón social</span>
                    <span class="oc-info-val oc-strong">{{ selectedOC.proveedorNombre || '—' }}</span>
                  </div>
                  <div v-if="selectedOC.proveedorContacto" class="oc-info-row">
                    <span class="oc-info-label">Contacto</span>
                    <span class="oc-info-val">{{ selectedOC.proveedorContacto }}</span>
                  </div>
                  <div v-if="selectedOC.proveedorTelefono" class="oc-info-row">
                    <span class="oc-info-label">Teléfono</span>
                    <span class="oc-info-val oc-mono">{{ selectedOC.proveedorTelefono }}</span>
                  </div>
                  <div v-if="selectedOC.proveedorEmail" class="oc-info-row">
                    <span class="oc-info-label">Email</span>
                    <span class="oc-info-val">{{ selectedOC.proveedorEmail }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Descripción del bien/servicio -->
            <div class="oc-det-section">
              <div class="oc-det-section-title"><Package :size="13" /> Bien / Servicio</div>
              <div class="oc-item-detail">
                <div class="oc-item-desc">{{ selectedOC.descripcion }}</div>
                <div class="oc-item-prices">
                  <div class="oc-price-box">
                    <span class="oc-price-label">Cantidad</span>
                    <span class="oc-price-val">{{ selectedOC.cantidad }}</span>
                  </div>
                  <div class="oc-price-sep">×</div>
                  <div class="oc-price-box">
                    <span class="oc-price-label">Precio unitario</span>
                    <span class="oc-price-val">{{ fmtMoney(selectedOC.precioUnitario) }}</span>
                  </div>
                  <div class="oc-price-sep">=</div>
                  <div class="oc-price-box oc-price-total">
                    <span class="oc-price-label">Total OC</span>
                    <span class="oc-price-val oc-price-big">{{ fmtMoney(selectedOC.precioTotal) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Entrega + Condiciones -->
            <div class="oc-det-row-2">
              <div class="oc-det-card">
                <div class="oc-det-card-title"><Truck :size="13" /> Entrega</div>
                <div class="oc-det-info-grid">
                  <div class="oc-info-row">
                    <span class="oc-info-label">Fecha de entrega</span>
                    <span class="oc-info-val">{{ fmtDate(selectedOC.fechaEntrega) }}</span>
                  </div>
                  <div v-if="selectedOC.direccionEntrega" class="oc-info-row">
                    <span class="oc-info-label">Dirección</span>
                    <span class="oc-info-val">{{ selectedOC.direccionEntrega }}</span>
                  </div>
                  <div v-if="selectedOC.responsableRecepcion" class="oc-info-row">
                    <span class="oc-info-label">Responsable recepción</span>
                    <span class="oc-info-val">{{ selectedOC.responsableRecepcion }}</span>
                  </div>
                </div>
              </div>

              <div class="oc-det-card">
                <div class="oc-det-card-title"><CreditCard :size="13" /> Condiciones</div>
                <div class="oc-det-info-grid">
                  <div class="oc-info-row">
                    <span class="oc-info-label">Condiciones de pago</span>
                    <span class="oc-info-val">{{ selectedOC.condicionesPago || '—' }}</span>
                  </div>
                  <div class="oc-info-row">
                    <span class="oc-info-label">Fecha emisión</span>
                    <span class="oc-info-val">{{ fmtDate(selectedOC.fechaEmision) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notas -->
            <div v-if="selectedOC.notas" class="oc-det-section">
              <div class="oc-det-section-title"><MessageSquare :size="13" /> Notas</div>
              <p class="oc-notes-text">{{ selectedOC.notas }}</p>
            </div>

          </div><!-- /oc-det-body -->
        </template>
      </div>
    </div><!-- /oc-split -->

    <!-- ── Apartado: Órdenes Cumplidas ──────────────────── -->
    <div v-if="ocsCumplidas.length" class="oc-cumplidas-section">
      <div class="oc-cumplidas-header">
        <div class="oc-cumplidas-title">
          <CheckCircle2 :size="16" style="color:#27C8D8" />
          Órdenes de Compra Cumplidas
          <span class="oc-cumplidas-count">{{ ocsCumplidas.length }}</span>
        </div>
        <span class="oc-cumplidas-sub">Proveedores que ya realizaron la entrega</span>
      </div>
      <div class="oc-cumplidas-table-wrap">
        <table class="oc-cumplidas-table">
          <thead>
            <tr>
              <th>Número OC</th>
              <th>Proveedor</th>
              <th>Evento</th>
              <th>Cliente</th>
              <th>Descripción</th>
              <th>Total OC</th>
              <th>Fecha recibida</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="oc in ocsCumplidas"
              :key="oc.id"
              class="oc-cumplidas-row"
              @click="selectOC(oc); setLeftPanel('ordenes'); setTab('RECIBIDA')"
            >
              <td class="oc-cumplidas-numero">
                <CheckCircle2 :size="12" style="color:#27C8D8;flex-shrink:0" />
                {{ oc.numero }}
              </td>
              <td class="oc-cumplidas-proveedor">{{ oc.proveedorNombre }}</td>
              <td class="oc-cumplidas-evento">{{ oc.quotation?.description || oc.quotation?.empresa || '—' }}</td>
              <td>{{ oc.quotation?.cliente?.name || oc.quotation?.empresa || '—' }}</td>
              <td class="oc-cumplidas-desc">{{ oc.descripcion }}</td>
              <td class="oc-cumplidas-total">{{ fmtMoney(oc.precioTotal) }}</td>
              <td class="oc-cumplidas-fecha">{{ fmtDate(oc.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Slide-over: Crear OC ───────────────────────── -->
    <Teleport to="body">
      <Transition name="backdrop-fade">
        <div v-if="modal.open" class="oc-backdrop" />
      </Transition>
      <Transition name="slideover">
        <div v-if="modal.open" class="oc-slideover">

          <div class="oc-mo-header">
            <div>
              <h2 class="oc-mo-title">Nueva Orden de Compra</h2>
              <p v-if="modal.oc.quotationId" class="oc-mo-sub">
                Vinculada a cotización # {{ cotizacionesAprobadas.find(c => c.id === modal.oc.quotationId)?.numero || modal.oc.quotationId }}
              </p>
            </div>
            <button class="oc-mo-close" @click="closeModal"><X :size="18" /></button>
          </div>

          <div class="oc-mo-body">

            <!-- Cotización (requerida) -->
            <div class="oc-mo-section">
              <h3 class="oc-mo-sec-title"><FileText :size="13" /> Cotización aprobada <span class="oc-required">*</span></h3>
              <div class="oc-mo-field">
                <label class="oc-mo-label">Selecciona la cotización</label>
                <select
                  v-model.number="modal.oc.quotationId"
                  class="oc-mo-input oc-mo-select"
                  :class="{ 'oc-input-error': formErrors.quotationId }"
                >
                  <option :value="null" disabled>— Selecciona una cotización aprobada —</option>
                  <option
                    v-for="cot in cotizacionesAprobadas"
                    :key="cot.id"
                    :value="cot.id"
                  >
                    # {{ cot.numero }} · {{ cot.description || cot.empresa }} ({{ cot.cliente?.name || '—' }})
                  </option>
                </select>
                <span v-if="formErrors.quotationId" class="oc-field-error">La cotización es requerida</span>
              </div>
            </div>

            <!-- Proveedor -->
            <div class="oc-mo-section">
              <h3 class="oc-mo-sec-title"><Building2 :size="13" /> Proveedor</h3>
              <div class="oc-mo-grid">
                <div class="oc-mo-field oc-mo-field--full">
                  <label class="oc-mo-label">Nombre / Razón social <span class="oc-required">*</span></label>
                  <input
                    v-model="modal.oc.proveedorNombre"
                    class="oc-mo-input"
                    :class="{ 'oc-input-error': formErrors.proveedorNombre }"
                    placeholder="Ej. Decoraciones SAS"
                  />
                  <span v-if="formErrors.proveedorNombre" class="oc-field-error">Nombre del proveedor es requerido</span>
                </div>
                <div class="oc-mo-field">
                  <label class="oc-mo-label">Contacto</label>
                  <input v-model="modal.oc.proveedorContacto" class="oc-mo-input" placeholder="Nombre del contacto" />
                </div>
                <div class="oc-mo-field">
                  <label class="oc-mo-label">Teléfono</label>
                  <input v-model="modal.oc.proveedorTelefono" class="oc-mo-input" placeholder="Ej. 3001234567" />
                </div>
                <div class="oc-mo-field oc-mo-field--full">
                  <label class="oc-mo-label">Email</label>
                  <input v-model="modal.oc.proveedorEmail" class="oc-mo-input" type="email" placeholder="proveedor@ejemplo.com" />
                </div>
              </div>
            </div>

            <!-- Bien / Servicio -->
            <div class="oc-mo-section">
              <h3 class="oc-mo-sec-title"><Package :size="13" /> Bien / Servicio</h3>
              <div class="oc-mo-grid">
                <div class="oc-mo-field oc-mo-field--full">
                  <label class="oc-mo-label">Descripción <span class="oc-required">*</span></label>
                  <textarea
                    v-model="modal.oc.descripcion"
                    class="oc-mo-input oc-mo-textarea"
                    :class="{ 'oc-input-error': formErrors.descripcion }"
                    rows="3"
                    placeholder="Describe el bien o servicio a contratar…"
                  />
                  <span v-if="formErrors.descripcion" class="oc-field-error">La descripción es requerida</span>
                </div>
                <div class="oc-mo-field">
                  <label class="oc-mo-label">Cantidad <span class="oc-required">*</span></label>
                  <input
                    v-model.number="modal.oc.cantidad"
                    type="number"
                    min="0.01"
                    step="any"
                    class="oc-mo-input"
                    :class="{ 'oc-input-error': formErrors.cantidad }"
                    placeholder="1"
                  />
                  <span v-if="formErrors.cantidad" class="oc-field-error">Ingresa la cantidad</span>
                </div>
                <div class="oc-mo-field">
                  <label class="oc-mo-label">Precio unitario <span class="oc-required">*</span></label>
                  <input
                    v-model.number="modal.oc.precioUnitario"
                    type="number"
                    min="0"
                    step="any"
                    class="oc-mo-input"
                    :class="{ 'oc-input-error': formErrors.precioUnitario }"
                    placeholder="0"
                  />
                  <span v-if="formErrors.precioUnitario" class="oc-field-error">Ingresa el precio unitario</span>
                </div>
                <!-- Precio total calculado -->
                <div class="oc-mo-field oc-mo-field--full">
                  <div class="oc-precio-total-display">
                    <span class="oc-precio-total-label">Total OC</span>
                    <span class="oc-precio-total-val">{{ fmtMoney(modalPrecioTotal) }}</span>
                    <span class="oc-precio-formula">= {{ modal.oc.cantidad || 0 }} × {{ fmtMoney(modal.oc.precioUnitario || 0) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Entrega y condiciones -->
            <div class="oc-mo-section">
              <h3 class="oc-mo-sec-title"><Truck :size="13" /> Entrega y condiciones</h3>
              <div class="oc-mo-grid">
                <div class="oc-mo-field">
                  <label class="oc-mo-label">Condiciones de pago</label>
                  <input v-model="modal.oc.condicionesPago" class="oc-mo-input" placeholder="Ej. 50% anticipo, 50% entrega" />
                </div>
                <div class="oc-mo-field">
                  <label class="oc-mo-label">Fecha de entrega</label>
                  <input v-model="modal.oc.fechaEntrega" type="date" class="oc-mo-input" />
                </div>
                <div class="oc-mo-field oc-mo-field--full">
                  <label class="oc-mo-label">Dirección de entrega</label>
                  <input v-model="modal.oc.direccionEntrega" class="oc-mo-input" placeholder="Ej. Calle 123 #45-67, Bogotá" />
                </div>
                <div class="oc-mo-field oc-mo-field--full">
                  <label class="oc-mo-label">Responsable de recepción</label>
                  <input v-model="modal.oc.responsableRecepcion" class="oc-mo-input" placeholder="Nombre de quien recibe" />
                </div>
              </div>
            </div>

            <!-- Notas -->
            <div class="oc-mo-section">
              <h3 class="oc-mo-sec-title"><MessageSquare :size="13" /> Notas</h3>
              <div class="oc-mo-field">
                <label class="oc-mo-label">Observaciones generales</label>
                <textarea
                  v-model="modal.oc.notas"
                  class="oc-mo-input oc-mo-textarea"
                  rows="3"
                  placeholder="Condiciones especiales, referencias, seguimiento…"
                />
              </div>
            </div>

          </div><!-- /oc-mo-body -->

          <div class="oc-mo-footer">
            <button class="oc-btn-ghost" @click="closeModal">Cancelar</button>
            <button class="oc-btn-primary" :disabled="saving" @click="saveOC">
              <span v-if="saving" class="oc-spinner" />
              Crear Orden de Compra
            </button>
          </div>

        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import {
  Download, Plus, Search, AlertCircle, ShoppingCart,
  X, CalendarDays, Building2, CheckCircle2, XCircle,
  MoreHorizontal, RefreshCw, MessageSquare, FileText, Users,
  Package, Truck, CreditCard, Send, BadgeCheck,
} from 'lucide-vue-next'
import { getOrdenesCompra, createOrdenCompra, updateEstadoOC } from '@/services/admin-ordenes-compra.service.js'
import { getAdminCotizaciones } from '@/services/administracion.service.js'
import { useActionAccess } from '@/composables/useActionAccess'

const { canDo } = useActionAccess()
const OC_ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'COORDINADOR', 'EJECUTIVO', 'EJECUTIVO_CUENTA', 'LOGISTICO', 'LIDER', 'DIRECCION', 'OPERATIVO']

// ── ESTADOS (backend enum: EMITIDA | APROBADA | RECIBIDA | CANCELADA) ────────
const ESTADOS_OC = [
  { value: 'EMITIDA',   label: 'Emitida',   bg: '#FEFCE8', color: '#854D0E' },
  { value: 'APROBADA',  label: 'Aprobada',  bg: '#F0FDF4', color: '#166534' },
  { value: 'RECIBIDA',  label: 'Recibida',  bg: '#E0F9FA', color: '#27C8D8' },
  { value: 'CANCELADA', label: 'Cancelada', bg: '#FEF2F2', color: '#991B1B' },
]

function estadoStyle(val) {
  const e = ESTADOS_OC.find(x => x.value === val) || ESTADOS_OC[0]
  return { background: e.bg, color: e.color }
}
function estadoLabel(val) {
  return ESTADOS_OC.find(x => x.value === val)?.label || val || 'Emitida'
}

// Flujo de estado: EMITIDA → APROBADA → RECIBIDA | CANCELADA
const estadoActions = [
  { next: 'APROBADA',  label: 'Aprobar OC',     from: ['EMITIDA'],             bg: '#F0FDF4', color: '#166534', icon: BadgeCheck },
  { next: 'RECIBIDA',  label: 'Marcar recibida', from: ['APROBADA'],            bg: '#E0F9FA', color: '#27C8D8', icon: CheckCircle2 },
  { next: 'CANCELADA', label: 'Cancelar',        from: ['EMITIDA', 'APROBADA'], bg: '#FEF2F2', color: '#991B1B', icon: XCircle },
]

// ── HELPERS ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}
function fmtMoney(n) { return (!n && n !== 0) ? '—' : formatCOP(n) }

// ── STATE ─────────────────────────────────────────────────
const loading      = ref(false)
const error        = ref(null)
const rows         = ref([])
const saving       = ref(false)
const savingEstado = ref(false)
const toolsOpen    = ref(false)
const toolsRef     = ref(null)
const activeTab    = ref('TODAS')
const selectedOC   = ref(null)

const leftPanelMode         = ref('cotizaciones')
const cotizacionesAprobadas = ref([])
const loadingCots           = ref(false)
const selectedCot           = ref(null)
const cotFilter             = ref('pendiente')

const filters  = ref({ search: '' })
const formErrors = ref({})
const modal    = ref({ open: false, oc: {} })

// ── CUMPLIDAS ─────────────────────────────────────────────
const ocsCumplidas = computed(() => rows.value.filter(r => r.estado === 'RECIBIDA'))

// ── FILTERED LIST ─────────────────────────────────────────
const filteredRows = computed(() => {
  let list = rows.value
  if (activeTab.value !== 'TODAS') {
    list = list.filter(r => r.estado === activeTab.value)
  }
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    list = list.filter(r =>
      (r.quotation?.description || '').toLowerCase().includes(q) ||
      (r.quotation?.empresa || '').toLowerCase().includes(q) ||
      (r.proveedorNombre || '').toLowerCase().includes(q) ||
      (r.numero || '').toLowerCase().includes(q) ||
      (r.descripcion || '').toLowerCase().includes(q)
    )
  }
  return list
})

// Matching por quotationId (campo int en ambos modelos)
function ocsByCot(cot) {
  return rows.value.filter(r => r.quotationId === cot.id)
}

const cotizacionesSinOC = computed(() =>
  cotizacionesAprobadas.value.filter(c => ocsByCot(c).length === 0)
)

const filteredCots = computed(() => {
  let list = cotFilter.value === 'pendiente'
    ? cotizacionesSinOC.value
    : cotizacionesAprobadas.value
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    list = list.filter(c =>
      (c.description || '').toLowerCase().includes(q) ||
      (c.empresa || '').toLowerCase().includes(q) ||
      (c.cliente?.name || '').toLowerCase().includes(q) ||
      String(c.numero || '').includes(q)
    )
  }
  return list
})

// ── TABS ──────────────────────────────────────────────────
const listTabs = computed(() => {
  const count = (estado) => rows.value.filter(r => r.estado === estado).length
  return [
    { key: 'TODAS',    label: 'Todas',    count: rows.value.length, badgeStyle: { background: '#F1F5F9', color: '#64748B' } },
    { key: 'EMITIDA',  label: 'Emitidas', count: count('EMITIDA'),  badgeStyle: { background: '#FEFCE8', color: '#854D0E' } },
    { key: 'APROBADA', label: 'Aprobadas',count: count('APROBADA'), badgeStyle: { background: '#F0FDF4', color: '#166534' } },
    { key: 'RECIBIDA', label: 'Recibidas',count: count('RECIBIDA'), badgeStyle: { background: '#E0F9FA', color: '#27C8D8' } },
    { key: 'CANCELADA',label: 'Canceladas',count:count('CANCELADA'),badgeStyle: { background: '#FEF2F2', color: '#991B1B' } },
  ]
})

function setTab(key) {
  activeTab.value = key
  selectedOC.value = null
}

// ── KPI CARDS ─────────────────────────────────────────────
const kpiCards = computed(() => {
  const totalVal   = rows.value.reduce((s, r) => s + (r.precioTotal || 0), 0)
  const emitidas   = rows.value.filter(r => r.estado === 'EMITIDA').length
  const aprobadas  = rows.value.filter(r => r.estado === 'APROBADA').length
  const recibidas  = rows.value.filter(r => r.estado === 'RECIBIDA').length
  return [
    { key: 'TODAS',    label: 'Total OCs',    value: rows.value.length, color: '#0F172A', icon: ShoppingCart, sub: null },
    { key: 'EMITIDA',  label: 'Emitidas',     value: emitidas,          color: '#854D0E', icon: Send,         sub: null },
    { key: 'APROBADA', label: 'Aprobadas',    value: aprobadas,         color: '#166534', icon: BadgeCheck,   sub: null },
    { key: 'RECIBIDA', label: 'Recibidas',    value: recibidas,         color: '#27C8D8', icon: CheckCircle2, sub: null },
    { key: 'total',    label: 'Valor total',  value: fmtMoney(totalVal),color: '#27C8D8', icon: Package,      sub: null },
  ]
})

// ── MODAL COMPUTED ────────────────────────────────────────
const modalPrecioTotal = computed(() =>
  (modal.value.oc.cantidad || 0) * (modal.value.oc.precioUnitario || 0)
)

// ── LOAD ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value   = null
  try {
    const res  = await getOrdenesCompra()
    rows.value = res.data ?? []
    if (selectedOC.value) {
      const fresh = rows.value.find(r => r.id === selectedOC.value.id)
      if (fresh) selectedOC.value = JSON.parse(JSON.stringify(fresh))
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando órdenes de compra'
  } finally {
    loading.value = false
  }
}

async function loadCotizaciones() {
  loadingCots.value = true
  try {
    const res = await getAdminCotizaciones({ limit: 500 })
    cotizacionesAprobadas.value = (res.data || []).filter(
      c => c.quotationStatus?.name === 'Aprobada'
    )
  } catch (e) {
    console.error('Error cargando cotizaciones aprobadas', e)
  } finally {
    loadingCots.value = false
  }
}

function setLeftPanel(mode) {
  leftPanelMode.value = mode
  selectedCot.value   = null
  selectedOC.value    = null
}

function selectCot(cot) {
  selectedCot.value = cot
  selectedOC.value  = null
}

function emitirOC(cot) {
  modal.value = {
    open: true,
    oc: {
      quotationId:         cot.id,
      proveedorNombre:     '',
      proveedorContacto:   '',
      proveedorTelefono:   '',
      proveedorEmail:      '',
      descripcion:         cot.description || '',
      cantidad:            1,
      precioUnitario:      null,
      condicionesPago:     '',
      fechaEntrega:        '',
      direccionEntrega:    '',
      responsableRecepcion:'',
      notas:               '',
    },
  }
  formErrors.value = {}
}

onMounted(() => {
  load()
  loadCotizaciones()
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function onClickOutside(e) {
  if (toolsRef.value && !toolsRef.value.contains(e.target)) toolsOpen.value = false
}

// ── SELECT ────────────────────────────────────────────────
function selectOC(row) {
  selectedOC.value  = JSON.parse(JSON.stringify(row))
  selectedCot.value = null
}

// ── MODAL ─────────────────────────────────────────────────
function openCreate() {
  const prefillCot = selectedCot.value
  modal.value = {
    open: true,
    oc: {
      quotationId:          prefillCot?.id ?? null,
      proveedorNombre:      '',
      proveedorContacto:    '',
      proveedorTelefono:    '',
      proveedorEmail:       '',
      descripcion:          prefillCot?.description || '',
      cantidad:             1,
      precioUnitario:       null,
      condicionesPago:      '',
      fechaEntrega:         '',
      direccionEntrega:     '',
      responsableRecepcion: '',
      notas:                '',
    },
  }
  formErrors.value = {}
  // Aseguramos que cotizaciones estén cargadas
  if (!cotizacionesAprobadas.value.length) loadCotizaciones()
}

function closeModal() { modal.value.open = false }

function validateForm() {
  const errs = {}
  if (!modal.value.oc.quotationId) errs.quotationId = true
  if (!modal.value.oc.proveedorNombre?.trim()) errs.proveedorNombre = true
  if (!modal.value.oc.descripcion?.trim()) errs.descripcion = true
  if (!modal.value.oc.cantidad || modal.value.oc.cantidad <= 0) errs.cantidad = true
  if (modal.value.oc.precioUnitario === null || modal.value.oc.precioUnitario === undefined || modal.value.oc.precioUnitario < 0) errs.precioUnitario = true
  formErrors.value = errs
  return Object.keys(errs).length === 0
}

// ── SAVE ──────────────────────────────────────────────────
async function saveOC() {
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = {
      quotationId:          modal.value.oc.quotationId,
      proveedorNombre:      modal.value.oc.proveedorNombre,
      proveedorContacto:    modal.value.oc.proveedorContacto || undefined,
      proveedorTelefono:    modal.value.oc.proveedorTelefono || undefined,
      proveedorEmail:       modal.value.oc.proveedorEmail    || undefined,
      descripcion:          modal.value.oc.descripcion,
      cantidad:             modal.value.oc.cantidad,
      precioUnitario:       modal.value.oc.precioUnitario,
      condicionesPago:      modal.value.oc.condicionesPago      || undefined,
      fechaEntrega:         modal.value.oc.fechaEntrega          || undefined,
      direccionEntrega:     modal.value.oc.direccionEntrega      || undefined,
      responsableRecepcion: modal.value.oc.responsableRecepcion  || undefined,
      notas:                modal.value.oc.notas                 || undefined,
    }
    const res = await createOrdenCompra(payload)
    const created = res.data || res
    rows.value.unshift(created)
    selectedOC.value  = JSON.parse(JSON.stringify(created))
    selectedCot.value = null
    leftPanelMode.value = 'ordenes'
    closeModal()
  } catch (e) {
    alert(e?.response?.data?.message || 'Error creando la orden de compra')
  } finally {
    saving.value = false
  }
}

// ── ESTADO ────────────────────────────────────────────────
async function changeEstado(next) {
  savingEstado.value = true
  const prev = selectedOC.value.estado
  selectedOC.value.estado = next
  try {
    await updateEstadoOC(selectedOC.value.id, next)
    const idx = rows.value.findIndex(r => r.id === selectedOC.value.id)
    if (idx >= 0) rows.value[idx].estado = next
  } catch {
    selectedOC.value.estado = prev
  } finally {
    savingEstado.value = false
  }
}

// ── CSV ───────────────────────────────────────────────────
function exportCSV() {
  const headers = ['Número OC', 'Cotización', 'Evento', 'Cliente', 'Proveedor', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total OC', 'Estado', 'Fecha Emisión']
  const csvRows = rows.value.map(r => [
    r.numero,
    r.quotation?.numero || '',
    r.quotation?.description || '',
    r.quotation?.cliente?.name || '',
    r.proveedorNombre || '',
    r.descripcion || '',
    r.cantidad || 0,
    r.precioUnitario || 0,
    r.precioTotal || 0,
    estadoLabel(r.estado),
    fmtDate(r.fechaEmision),
  ])
  const csv = [headers, ...csvRows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `ordenes-compra-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportDetailCSV() {
  if (!selectedOC.value) return
  const oc = selectedOC.value
  const rows = [
    ['Número OC', oc.numero],
    ['Cotización', oc.quotation?.numero],
    ['Evento', oc.quotation?.description],
    ['Cliente', oc.quotation?.cliente?.name],
    ['Proveedor', oc.proveedorNombre],
    ['Contacto proveedor', oc.proveedorContacto],
    ['Teléfono', oc.proveedorTelefono],
    ['Email', oc.proveedorEmail],
    ['Descripción', oc.descripcion],
    ['Cantidad', oc.cantidad],
    ['Precio unitario', oc.precioUnitario],
    ['Total OC', oc.precioTotal],
    ['Condiciones de pago', oc.condicionesPago],
    ['Fecha entrega', fmtDate(oc.fechaEntrega)],
    ['Dirección entrega', oc.direccionEntrega],
    ['Responsable recepción', oc.responsableRecepcion],
    ['Estado', estadoLabel(oc.estado)],
    ['Fecha emisión', fmtDate(oc.fechaEmision)],
    ['Notas', oc.notas],
  ]
  const csv = rows.map(([k, v]) => `"${k}","${v ?? ''}"`).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `oc-${oc.numero}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* ── Page ────────────────────────────────────────────── */
.oc-page {
  padding: 20px 24px;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 60px);
}

/* ── Header ──────────────────────────────────────────── */
.oc-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.oc-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px; font-weight: 700; color: #0F172A; margin: 0;
}
.oc-subtitle { font-size: 13px; color: #64748B; margin: 2px 0 0; }
.oc-header-actions { display: flex; gap: 8px; align-items: center; }

/* ── Buttons ─────────────────────────────────────────── */
.oc-btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: #27C8D8; color: #fff;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: background 0.15s;
}
.oc-btn-primary:hover:not(:disabled) { background: #1BAEBB; }
.oc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.oc-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; background: #F8FAFC; border: 1.5px solid #E2E8F0;
  border-radius: 10px; font-size: 13px; font-weight: 500; color: #374151;
  cursor: pointer; transition: all 0.15s;
}
.oc-btn-ghost:hover:not(:disabled) { background: #F1F5F9; border-color: #CBD5E1; }
.oc-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.oc-btn-sm { padding: 5px 10px; font-size: 12px; border-radius: 7px; }
.oc-btn-xs { padding: 4px 6px; font-size: 11px; border-radius: 6px; }

/* ── KPI cards ───────────────────────────────────────── */
.oc-kpi-row { display: flex; gap: 12px; flex-wrap: wrap; }
.oc-kpi {
  flex: 1; min-width: 160px;
  background: #fff; border: 1.5px solid #E2E8F0;
  border-radius: 14px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 4px;
  cursor: pointer; transition: all 0.15s;
}
.oc-kpi:hover { border-color: #A7EEF5; box-shadow: 0 2px 8px rgba(39,200,216,.08); }
.oc-kpi.active { border-color: #27C8D8; background: #F0F7FF; }
.oc-kpi-top { display: flex; align-items: center; gap: 6px; }
.oc-kpi-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; }
.oc-kpi-value { font-size: 20px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
.oc-kpi-sub { font-size: 11px; color: #EF4444; font-weight: 500; }

/* ── Split layout ────────────────────────────────────── */
.oc-split {
  display: flex;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 20px rgba(39,200,216,.08);
  overflow: hidden;
  flex: 1;
  min-height: 560px;
}

/* ── List panel ──────────────────────────────────────── */
.oc-list-panel {
  width: 380px;
  flex-shrink: 0;
  border-right: 1.5px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  background: #FAFBFC;
}

.oc-panel-switcher {
  display: flex;
  border-bottom: 1.5px solid #E2E8F0;
  background: #fff;
}
.oc-panel-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 10px 8px;
  border: none; background: none;
  font-size: 12px; font-weight: 500; color: #64748B;
  cursor: pointer; transition: all 0.15s;
  border-bottom: 2px solid transparent; margin-bottom: -1.5px;
}
.oc-panel-btn:hover { color: #374151; background: #F8FAFC; }
.oc-panel-btn.active { color: #27C8D8; border-bottom-color: #27C8D8; background: #F0F7FF; font-weight: 600; }
.oc-panel-count {
  font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 10px;
  background: #F1F5F9; color: #64748B;
}
.oc-panel-count-alert { background: #FEFCE8; color: #854D0E; }

.oc-list-toolbar {
  padding: 12px 12px 0;
  display: flex; gap: 6px;
}
.oc-search-wrap { position: relative; flex: 1; }
.oc-search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
.oc-search-input {
  width: 100%; height: 34px; padding: 0 10px 0 30px;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  font-size: 12px; font-family: 'Inter', sans-serif;
  background: #fff; outline: none; box-sizing: border-box;
  transition: border-color 0.15s;
}
.oc-search-input:focus { border-color: #27C8D8; }

.oc-list-tabs {
  display: flex;
  padding: 8px 12px 0;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}
.oc-list-tabs::-webkit-scrollbar { display: none; }
.oc-list-tab {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 8px; border: none; background: none;
  font-size: 11px; font-weight: 500; color: #94A3B8;
  cursor: pointer; border-radius: 6px; white-space: nowrap;
  transition: all 0.12s;
}
.oc-list-tab:hover { background: #F1F5F9; color: #374151; }
.oc-list-tab.active { background: #E0F9FA; color: #27C8D8; font-weight: 600; }
.oc-tab-badge {
  font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 4px;
}

.oc-list-scroll { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.oc-card-sk {
  height: 110px; border-radius: 10px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 400% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }

.oc-list-error {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 24px; color: #DC2626; font-size: 13px; text-align: center;
}
.oc-list-error button { padding: 4px 12px; border: 1px solid currentColor; border-radius: 6px; background: none; color: inherit; cursor: pointer; font-size: 12px; }

.oc-list-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 16px; color: #94A3B8; font-size: 13px;
}

/* ── OC Card ─────────────────────────────────────────── */
.oc-card {
  background: #fff; border: 1.5px solid #E2E8F0;
  border-radius: 12px; padding: 12px;
  cursor: pointer; transition: all 0.15s;
  display: flex; flex-direction: column; gap: 5px;
}
.oc-card:hover { border-color: #A7EEF5; box-shadow: 0 2px 8px rgba(39,200,216,.07); }
.oc-card.selected { border-color: #27C8D8; background: #F0F7FF; box-shadow: 0 2px 12px rgba(39,200,216,.12); }

.oc-card-head { display: flex; align-items: center; justify-content: space-between; }
.oc-card-id { font-size: 12px; font-weight: 700; color: #27C8D8; }
.oc-estado-pill {
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 5px; white-space: nowrap;
}
.oc-estado-lg { font-size: 12px; padding: 3px 10px; }
.oc-card-evento { font-size: 13px; font-weight: 600; color: #0F172A; margin: 0; line-height: 1.3; }
.oc-card-dates, .oc-card-proveedor {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #64748B;
}
.oc-date-sep { color: #CBD5E1; }
.oc-card-desc { font-size: 12px; color: #64748B; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oc-card-footer { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 2px; }
.oc-card-qty { font-size: 11px; color: #94A3B8; }
.oc-card-total { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.oc-card-total-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.3px; }
.oc-card-total-val { font-size: 14px; font-weight: 700; color: #27C8D8; font-family: 'Plus Jakarta Sans', sans-serif; }

.oc-list-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-top: 1px solid #E2E8F0;
  font-size: 11px; color: #94A3B8;
}

/* Cotización card extras */
.oc-cot-card.has-oc { border-left: 3px solid #22C55E; }
.oc-cot-badges { display: flex; align-items: center; gap: 5px; }
.oc-cot-has-oc {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 600; color: #166534;
  background: #F0FDF4; padding: 1px 6px; border-radius: 4px;
}
.oc-cot-agente { font-size: 11px; color: #94A3B8; }

.oc-emitir-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 12px 20px;
  background: linear-gradient(135deg, #27C8D8 0%, #138E9C 100%);
  color: #fff; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(39,200,216,.3);
  margin-top: 12px; justify-content: center;
}
.oc-emitir-btn:hover { filter: brightness(1.08); box-shadow: 0 6px 20px rgba(39,200,216,.4); transform: translateY(-1px); }

.oc-emitir-btn-sm {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px; background: #27C8D8; color: #fff;
  border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.oc-emitir-btn-sm:hover { background: #1BAEBB; }

.oc-cot-no-ocs {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 28px; color: #94A3B8; font-size: 13px; text-align: center;
}

.oc-linked-card {
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  padding: 10px 14px; margin-bottom: 8px;
  cursor: pointer; transition: all 0.15s;
  display: flex; flex-direction: column; gap: 6px;
}
.oc-linked-card:hover { border-color: #A7EEF5; background: #F0F7FF; }
.oc-linked-head { display: flex; align-items: center; justify-content: space-between; }
.oc-linked-info { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #64748B; flex-wrap: wrap; }
.oc-linked-desc { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Detail panel ────────────────────────────────────── */
.oc-detail-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.oc-detail-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
}
.oc-detail-empty-inner {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; color: #94A3B8; text-align: center; padding: 40px;
}
.oc-detail-empty-inner h3 { font-size: 16px; font-weight: 600; color: #374151; margin: 0; }
.oc-detail-empty-inner p { font-size: 13px; max-width: 280px; line-height: 1.5; margin: 0; }

.oc-det-header {
  padding: 20px 24px 14px;
  border-bottom: 1.5px solid #E2E8F0;
  background: #fff;
  flex-shrink: 0;
}
.oc-det-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.oc-det-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px; font-weight: 700; color: #0F172A; margin: 0;
}
.oc-det-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748B; margin-top: 4px; flex-wrap: wrap; }
.oc-det-ref { font-weight: 500; color: #374151; }
.oc-det-dot { width: 3px; height: 3px; background: #CBD5E1; border-radius: 50%; }
.oc-det-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.oc-tools-wrap { position: relative; }
.oc-tools-btn {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  background: #fff; color: #64748B; cursor: pointer;
  transition: all 0.15s;
}
.oc-tools-btn:hover { border-color: #CBD5E1; color: #374151; }
.oc-tools-menu {
  position: absolute; top: calc(100% + 4px); right: 0;
  z-index: 100; background: #fff;
  border: 1.5px solid #E2E8F0; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(39,200,216,.12);
  min-width: 180px; padding: 4px;
}
.oc-tools-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 10px;
  border: none; background: none;
  font-size: 13px; color: #374151;
  cursor: pointer; border-radius: 8px;
  transition: background 0.1s; text-align: left;
}
.oc-tools-item:hover { background: #F8FAFC; }

.oc-estado-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.oc-estado-action-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  border: 1.5px solid currentColor;
  border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: filter 0.15s;
}
.oc-estado-action-btn:hover:not(:disabled) { filter: brightness(0.94); }
.oc-estado-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.oc-det-body { flex: 1; overflow-y: auto; padding: 0; }

.oc-det-row-2 {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 0; border-bottom: 1px solid #F1F5F9;
}
.oc-det-card { padding: 20px 24px; }
.oc-det-card:first-child { border-right: 1px solid #F1F5F9; }
.oc-det-card-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.4px;
  margin-bottom: 12px;
}
.oc-det-info-grid { display: flex; flex-direction: column; gap: 8px; }
.oc-info-row { display: flex; flex-direction: column; gap: 2px; }
.oc-info-label { font-size: 10px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.3px; }
.oc-info-val { font-size: 13px; color: #0F172A; }
.oc-link-style { color: #27C8D8; font-weight: 500; }
.oc-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; }
.oc-notes-text { font-size: 13px; color: #374151; line-height: 1.6; margin: 0; }

.oc-det-section {
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;
}
.oc-det-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.oc-det-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 14px;
}
.oc-det-section-header .oc-det-section-title { margin-bottom: 0; }

/* Item detail */
.oc-item-detail {
  display: flex; flex-direction: column; gap: 12px;
}
.oc-item-desc {
  font-size: 14px; color: #374151; line-height: 1.6;
  background: #F8FAFC; border: 1.5px solid #E2E8F0;
  border-radius: 10px; padding: 12px 16px;
}
.oc-item-prices {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap;
}
.oc-price-box {
  display: flex; flex-direction: column; gap: 3px;
  background: #F8FAFC; border: 1.5px solid #E2E8F0;
  border-radius: 10px; padding: 10px 16px;
}
.oc-price-total {
  background: #E0F9FA; border-color: #A7EEF5;
}
.oc-price-label { font-size: 10px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.3px; }
.oc-price-val { font-size: 15px; font-weight: 600; color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif; }
.oc-price-big { font-size: 18px; color: #27C8D8; }
.oc-price-sep { font-size: 20px; color: #CBD5E1; font-weight: 300; }

/* ── Slide-over modal ────────────────────────────────── */
.oc-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.4);
  z-index: 400; backdrop-filter: blur(2px);
}
.backdrop-fade-enter-active, .backdrop-fade-leave-active { transition: opacity 0.2s; }
.backdrop-fade-enter-from, .backdrop-fade-leave-to { opacity: 0; }

.oc-slideover {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(640px, 100vw); background: #fff;
  z-index: 500; display: flex; flex-direction: column;
  box-shadow: -8px 0 32px rgba(39,200,216,.12);
}
.slideover-enter-active, .slideover-leave-active { transition: transform 0.28s cubic-bezier(.4,0,.2,1); }
.slideover-enter-from, .slideover-leave-to { transform: translateX(100%); }

.oc-mo-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1.5px solid #E2E8F0; flex-shrink: 0;
}
.oc-mo-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #0F172A; margin: 0; }
.oc-mo-sub { font-size: 13px; color: #64748B; margin: 2px 0 0; }
.oc-mo-close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: 1.5px solid #E2E8F0; border-radius: 8px;
  background: #fff; color: #64748B; cursor: pointer; transition: all 0.15s;
}
.oc-mo-close:hover { border-color: #DC2626; color: #DC2626; }

.oc-mo-body { flex: 1; overflow-y: auto; }
.oc-mo-section { padding: 20px 24px; border-bottom: 1px solid #F1F5F9; }
.oc-mo-sec-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.4px; margin: 0 0 14px;
}
.oc-mo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.oc-mo-field { display: flex; flex-direction: column; gap: 4px; }
.oc-mo-field--full { grid-column: 1 / -1; }
.oc-mo-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; }
.oc-mo-input {
  height: 36px; padding: 0 10px;
  border: 1.5px solid #E2E8F0; border-radius: 8px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #0F172A;
  background: #fff; outline: none; transition: border-color 0.15s; box-sizing: border-box; width: 100%;
}
.oc-mo-input:focus { border-color: #27C8D8; }
.oc-mo-textarea { height: auto; padding: 8px 10px; resize: vertical; line-height: 1.5; }
.oc-mo-select { cursor: pointer; }

.oc-input-error { border-color: #EF4444 !important; }
.oc-field-error { font-size: 11px; color: #EF4444; }
.oc-required { color: #EF4444; }

/* Precio total display */
.oc-precio-total-display {
  display: flex; align-items: center; gap: 12px;
  background: #E0F9FA; border: 1.5px solid #A7EEF5;
  border-radius: 10px; padding: 12px 16px;
}
.oc-precio-total-label { font-size: 11px; font-weight: 600; color: #27C8D8; text-transform: uppercase; letter-spacing: 0.3px; }
.oc-precio-total-val { font-size: 20px; font-weight: 700; color: #27C8D8; font-family: 'Plus Jakarta Sans', sans-serif; }
.oc-precio-formula { font-size: 12px; color: #8EEAF3; margin-left: auto; }

.oc-mo-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 16px 24px; border-top: 1.5px solid #E2E8F0;
  flex-shrink: 0; background: #FAFBFC;
}

/* ── Shared utils ────────────────────────────────────── */
.oc-strong { font-weight: 700 !important; }
.oc-primary { color: #27C8D8 !important; font-weight: 700 !important; }
.oc-spinner {
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg) } }

/* ── Apartado Cumplidas ───────────────────────────────── */
.oc-cumplidas-section {
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #A7EEF5;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08);
  overflow: hidden;
}

.oc-cumplidas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #E0F9FA 0%, #F0FAFB 100%);
  border-bottom: 1.5px solid #A7EEF5;
}
.oc-cumplidas-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #0F1A2E;
}
.oc-cumplidas-count {
  background: #27C8D8;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 20px;
}
.oc-cumplidas-sub {
  font-size: 12px;
  color: #64748B;
}

.oc-cumplidas-table-wrap { overflow-x: auto; }
.oc-cumplidas-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.oc-cumplidas-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 1.5px solid #E5EAF0;
  background: #F8FAFC;
  white-space: nowrap;
}
.oc-cumplidas-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #F1F5FA;
  color: #374151;
  vertical-align: middle;
}
.oc-cumplidas-row {
  cursor: pointer;
  transition: background .12s;
}
.oc-cumplidas-row:hover td { background: #F0FAFB; }
.oc-cumplidas-row:last-child td { border-bottom: none; }
.oc-cumplidas-numero {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #27C8D8;
  white-space: nowrap;
}
.oc-cumplidas-proveedor { font-weight: 600; color: #0F1A2E; }
.oc-cumplidas-evento { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.oc-cumplidas-desc { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748B; }
.oc-cumplidas-total { font-weight: 700; color: #0F1A2E; white-space: nowrap; }
.oc-cumplidas-fecha { color: #27C8D8; font-weight: 600; white-space: nowrap; }
</style>
