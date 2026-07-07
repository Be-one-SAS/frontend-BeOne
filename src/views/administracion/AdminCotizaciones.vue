<template>
  <div class="adm-page">

    <!-- ── Header ───────────────────────────────────────── -->
    <div class="adm-header">
      <div>
        <h1 class="adm-title">Eventos</h1>
        <p class="adm-subtitle">Gestión financiera y administrativa</p>
      </div>
      <button class="adm-btn-export" @click="exportCSV" :disabled="!rows.length">
        <Download :size="15" /> Exportar CSV
      </button>
    </div>

    <!-- ── Filtros ──────────────────────────────────────── -->
    <div class="adm-filters">
      <div class="adm-filter-search">
        <Search :size="14" class="adm-search-icon" />
        <input v-model="filters.search" class="adm-input" placeholder="Buscar nº, cliente, descripción…" @input="onFilter" />
      </div>

      <!-- Estado admin multi-select -->
      <div class="adm-filter-estados" ref="estadosRef">
        <button class="adm-input adm-estado-trigger" @click="estadosOpen = !estadosOpen">
          <span v-if="!filters.estados.length" class="adm-placeholder">Estado administrativo</span>
          <span v-else class="adm-estado-pills">
            <span v-for="e in filters.estados.slice(0,3)" :key="e" class="adm-mini-badge"
              :style="{ background: estadoStyle(e).bg, color: estadoStyle(e).color }">{{ e }}</span>
            <span v-if="filters.estados.length > 3" class="adm-mini-badge adm-mini-more">+{{ filters.estados.length - 3 }}</span>
          </span>
          <ChevronDown :size="13" />
        </button>
        <div v-if="estadosOpen" class="adm-estado-dropdown">
          <div v-for="e in ESTADOS_ADMIN" :key="e" class="adm-estado-opt"
            :class="{ selected: filters.estados.includes(e) }" @click="toggleEstado(e)">
            <span class="adm-estado-check">
              <Check v-if="filters.estados.includes(e)" :size="12" />
            </span>
            <span class="adm-estado-badge" :style="{ background: estadoStyle(e).bg, color: estadoStyle(e).color }">{{ e }}</span>
          </div>
          <button v-if="filters.estados.length" class="adm-clear-btn" @click="filters.estados = []; onFilter()">Limpiar</button>
        </div>
      </div>

      <!-- Estado cotización multi-select -->
      <div class="adm-filter-estados" ref="cotStatusRef">
        <button class="adm-input adm-estado-trigger" @click="cotStatusOpen = !cotStatusOpen">
          <span v-if="!filters.estadoCot.length" class="adm-placeholder">Estado cotización</span>
          <span v-else class="adm-estado-pills">
            <span v-for="e in filters.estadoCot.slice(0,3)" :key="e" class="adm-mini-badge"
              :class="cotStatusCls(e)">{{ e }}</span>
            <span v-if="filters.estadoCot.length > 3" class="adm-mini-badge adm-mini-more">+{{ filters.estadoCot.length - 3 }}</span>
          </span>
          <ChevronDown :size="13" />
        </button>
        <div v-if="cotStatusOpen" class="adm-estado-dropdown">
          <div v-for="e in ['Pendiente', 'Aprobada', 'Rechazada', 'Vencida']" :key="e" class="adm-estado-opt"
            :class="{ selected: filters.estadoCot.includes(e) }" @click="toggleCotStatus(e)">
            <span class="adm-estado-check">
              <Check v-if="filters.estadoCot.includes(e)" :size="12" />
            </span>
            <span class="adm-estado-badge" :class="cotStatusCls(e)">{{ e }}</span>
          </div>
          <button v-if="filters.estadoCot.length" class="adm-clear-btn" @click="filters.estadoCot = []; onFilter()">Limpiar</button>
        </div>
      </div>

      <!-- VAL ADM filter -->
      <select v-model="filters.valAdm" class="adm-input" @change="onFilter" style="width:140px">
        <option value="">VAL ADM: Todos</option>
        <option value="si">Validados</option>
        <option value="no">Sin validar</option>
      </select>

      <input v-model="filters.fechaInicio" type="date" class="adm-input" @change="onFilter" />
      <input v-model="filters.fechaFin"    type="date" class="adm-input" @change="onFilter" />
      <input v-model="filters.responsable" class="adm-input" placeholder="Responsable / ejecutivo" @input="onFilter" />
    </div>

    <!-- ── Tabla ────────────────────────────────────────── -->
    <div class="adm-table-wrap">

      <div v-if="loading" class="adm-skeleton">
        <div v-for="i in 8" :key="i" class="adm-sk-row" />
      </div>

      <div v-else-if="error" class="adm-error">
        <AlertCircle :size="18" /> {{ error }}
        <button @click="load">Reintentar</button>
      </div>

      <div v-else-if="!rows.length" class="adm-empty">
        <FileX :size="36" class="opacity-30" />
        <p>No hay eventos con los filtros actuales</p>
      </div>

      <div v-else class="adm-scroll">
        <table class="adm-table">
          <thead>
            <tr>
              <th class="adm-th sortable" @click="sort('numero')">#</th>
              <th class="adm-th sortable" @click="sort('fechaCotizacion')">Fecha cot.</th>
              <th class="adm-th">Evento</th>
              <th class="adm-th">Región</th>
              <th class="adm-th">Fecha evento</th>
              <th class="adm-th sortable" @click="sort('empresa')">Cliente</th>
              <th class="adm-th sortable" @click="sort('total')">Total</th>
              <th class="adm-th">Estado cot.</th>
              <th class="adm-th sortable" @click="sort('estadoAdministrativo')">Estado admin.</th>
              <th class="adm-th">VAL ADM</th>
              <th class="adm-th">% Ejec.</th>
              <th class="adm-th sortable" @click="sort('agenteComercial')">Comercial</th>
              <th class="adm-th"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.id">
              <tr class="adm-tr" :class="{ 'adm-tr-expanded': expandedId === row.id }">
                <td class="adm-td adm-num">#{{ row.numero }}</td>
                <td class="adm-td adm-date">{{ fmtDate(row.fechaCotizacion) }}</td>
                <td class="adm-td adm-desc">{{ row.description || row.empresa || '—' }}</td>
                <td class="adm-td adm-unit">{{ row.unidadEjecucion || '—' }}</td>
                <td class="adm-td adm-date">{{ row.operationWindow ? fmtDate(row.operationWindow.eventStartAt) : '—' }}</td>
                <td class="adm-td">
                  <span class="adm-cliente-name">{{ row.cliente?.name || row.empresa || row.contacto || '—' }}</span>
                </td>
                <td class="adm-td adm-money">{{ fmtMoney(row.total) }}</td>
                <td class="adm-td">
                  <span class="adm-cot-status" :class="cotStatusCls(row.quotationStatus?.name)">
                    {{ row.quotationStatus?.name || '—' }}
                  </span>
                </td>
                <td class="adm-td adm-estado-cell">
                  <div class="adm-inline-wrap" v-if="editingId === row.id">
                    <select class="adm-inline-select" v-model="editingVal"
                      @change="saveEstado(row)" @blur="editingId = null" ref="editSelectRef" autofocus>
                      <option value="">— Sin estado —</option>
                      <option v-for="e in ESTADOS_ADMIN" :key="e" :value="e">{{ e }}</option>
                    </select>
                  </div>
                  <button v-else class="adm-estado-btn"
                    :style="{ background: estadoStyle(row.estadoAdministrativo).bg, color: estadoStyle(row.estadoAdministrativo).color }"
                    @click="startEdit(row)" :title="row.saving ? 'Guardando…' : 'Clic para editar'">
                    <span v-if="row.saving" class="adm-saving-dot" />
                    {{ row.estadoAdministrativo || 'Sin estado' }}
                    <Pencil :size="10" class="adm-pencil" />
                  </button>
                </td>
                <!-- VAL ADM badge -->
                <td class="adm-td">
                  <button class="val-adm-badge" :class="row.validadoAdministrativamente ? 'val-ok' : 'val-no'"
                    @click="handleToggleValAdm(row)" :title="row.validadoAdministrativamente ? 'Validado — clic para revertir' : 'Sin validar — clic para validar'">
                    <CheckCircle v-if="row.validadoAdministrativamente" :size="12" />
                    <XCircle v-else :size="12" />
                    {{ row.validadoAdministrativamente ? 'OK' : 'Pdte.' }}
                  </button>
                </td>
                <!-- % Ejecución -->
                <td class="adm-td">
                  <div class="ejec-wrap">
                    <div class="ejec-bar">
                      <div class="ejec-fill" :style="{ width: calcEjec(row) + '%' }"
                        :class="calcEjec(row) === 100 ? 'ejec-full' : ''" />
                    </div>
                    <span class="ejec-pct">{{ calcEjec(row) }}%</span>
                  </div>
                </td>
                <td class="adm-td">{{ row.agenteComercial || '—' }}</td>
                <td class="adm-td">
                  <button class="adm-expand-btn" @click="toggleExpand(row.id)" :title="expandedId === row.id ? 'Cerrar' : 'Ver detalle'">
                    <ChevronDown :size="15" :class="{ 'rotate-180': expandedId === row.id }" style="transition: transform 0.2s" />
                  </button>
                </td>
              </tr>

            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="adm-pagination">
        <span class="adm-pag-info">{{ (page-1)*pageLimit + 1 }}–{{ Math.min(page*pageLimit, total) }} de {{ total }}</span>
        <div class="adm-pag-btns">
          <button class="adm-pag-btn" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
          <button v-for="p in visiblePages" :key="p" class="adm-pag-btn" :class="{ active: p === page }" @click="changePage(p)">{{ p }}</button>
          <button class="adm-pag-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">›</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Backdrop ───────────────────────────────────────────── -->
  <div v-if="drawerRow" class="evt-backdrop" @click="closeDrawer" />

  <!-- ── Drawer detalle evento ──────────────────────────────── -->
  <div class="evt-drawer" :class="{ 'evt-drawer-open': !!drawerRow }">
    <template v-if="drawerRow">

      <!-- Header sticky -->
      <div class="evt-hd">
        <div class="evt-hd-actions">
          <button class="evt-copy-link" @click="copyChecklistLink(drawerRow.id)" :title="linkCopied ? 'Enlace copiado' : 'Copiar enlace checklist'">
            <template v-if="linkCopied">
              <Check :size="14" />
            </template>
            <template v-else>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>Checklist</span>
            </template>
          </button>
          <button class="evt-close" @click="closeDrawer" title="Cerrar"><X :size="18" /></button>
        </div>
        <div class="evt-hd-body">
          <div class="evt-hd-num">#{{ drawerRow.numero }}</div>
          <h2 class="evt-hd-title">{{ drawerRow.description || drawerRow.empresa || 'Evento sin descripción' }}</h2>
          <p class="evt-hd-meta">
            {{ drawerRow.cliente?.name || drawerRow.empresa || drawerRow.contacto || '' }}
            <template v-if="drawerRow.operationWindow?.eventStartAt">
              · {{ fmtDate(drawerRow.operationWindow.eventStartAt) }}
            </template>
          </p>
          <div class="evt-hd-badges">
            <span class="adm-cot-status" :class="cotStatusCls(drawerRow.quotationStatus?.name)">
              {{ drawerRow.quotationStatus?.name || '—' }}
            </span>
            <span class="adm-estado-badge"
              :style="{ background: estadoStyle(drawerRow.estadoAdministrativo).bg, color: estadoStyle(drawerRow.estadoAdministrativo).color }">
              {{ drawerRow.estadoAdministrativo || 'Sin estado' }}
            </span>
            <button class="val-adm-badge" :class="drawerRow.validadoAdministrativamente ? 'val-ok' : 'val-no'"
              @click="handleToggleValAdm(drawerRow)"
              :title="drawerRow.validadoAdministrativamente ? 'Validado — clic para revertir' : 'Sin validar — clic para validar'">
              <CheckCircle v-if="drawerRow.validadoAdministrativamente" :size="11" />
              <XCircle v-else :size="11" />
              {{ drawerRow.validadoAdministrativamente ? 'Validado' : 'Sin validar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Scrollable body -->
      <div class="evt-body">

        <!-- ── Estado de ejecución ────────────────────────── -->
        <section class="evt-sec">
          <div class="evt-sec-head">
            <h3 class="evt-sec-title"><Zap :size="14" /> Estado de ejecución</h3>
            <span class="evt-ejec-pct-tag" :class="calcEjec(drawerRow) === 100 ? 'ejec-done' : ''">
              {{ calcEjec(drawerRow) }}%
            </span>
          </div>
          <div class="evt-ejec-bar-wrap">
            <div class="evt-ejec-fill"
              :style="{ width: calcEjec(drawerRow) + '%' }"
              :class="{ 'evt-ejec-full': calcEjec(drawerRow) === 100 }" />
          </div>
          <div class="evt-flags-grid">
            <div v-for="flag in ejecFlags" :key="flag.key"
              class="evt-flag" :class="drawerRow[flag.key] ? 'evt-flag-on' : 'evt-flag-off'">
              <CheckCircle v-if="drawerRow[flag.key]" :size="12" />
              <Circle v-else :size="12" />
              {{ flag.label }}
            </div>
          </div>
        </section>

        <!-- ── Información general ─────────────────────────── -->
        <section class="evt-sec">
          <div class="evt-sec-head">
            <h3 class="evt-sec-title"><Info :size="14" /> Información general</h3>
            <button class="evt-edit-btn" @click="infoEditMode[drawerRow.id] = !infoEditMode[drawerRow.id]">
              <template v-if="!infoEditMode[drawerRow.id]"><Pencil :size="11" /> Editar</template>
              <template v-else><Check :size="11" /> Listo</template>
            </button>
          </div>

          <!-- View mode -->
          <div v-if="!infoEditMode[drawerRow.id]">
            <!-- Cliente card -->
            <div class="evt-cliente-card">
              <div class="evt-cliente-icon"><Users :size="16" /></div>
              <div class="evt-cliente-info">
                <span class="evt-cliente-name">{{ drawerRow.cliente?.name || drawerRow.empresa || '—' }}</span>
                <span v-if="drawerRow.empresa && drawerRow.cliente?.name" class="evt-cliente-sub">{{ drawerRow.empresa }}</span>
                <span v-if="drawerRow.contacto" class="evt-cliente-sub">Contacto: {{ drawerRow.contacto }}</span>
              </div>
            </div>
            <!-- Rest of info -->
            <div class="evt-kv-grid" style="margin-top:10px">
              <div class="evt-kv"><span class="evt-k">Descripción</span><span class="evt-v">{{ drawerRow.description || '—' }}</span></div>
              <div class="evt-kv"><span class="evt-k">Región</span><span class="evt-v">{{ drawerRow.unidadEjecucion || '—' }}</span></div>
              <div class="evt-kv"><span class="evt-k">Fecha evento</span><span class="evt-v">{{ fmtDate(drawerRow.operationWindow?.eventStartAt) }}</span></div>
              <div class="evt-kv"><span class="evt-k">Fecha fin</span><span class="evt-v">{{ fmtDate(drawerRow.operationWindow?.eventEndAt) }}</span></div>
              <div class="evt-kv"><span class="evt-k">Ejecutivo</span><span class="evt-v">{{ drawerRow.agenteComercial || '—' }}</span></div>
              <div class="evt-kv"><span class="evt-k">Ubicación</span><span class="evt-v">{{ drawerRow.ubicacion || '—' }}</span></div>
              <div class="evt-kv"><span class="evt-k">Total cotiz.</span><span class="evt-v evt-money">{{ fmtMoney(drawerRow.total) }}</span></div>
              <div class="evt-kv"><span class="evt-k">Creado por</span><span class="evt-v">{{ drawerRow.createdBy?.fullName || '—' }}</span></div>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="evt-fields evt-info-fields">
            <div class="evt-field evt-field-full" style="position:relative">
              <label class="evt-fl">Cliente</label>
              <div class="ss-wrap" :class="{ 'ss-open': clienteOpen[drawerRow.id] }">
                <input
                  class="dso-input ss-input"
                  :value="clienteOpen[drawerRow.id]
                    ? clienteQuery[drawerRow.id]
                    : (clientes.find(c => c.id === infoForm[drawerRow.id]?.clienteId)?.name || '')"
                  :placeholder="infoForm[drawerRow.id]?.clienteId ? '' : '— Sin cliente vinculado —'"
                  @focus="openClienteSearch(drawerRow.id)"
                  @blur="closeClienteSearch(drawerRow.id)"
                  @input="e => clienteQuery[drawerRow.id] = e.target.value"
                  autocomplete="off"
                />
                <span v-if="infoForm[drawerRow.id]?.clienteId" class="ss-clear" @mousedown.prevent="selectCliente(drawerRow, null)">✕</span>
                <div v-if="clienteOpen[drawerRow.id]" class="ss-dropdown">
                  <div
                    class="ss-option ss-option-none"
                    @mousedown.prevent="selectCliente(drawerRow, null)"
                  >— Sin cliente vinculado —</div>
                  <div
                    v-for="c in filteredClientes(drawerRow.id)"
                    :key="c.id"
                    class="ss-option"
                    :class="{ 'ss-option-active': c.id === infoForm[drawerRow.id]?.clienteId }"
                    @mousedown.prevent="selectCliente(drawerRow, c)"
                  >{{ c.name }}</div>
                  <div v-if="filteredClientes(drawerRow.id).length === 0" class="ss-option ss-no-results">Sin resultados</div>
                </div>
              </div>
            </div>
            <div class="evt-field">
              <label class="evt-fl">Empresa</label>
              <input type="text" class="dso-input" v-model="infoForm[drawerRow.id].empresa" @blur="saveInfoGeneral(drawerRow)" placeholder="—" />
            </div>
            <div class="evt-field">
              <label class="evt-fl">Contacto</label>
              <input type="text" class="dso-input" v-model="infoForm[drawerRow.id].contacto" @blur="saveInfoGeneral(drawerRow)" placeholder="—" />
            </div>
            <div class="evt-field evt-field-full">
              <label class="evt-fl">Descripción</label>
              <input type="text" class="dso-input" v-model="infoForm[drawerRow.id].description" @blur="saveInfoGeneral(drawerRow)" placeholder="—" />
            </div>
            <div class="evt-field">
              <label class="evt-fl">Región</label>
              <input type="text" class="dso-input" v-model="infoForm[drawerRow.id].unidadEjecucion" @blur="saveInfoGeneral(drawerRow)" placeholder="—" />
            </div>
            <div class="evt-field">
              <label class="evt-fl">Ejecutivo</label>
              <input type="text" class="dso-input" v-model="infoForm[drawerRow.id].agenteComercial" @blur="saveInfoGeneral(drawerRow)" placeholder="—" />
            </div>
            <div class="evt-field evt-field-full">
              <label class="evt-fl">Ubicación</label>
              <input type="text" class="dso-input" v-model="infoForm[drawerRow.id].ubicacion" @blur="saveInfoGeneral(drawerRow)" placeholder="—" />
            </div>
          </div>

          <!-- Save indicator -->
          <div v-if="infoSaving[drawerRow.id] || infoSaved[drawerRow.id] || infoError[drawerRow.id]" class="evt-inline-save">
            <span v-if="infoSaving[drawerRow.id]" class="evt-save-msg">Guardando…</span>
            <span v-if="infoSaved[drawerRow.id]" class="evt-save-ok"><Check :size="11" /> Guardado</span>
            <span v-if="infoError[drawerRow.id]" class="evt-save-err">Error al guardar</span>
          </div>
        </section>

        <!-- ── Responsables ────────────────────────────────── -->
        <section class="evt-sec">
          <div class="evt-sec-head">
            <h3 class="evt-sec-title"><Users :size="14" /> Responsables</h3>
          </div>
          <div class="evt-kv-grid">
            <div class="evt-kv">
              <span class="evt-k">Comercial</span>
              <span class="evt-v" :class="{ 'evt-v-empty': !drawerRow.responsableComercial && !drawerRow.agenteComercial }">
                {{ drawerRow.responsableComercial?.fullName || drawerRow.agenteComercial || '— Sin asignar' }}
              </span>
            </div>
            <div class="evt-kv">
              <span class="evt-k">Administrativo</span>
              <span class="evt-v" :class="{ 'evt-v-empty': !drawerRow.responsableAdministrativo }">
                {{ drawerRow.responsableAdministrativo?.fullName || '— Sin asignar' }}
              </span>
            </div>
            <div class="evt-kv">
              <span class="evt-k">Operativo</span>
              <span class="evt-v" :class="{ 'evt-v-empty': !drawerRow.responsableOperativo }">
                {{ drawerRow.responsableOperativo?.fullName || '— Sin asignar' }}
              </span>
            </div>
            <div class="evt-kv">
              <span class="evt-k">Coordinador</span>
              <span class="evt-v" :class="{ 'evt-v-empty': !drawerRow.coordinadores?.length && !drawerRow.coordinador }">
                {{ drawerRow.coordinadores?.length
                    ? drawerRow.coordinadores.map(c => c.user?.fullName).filter(Boolean).join(', ')
                    : drawerRow.coordinador || '— Sin asignar' }}
              </span>
            </div>
          </div>
        </section>

        <!-- ── Financiero detallado ────────────────────────── -->
        <section class="evt-sec">
          <div class="evt-sec-head">
            <h3 class="evt-sec-title"><DollarSign :size="14" /> Financiero detallado</h3>
          </div>
          <FinancieroPanel :quotationId="drawerRow.id" :key="drawerRow.id" />
        </section>

        <!-- ── Documentos ─────────────────────────────────── -->
        <section class="evt-sec">
          <div class="docs-header">
            <h3 class="evt-sec-title" style="margin:0"><Paperclip :size="14" /> Documentos</h3>
            <div class="docs-header-actions">
              <button class="docs-refresh-btn" @click="loadDocumentos(drawerRow.id)" :disabled="docsLoading" title="Recargar">
                <RefreshCw :size="11" :class="docsLoading ? 'spin' : ''" />
              </button>
              <button
                v-if="docs[drawerRow.id]?.length"
                class="docs-zip-btn"
                @click="handleDownloadZip(drawerRow)"
                :disabled="docsZipping"
              >
                <Download :size="11" />
                {{ docsZipping ? 'Generando…' : 'ZIP' }}
              </button>
            </div>
          </div>

          <div class="docs-box">
            <template v-if="docsLoading">
              <div class="adm-sk-row" style="height:28px;border-radius:7px" v-for="n in 3" :key="n" />
            </template>
            <div v-else-if="!docs[drawerRow.id]?.length && docs[drawerRow.id] !== undefined" class="docs-empty">
              Sin documentos cargados
            </div>
            <template v-else>
              <div
                v-for="doc in docs[drawerRow.id]"
                :key="doc.key || doc.url"
                class="docs-chip"
              >
                <span class="docs-chip-tipo">{{ doc.tipo }}</span>
                <component :is="docIcon(doc)" :size="12" class="docs-chip-icon" />
                <span class="docs-chip-label">{{ doc.label }}</span>
                <div class="docs-chip-actions">
                  <a :href="doc.url" target="_blank" class="docs-chip-btn" title="Ver">
                    <Eye :size="11" />
                  </a>
                  <a :href="doc.url" :download="doc.label" class="docs-chip-btn" title="Descargar">
                    <Download :size="11" />
                  </a>
                </div>
              </div>
            </template>
          </div>
        </section>

        <!-- ── Observaciones (view mode only) ─────────────── -->
        <section v-if="!dsoEditMode[drawerRow.id] && (drawerRow.observacionesComerciales || drawerRow.observacionesAdministrativas)" class="evt-sec">
          <h3 class="evt-sec-title"><FileText :size="14" /> Observaciones</h3>
          <div v-if="drawerRow.observacionesComerciales" class="evt-obs-block">
            <span class="evt-obs-label">Comerciales</span>
            <p class="evt-obs-text">{{ drawerRow.observacionesComerciales }}</p>
          </div>
          <div v-if="drawerRow.observacionesAdministrativas" class="evt-obs-block">
            <span class="evt-obs-label">Administrativas</span>
            <p class="evt-obs-text">{{ drawerRow.observacionesAdministrativas }}</p>
          </div>
        </section>

        <!-- ── Productos ───────────────────────────────────── -->
        <section class="evt-sec">
          <h3 class="evt-sec-title"><Package :size="14" /> Productos</h3>
          <div v-if="detailLoading" class="evt-items-loading">
            <div class="adm-sk-row" style="height:32px;border-radius:8px" />
            <div class="adm-sk-row" style="height:32px;border-radius:8px" />
            <div class="adm-sk-row" style="height:32px;border-radius:8px" />
          </div>
          <div v-else-if="quotationDetail?.items?.length" class="evt-items-list">
            <div v-for="item in quotationDetail.items" :key="item.id" class="evt-item-row">
              <div class="evt-item-name">{{ item.product?.nombre || item.product?.dispositivo || item.descripcion || '—' }}</div>
              <div class="evt-item-qty">{{ item.cantidad }} u.</div>
              <div class="evt-item-price">{{ fmtMoney(item.precioUnitario) }}</div>
            </div>
            <div v-if="quotationDetail?.thirdPartyItems?.length">
              <div v-for="tp in quotationDetail.thirdPartyItems" :key="'tp'+tp.id" class="evt-item-row evt-item-third">
                <div class="evt-item-name">{{ tp.catalogProduct?.nombre || tp.catalogProduct?.dispositivo || tp.descripcion || '—' }} <span class="evt-item-badge-tp">3°</span></div>
                <div class="evt-item-qty">{{ tp.cantidad }} u.</div>
                <div class="evt-item-price">{{ fmtMoney(tp.precioUnitario) }}</div>
              </div>
            </div>
          </div>
          <p v-else class="evt-empty-items">Sin productos registrados</p>
        </section>

        <!-- ── Notas ───────────────────────────────────────── -->
        <section class="evt-sec evt-sec-last">
          <h3 class="evt-sec-title"><MessageSquare :size="14" /> Notas</h3>
          <NotasCotizacionPanel :quotationId="drawerRow.id" :areasFiltro="['Comercial', 'Administrativo']" />
        </section>

      </div>

      <!-- ── Validación administrativa ── sticky footer -->
      <div class="evt-val-footer">
        <button
          class="evt-val-btn"
          :class="drawerRow.validadoAdministrativamente ? 'evt-val-btn-revert' : 'evt-val-btn-ok'"
          @click="handleToggleValAdm(drawerRow)"
        >
          <CheckCircle v-if="drawerRow.validadoAdministrativamente" :size="16" />
          <XCircle v-else :size="16" />
          {{ drawerRow.validadoAdministrativamente ? 'Quitar validación administrativa' : 'Marcar como validado administrativamente' }}
        </button>
      </div>

      <!-- Save indicator bar -->
      <div v-if="dsoSaving[drawerRow.id] || dsoSaved[drawerRow.id] || dsoError[drawerRow.id]" class="evt-save-bar">
        <span v-if="dsoSaving[drawerRow.id]" class="evt-save-msg">Guardando datos financieros…</span>
        <span v-if="dsoSaved[drawerRow.id]" class="evt-save-ok"><Check :size="12" /> Guardado</span>
        <span v-if="dsoError[drawerRow.id]" class="evt-save-err">Error al guardar</span>
      </div>

    </template>
  </div>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { formatCOP } from '@/utils/currency.js'
import {
  Download, Search, ChevronDown, Check, AlertCircle, FileX,
  Pencil, Users, DollarSign, FileText, CheckCircle, XCircle,
  X, Zap, Circle, Info, Package, MessageSquare,
  Paperclip, Eye, RefreshCw, File, Image, FileType,
} from 'lucide-vue-next'
import {
  getAdminCotizaciones, updateEstadoAdmin,
  updateResponsables, toggleValidacionAdmin, updateDatosFinancieros,
  getAdminCotizacionDetail, updateInfoGeneral,
  getDocumentos, downloadDocumentosZip,
} from '@/services/administracion.service.js'
import { getCustomer } from '@/services/customer.service'
import { getUsers } from '@/services/users.service.js'
import { ESTADOS_ADMIN, estadoAdminStyle } from '@/composables/useEstadoAdmin.js'
import NotasCotizacionPanel from '@/components/quotation/NotasCotizacionPanel.vue'
import FinancieroPanel      from '@/components/quotation/FinancieroPanel.vue'

function estadoStyle(e) { return estadoAdminStyle(e) }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtDateInput(d) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

function fmtDisplayDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

// Resuelve nombre de usuario: primero busca en el listado cargado (más fresco),
// luego usa el objeto anidado que trajo la API (fallback).
function resolveUser(id, nestedObj) {
  if (id) {
    const found = usuarios.value.find(u => u.id === id)
    if (found) return found.fullName
  }
  return nestedObj?.fullName || null
}

function fmtMoney(n) { return n == null ? '—' : formatCOP(n) }

function cotStatusCls(s) {
  return { 'Pendiente': 'cot-pendiente', 'Aprobada': 'cot-aprobada', 'Rechazada': 'cot-rechazada', 'En Proceso': 'cot-en-proceso', 'Vencida': 'cot-vencida', 'Cancelada': 'cot-cancelada' }[s] ?? 'cot-default'
}

function calcEjec(row) {
  const flags = [row.planillaEjecucion, row.listadoMaterial, row.registroFotografico, row.despachado, row.retorno, row.eventoFinalizado, row.validadoAdministrativamente]
  const done = flags.filter(Boolean).length
  return Math.round((done / flags.length) * 100)
}

// ── State ─────────────────────────────────────────────────
const loading    = ref(false)
const error      = ref(null)
const rows       = ref([])
const total      = ref(0)
const page       = ref(1)
const pageLimit  = 50
const sortField  = ref('fechaCotizacion')
const sortDir    = ref('desc')
const estadosOpen = ref(false)
const estadosRef  = ref(null)
const editingId   = ref(null)
const editingVal  = ref('')
const editSelectRef = ref(null)
const expandedId  = ref(null)
const usuarios    = ref([])
const dsoForm     = ref({})
const dsoSaving   = ref({})
const dsoSaved    = ref({})
const dsoError    = ref({})
const dsoEditMode = ref({})
const quotationDetail = ref(null)
const detailLoading   = ref(false)
const clientes        = ref([])
const infoForm        = ref({})
const infoEditMode    = ref({})
const infoSaving      = ref({})
const infoSaved       = ref({})
const infoError       = ref({})
const linkCopied      = ref(false)

const ejecFlags = [
  { key: 'planillaEjecucion',          label: 'Planilla' },
  { key: 'listadoMaterial',            label: 'Material' },
  { key: 'registroFotografico',        label: 'Fotos' },
  { key: 'despachado',                 label: 'Despachado' },
  { key: 'retorno',                    label: 'Retorno' },
  { key: 'eventoFinalizado',           label: 'Finalizado' },
  { key: 'validadoAdministrativamente', label: 'Val. Adm.' },
]

const drawerRow = computed(() =>
  expandedId.value ? rows.value.find(r => r.id === expandedId.value) ?? null : null
)

function closeDrawer() {
  const id = expandedId.value
  expandedId.value = null
  if (id) dsoEditMode.value[id] = false
}

async function copyChecklistLink(id) {
  const url = `${window.location.origin}/checklist/evento/${id}`
  try {
    await navigator.clipboard.writeText(url)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2500)
  } catch {
    prompt('Copia este enlace:', url)
  }
}

async function loadDetail(id) {
  detailLoading.value = true
  quotationDetail.value = null
  try {
    quotationDetail.value = await getAdminCotizacionDetail(id)
  } catch {}
  finally { detailLoading.value = false }
}

const filters = ref({
  search:      '',
  estados:     [],
  estadoCot:   [],
  valAdm:      '',
  fechaInicio: '',
  fechaFin:    '',
  responsable: '',
})

const cotStatusOpen = ref(false)
const cotStatusRef  = ref(null)

const ESTADOS_COT = ['Pendiente', 'Aprobada', 'Rechazada', 'Vencida']

// ── Pagination ────────────────────────────────────────────
const totalPages   = computed(() => Math.max(1, Math.ceil(total.value / pageLimit)))
const visiblePages = computed(() => {
  const p = page.value, tp = totalPages.value
  const pages = []
  for (let i = Math.max(1, p - 2); i <= Math.min(tp, p + 2); i++) pages.push(i)
  return pages
})

// ── Load data ─────────────────────────────────────────────
// ── Searchable cliente select ──────────────────────────────
const clienteOpen  = ref({})
const clienteQuery = ref({})

function filteredClientes(id) {
  const q = (clienteQuery.value[id] || '').toLowerCase()
  const list = q ? clientes.value.filter(c => c.name.toLowerCase().includes(q)) : clientes.value
  return list.slice(0, 10)
}

function openClienteSearch(id) {
  clienteOpen.value  = { ...clienteOpen.value,  [id]: true }
  clienteQuery.value = { ...clienteQuery.value,  [id]: '' }
}

function selectCliente(row, cliente) {
  infoForm.value[row.id].clienteId = cliente?.id ?? null
  clienteOpen.value[row.id]  = false
  clienteQuery.value[row.id] = ''
  saveInfoGeneral(row)
}

function closeClienteSearch(id) {
  clienteOpen.value[id] = false
  clienteQuery.value[id] = ''
}

let debounceTimer = null
function onFilter() {
  page.value = 1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
}

async function load() {
  loading.value = true
  error.value   = null
  try {
    const params = {
      search:      filters.value.search     || undefined,
      estadoAdmin: filters.value.estados.join(',')    || undefined,
      estadoCot:   filters.value.estadoCot.join(',')  || undefined,
      fechaInicio: filters.value.fechaInicio || undefined,
      fechaFin:    filters.value.fechaFin   || undefined,
      responsable: filters.value.responsable || undefined,
      page:        page.value,
      limit:       pageLimit,
      sortBy:      sortField.value,
      sortOrder:   sortDir.value,
    }
    const res = await getAdminCotizaciones(params)
    rows.value  = (res.data ?? []).map(r => ({ ...r, saving: false }))
    total.value = res.total ?? 0

    // Sync forms from server for every row (skip expanded row to avoid resetting active edits).
    for (const r of rows.value) {
      if (expandedId.value === r.id) continue
      infoForm.value[r.id] = {
        clienteId:       r.clienteId ?? null,
        empresa:         r.empresa ?? '',
        contacto:        r.contacto ?? '',
        description:     r.description ?? '',
        unidadEjecucion: r.unidadEjecucion ?? '',
        agenteComercial: r.agenteComercial ?? '',
        ubicacion:       r.ubicacion ?? '',
      }
      dsoForm.value[r.id] = {
        responsableComercialId:      r.responsableComercialId ?? null,
        responsableAdministrativoId: r.responsableAdministrativoId ?? null,
        responsableOperativoId:      r.responsableOperativoId ?? null,
        departamentoServicio:        r.departamentoServicio ?? '',
        ordenCompraValor:            r.ordenCompraValor ?? null,
        noFactura:                   r.noFactura ?? '',
        fechaFactura:                fmtDateInput(r.fechaFactura),
        retencion:                   r.retencion ?? null,
        fechaVencimiento:            fmtDateInput(r.fechaVencimiento),
        anticipo:                    r.anticipo ?? null,
        tipoSaldo:                   r.tipoSaldo ?? '',
        ivaTotal:                    r.ivaTotal ?? null,
        observacionesComerciales:    r.observacionesComerciales ?? '',
        observacionesAdministrativas:r.observacionesAdministrativas ?? '',
      }
    }

    // Apply client-side valAdm filter
    if (filters.value.valAdm === 'si')  rows.value = rows.value.filter(r => r.validadoAdministrativamente)
    if (filters.value.valAdm === 'no')  rows.value = rows.value.filter(r => !r.validadoAdministrativamente)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando eventos'
  } finally {
    loading.value = false
  }
}

async function loadUsuarios() {
  try {
    const res = await getUsers()
    usuarios.value = (res.data ?? res ?? []).filter(u => u.isActive)
  } catch {}
}

async function loadClientes() {
  try {
    const res = await getCustomer()
    clientes.value = (res.data ?? []).sort((a, b) => a.name.localeCompare(b.name))
  } catch {}
}

async function saveInfoGeneral(row) {
  clearTimeout(saveTimer[`info_${row.id}`])
  saveTimer[`info_${row.id}`] = setTimeout(async () => {
    infoSaving.value[row.id] = true
    infoSaved.value[row.id]  = false
    infoError.value[row.id]  = false
    try {
      const f = infoForm.value[row.id]
      const updated = await updateInfoGeneral(row.id, {
        clienteId:       f.clienteId       ?? null,
        empresa:         f.empresa         || undefined,
        contacto:        f.contacto        || undefined,
        description:     f.description     || undefined,
        unidadEjecucion: f.unidadEjecucion || undefined,
        agenteComercial: f.agenteComercial || undefined,
        ubicacion:       f.ubicacion       || undefined,
      })
      Object.assign(row, {
        clienteId:       updated.clienteId ?? null,
        empresa:         updated.empresa ?? null,
        contacto:        updated.contacto ?? null,
        description:     updated.description ?? null,
        unidadEjecucion: updated.unidadEjecucion ?? null,
        agenteComercial: updated.agenteComercial ?? null,
        ubicacion:       updated.ubicacion ?? null,
        cliente:         updated.cliente ?? row.cliente,
      })
      infoSaved.value[row.id] = true
      setTimeout(() => { infoSaved.value[row.id] = false }, 2000)
    } catch {
      infoError.value[row.id] = true
      setTimeout(() => { infoError.value[row.id] = false }, 3000)
    } finally {
      infoSaving.value[row.id] = false
    }
  }, 600)
}

// ── Documentos ──────────────────────────────────────────────
const docs         = ref({})   // { [quotationId]: Doc[] }
const docsLoadingId = ref(null) // id currently loading
const docsZipping  = ref(false)

const docsLoading = computed(() => docsLoadingId.value === expandedId.value)

async function loadDocumentos(id) {
  docsLoadingId.value = id
  try {
    const data = await getDocumentos(id)
    docs.value = { ...docs.value, [id]: data.documentos }
  } catch {
    docs.value = { ...docs.value, [id]: [] }
  } finally {
    docsLoadingId.value = null
  }
}

function docsTipos(id) {
  const list = docs.value[id] || []
  return [...new Set(list.map(d => d.tipo))]
}

function docIcon(doc) {
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(doc.ext?.toLowerCase())) return Image
  if (doc.ext?.toLowerCase() === '.pdf') return FileType
  return File
}

async function handleDownloadZip(row) {
  docsZipping.value = true
  try {
    const name = `documentos-${row.numero}-${(row.empresa || '').replace(/[^a-z0-9]/gi, '_')}.zip`
    await downloadDocumentosZip(row.id, name)
  } finally {
    docsZipping.value = false
  }
}

onMounted(() => {
  load()
  loadUsuarios()
  loadClientes()
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeyDown)
})

function onClickOutside(e) {
  if (estadosRef.value    && !estadosRef.value.contains(e.target))    estadosOpen.value    = false
  if (cotStatusRef.value  && !cotStatusRef.value.contains(e.target))  cotStatusOpen.value  = false
}

// ── Sort ──────────────────────────────────────────────────
function sort(field) {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = field; sortDir.value = 'desc' }
  load()
}

// ── Filters ───────────────────────────────────────────────
function toggleEstado(e) {
  const idx = filters.value.estados.indexOf(e)
  if (idx >= 0) filters.value.estados.splice(idx, 1)
  else          filters.value.estados.push(e)
  onFilter()
}

function toggleCotStatus(e) {
  const idx = filters.value.estadoCot.indexOf(e)
  if (idx >= 0) filters.value.estadoCot.splice(idx, 1)
  else          filters.value.estadoCot.push(e)
  onFilter()
}

function changePage(p) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Inline edit estado ────────────────────────────────────
function startEdit(row) {
  editingId.value  = row.id
  editingVal.value = row.estadoAdministrativo ?? ''
  nextTick(() => editSelectRef.value?.focus())
}

async function saveEstado(row) {
  const newVal = editingVal.value
  editingId.value = null
  if (newVal === (row.estadoAdministrativo ?? '')) return
  row.saving = true
  const prev = row.estadoAdministrativo
  row.estadoAdministrativo = newVal || null
  try {
    await updateEstadoAdmin(row.id, newVal || null)
  } catch {
    row.estadoAdministrativo = prev
  } finally {
    row.saving = false
  }
}

// ── VAL ADM toggle ────────────────────────────────────────
async function handleToggleValAdm(row) {
  const prev = row.validadoAdministrativamente
  row.validadoAdministrativamente = !prev
  try {
    await toggleValidacionAdmin(row.id)
  } catch {
    row.validadoAdministrativamente = prev
  }
}

// ── Expand / Drawer ───────────────────────────────────────
function toggleExpand(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    dsoEditMode.value[id] = false
    return
  }
  expandedId.value = id
  loadDetail(id)
  loadDocumentos(id)
  const row = rows.value.find(r => r.id === id)
  const hasData = row && (
    row.noFactura || row.fechaFactura || row.ordenCompraValor || row.departamentoServicio
  )
  if (!hasData) dsoEditMode.value[id] = true
}

function onKeyDown(e) {
  if (e.key === 'Escape' && expandedId.value) {
    expandedId.value = null
  }
}

function toggleDsoEdit(id) {
  dsoEditMode.value[id] = !dsoEditMode.value[id]
}

let saveTimer = {}

async function saveResponsables(row) {
  clearTimeout(saveTimer[`resp_${row.id}`])
  saveTimer[`resp_${row.id}`] = setTimeout(async () => {
    dsoSaving.value[row.id] = true
    dsoSaved.value[row.id]  = false
    dsoError.value[row.id]  = false
    try {
      const f = dsoForm.value[row.id]
      await updateResponsables(row.id, {
        responsableComercialId:      f.responsableComercialId,
        responsableAdministrativoId: f.responsableAdministrativoId,
        responsableOperativoId:      f.responsableOperativoId,
      })
      // Sync FK ids and nested objects so view mode shows updated values immediately
      const mkUser = (id) => { const u = usuarios.value.find(x => x.id === id); return u ? { id: u.id, fullName: u.fullName } : null }
      row.responsableComercialId      = f.responsableComercialId
      row.responsableAdministrativoId = f.responsableAdministrativoId
      row.responsableOperativoId      = f.responsableOperativoId
      row.responsableComercial      = mkUser(f.responsableComercialId)
      row.responsableAdministrativo = mkUser(f.responsableAdministrativoId)
      row.responsableOperativo      = mkUser(f.responsableOperativoId)
      dsoSaved.value[row.id] = true
      setTimeout(() => { dsoSaved.value[row.id] = false }, 2000)
    } catch {
      dsoError.value[row.id] = true
      setTimeout(() => { dsoError.value[row.id] = false }, 3000)
    } finally {
      dsoSaving.value[row.id] = false
    }
  }, 300)
}

async function saveDatosFinancieros(row) {
  clearTimeout(saveTimer[`fin_${row.id}`])
  saveTimer[`fin_${row.id}`] = setTimeout(async () => {
    dsoSaving.value[row.id] = true
    dsoSaved.value[row.id]  = false
    dsoError.value[row.id]  = false
    try {
      const f = dsoForm.value[row.id]
      await updateDatosFinancieros(row.id, {
        departamentoServicio:        f.departamentoServicio || undefined,
        ordenCompraValor:            f.ordenCompraValor ?? undefined,
        noFactura:                   f.noFactura || undefined,
        fechaFactura:                f.fechaFactura || undefined,
        retencion:                   f.retencion ?? undefined,
        fechaVencimiento:            f.fechaVencimiento || undefined,
        anticipo:                    f.anticipo ?? undefined,
        tipoSaldo:                   f.tipoSaldo || undefined,
        ivaTotal:                    f.ivaTotal ?? undefined,
        observacionesComerciales:    f.observacionesComerciales || undefined,
        observacionesAdministrativas:f.observacionesAdministrativas || undefined,
      })
      // Sync saved values back to row so view mode reflects them immediately
      Object.assign(row, {
        departamentoServicio:        f.departamentoServicio || null,
        ordenCompraValor:            f.ordenCompraValor ?? null,
        noFactura:                   f.noFactura || null,
        fechaFactura:                f.fechaFactura || null,
        retencion:                   f.retencion ?? null,
        fechaVencimiento:            f.fechaVencimiento || null,
        anticipo:                    f.anticipo ?? null,
        tipoSaldo:                   f.tipoSaldo || null,
        ivaTotal:                    f.ivaTotal ?? null,
        observacionesComerciales:    f.observacionesComerciales || null,
        observacionesAdministrativas:f.observacionesAdministrativas || null,
      })
      dsoSaved.value[row.id] = true
      setTimeout(() => { dsoSaved.value[row.id] = false }, 2000)
    } catch {
      dsoError.value[row.id] = true
      setTimeout(() => { dsoError.value[row.id] = false }, 3000)
    } finally {
      dsoSaving.value[row.id] = false
    }
  }, 600)
}

// ── CSV export ────────────────────────────────────────────
function exportCSV() {
  const headers = ['#', 'Fecha cot.', 'Evento', 'Región', 'Fecha evento', 'Cliente', 'Total', 'Estado cot.', 'Estado admin.', 'VAL ADM', '% Ejec.', 'Comercial']
  const csvRows = rows.value.map(r => [
    r.numero,
    fmtDate(r.fechaCotizacion),
    r.description || r.empresa || '',
    r.unidadEjecucion || '',
    r.operationWindow ? fmtDate(r.operationWindow.eventStartAt) : '',
    r.cliente?.name || r.empresa || r.contacto || '',
    r.total ?? '',
    r.quotationStatus?.name || '',
    r.estadoAdministrativo || '',
    r.validadoAdministrativamente ? 'Sí' : 'No',
    calcEjec(r) + '%',
    r.agenteComercial || '',
  ])
  const csv = [headers, ...csvRows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `eventos-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.adm-page { padding: 20px 24px; width: 100%; font-family: 'Inter', sans-serif; box-sizing: border-box; }

.adm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.adm-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
.adm-subtitle { font-size: 13px; color: #64748B; margin: 2px 0 0; }

.adm-btn-export {
  display: flex; align-items: center; gap: 7px; padding: 8px 16px;
  background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; transition: all 0.15s;
}
.adm-btn-export:hover:not(:disabled) { background: #E0F9FA; border-color: #27C8D8; color: #27C8D8; }
.adm-btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

.adm-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.adm-filter-search { position: relative; flex: 1; min-width: 200px; }
.adm-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
.adm-filter-search .adm-input { padding-left: 30px; width: 100%; }

.adm-input {
  height: 36px; padding: 0 10px; border: 1.5px solid #E2E8F0; border-radius: 8px;
  font-size: 13px; font-family: 'Inter', sans-serif; color: #0F172A; background: #fff;
  outline: none; box-sizing: border-box; transition: border-color 0.15s; min-width: 0;
}
.adm-input:focus { border-color: #27C8D8; }

.adm-filter-estados { position: relative; }
.adm-estado-trigger {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px; width: 260px; cursor: pointer; user-select: none;
}
.adm-placeholder { color: #94A3B8; font-size: 13px; }
.adm-estado-pills { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; }
.adm-mini-badge { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; white-space: nowrap; }
.adm-mini-more { background: #F1F5F9; color: #64748B; }

.adm-estado-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 200;
  background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(39,200,216,.12); width: 260px; max-height: 360px;
  overflow-y: auto; padding: 6px;
}
.adm-estado-opt {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  border-radius: 8px; cursor: pointer; transition: background 0.1s;
}
.adm-estado-opt:hover { background: #F8FAFC; }
.adm-estado-opt.selected { background: #F0FAFB; }
.adm-estado-check {
  width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #CBD5E1;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #27C8D8;
}
.adm-estado-badge { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 6px; }
.adm-clear-btn {
  width: 100%; margin-top: 4px; padding: 6px; border: none; background: none;
  color: #EF4444; font-size: 12px; cursor: pointer; border-radius: 6px;
}
.adm-clear-btn:hover { background: #FEF2F2; }

.adm-table-wrap {
  background: #fff; border-radius: 16px;
  box-shadow: 0 1px 4px rgba(39,200,216,.06), 0 4px 16px rgba(39,200,216,.08); overflow: hidden;
}
.adm-scroll { overflow-x: auto; }

.adm-skeleton { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.adm-sk-row {
  height: 40px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 400% 100%; border-radius: 8px; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }

.adm-error { display: flex; align-items: center; gap: 10px; padding: 20px; color: #DC2626; font-size: 13px; }
.adm-error button { padding: 4px 12px; border: 1px solid #DC2626; border-radius: 6px; background: none; color: #DC2626; cursor: pointer; font-size: 12px; }
.adm-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px; color: #94A3B8; font-size: 14px; }

.adm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.adm-th {
  padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 600;
  color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px;
  background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0; white-space: nowrap;
}
.adm-th.sortable { cursor: pointer; user-select: none; }
.adm-th.sortable:hover { color: #27C8D8; }

.adm-tr { border-bottom: 1px solid #F1F5F9; transition: background 0.1s; }
.adm-tr:hover { background: #F8FAFC; }
.adm-tr-expanded { background: #F0F7FF; }

.adm-td { padding: 10px 14px; color: #374151; vertical-align: middle; }
.adm-num  { font-weight: 600; color: #27C8D8; white-space: nowrap; }
.adm-date { white-space: nowrap; color: #64748B; }
.adm-desc { max-width: 200px; }
.adm-unit { white-space: nowrap; color: #64748B; font-size: 12px; }
.adm-money { font-weight: 600; color: #0F172A; white-space: nowrap; }
.adm-cliente-name { font-weight: 500; }

.adm-cot-status { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
.cot-pendiente  { background: #F1F5F9; color: #475569; }
.cot-aprobada   { background: #F0FDF4; color: #166534; }
.cot-rechazada  { background: #FEF2F2; color: #991B1B; }
.cot-en-proceso { background: #E0F9FA; color: #27C8D8; }
.cot-vencida    { background: #FEFCE8; color: #854D0E; }
.cot-cancelada  { background: #FEF2F2; color: #991B1B; }
.cot-default    { background: #F1F5F9; color: #64748B; }

.adm-estado-cell { min-width: 150px; }
.adm-inline-wrap { min-width: 150px; }
.adm-inline-select {
  width: 100%; padding: 4px 8px; border: 1.5px solid #27C8D8;
  border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif; outline: none;
}
.adm-estado-btn {
  display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px; border: none; cursor: pointer; white-space: nowrap; transition: filter 0.1s;
}
.adm-estado-btn:hover { filter: brightness(0.96); }
.adm-pencil { opacity: 0.6; }
.adm-saving-dot {
  width: 7px; height: 7px; border-radius: 50%; background: currentColor;
  animation: blink 0.8s infinite alternate;
}
@keyframes blink { from { opacity: 1 } to { opacity: 0.2 } }

/* VAL ADM */
.val-adm-badge {
  display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px; border: none; cursor: pointer; transition: filter 0.1s; white-space: nowrap;
}
.val-adm-badge:hover { filter: brightness(0.93); }
.val-ok { background: #F0FDF4; color: #166534; }
.val-no { background: #FEF2F2; color: #991B1B; }

/* Ejecución */
.ejec-wrap { display: flex; align-items: center; gap: 6px; min-width: 80px; }
.ejec-bar { flex: 1; height: 5px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
.ejec-fill { height: 100%; background: #27C8D8; border-radius: 99px; transition: width 0.3s; }
.ejec-full { background: #16A34A; }
.ejec-pct { font-size: 11px; color: #64748B; white-space: nowrap; }

/* Expand button */
.adm-expand-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #E2E8F0;
  background: #F8FAFC; color: #64748B; cursor: pointer; transition: all 0.15s;
}
.adm-expand-btn:hover { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }

/* DSO panel */
.adm-detail-row { background: #F0F7FF; }
.adm-detail-row td { padding: 0; border-bottom: 2px solid #A7EEF5; }

.dso-panel { padding: 20px 24px; }

.dso-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1.5px solid #E2E8F0;
}
.dso-head-title { font-size: 13px; font-weight: 600; color: #0F172A; }
.dso-edit-toggle {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px; border: 1.5px solid #E2E8F0;
  font-size: 12px; font-weight: 500; color: #374151; background: #F8FAFC;
  cursor: pointer; transition: all 0.15s;
}
.dso-edit-toggle:hover { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }

.dso-view-row {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 7px;
}
.dso-view-label {
  font-size: 11px; color: #94A3B8; width: 110px; flex-shrink: 0; font-weight: 500;
}
.dso-view-val {
  font-size: 13px; color: #0F172A; font-weight: 500;
}
.dso-view-empty { color: #CBD5E1; font-weight: 400; font-style: italic; }
.dso-view-col { display: flex; flex-direction: column; gap: 3px; margin-bottom: 7px; }
.dso-view-text {
  margin: 0; font-size: 12px; color: #374151; background: #F8FAFC;
  border-radius: 6px; padding: 6px 8px; line-height: 1.5;
}

.dso-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

.dso-section {}
.dso-section-title {
  display: flex; align-items: center; gap: 5px; margin: 0 0 12px;
  font-size: 11px; font-weight: 700; color: #27C8D8; text-transform: uppercase; letter-spacing: 0.5px;
}

.dso-field-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.dso-field-row label { font-size: 11px; color: #64748B; width: 110px; flex-shrink: 0; }
.dso-field-col { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.dso-field-col label { font-size: 11px; color: #64748B; }

.dso-input, .dso-select {
  flex: 1; height: 30px; padding: 0 8px; border: 1.5px solid #E2E8F0;
  border-radius: 6px; font-size: 12px; font-family: 'Inter', sans-serif;
  color: #0F172A; background: #fff; outline: none; transition: border-color 0.15s;
  box-sizing: border-box; width: 100%;
}
select.dso-select {
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 8px center; padding-right: 26px;
}
.dso-input:focus, .dso-select:focus { border-color: #27C8D8; }
.dso-input::placeholder { color: #94A3B8; }
.dso-textarea {
  width: 100%; padding: 6px 8px; border: 1.5px solid #E2E8F0; border-radius: 6px;
  font-size: 12px; font-family: 'Inter', sans-serif; color: #0F172A;
  background: #fff; outline: none; resize: vertical; transition: border-color 0.15s; box-sizing: border-box;
}
.dso-textarea:focus { border-color: #27C8D8; }

.dso-saving { font-size: 11px; color: #64748B; margin-top: 8px; }
.dso-save-err {
  font-size: 11px; color: #991B1B; background: #FEF2F2; padding: 3px 8px;
  border-radius: 6px; margin-top: 8px;
}
.dso-saved {
  display: inline-flex; align-items: center; gap: 4px; font-size: 11px;
  color: #166534; background: #F0FDF4; padding: 3px 8px; border-radius: 6px; margin-top: 8px;
}

/* Pagination */
.adm-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-top: 1.5px solid #E2E8F0;
}
.adm-pag-info { font-size: 12px; color: #64748B; }
.adm-pag-btns { display: flex; gap: 4px; }
.adm-pag-btn {
  min-width: 32px; height: 32px; padding: 0 8px; border: 1.5px solid #E2E8F0;
  border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer;
  color: #374151; transition: all 0.15s;
}
.adm-pag-btn:hover:not(:disabled) { border-color: #27C8D8; color: #27C8D8; }
.adm-pag-btn.active { background: #27C8D8; color: #fff; border-color: #27C8D8; }
.adm-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 900px) {
  .dso-grid { grid-template-columns: 1fr; }
}

/* ── Event detail drawer ─────────────────────────────────── */

.evt-backdrop {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(15, 23, 42, 0.35);
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.evt-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 950;
  width: 520px; max-width: 100vw;
  background: #fff;
  box-shadow: -4px 0 40px rgba(39,200,216, 0.15);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Inter', sans-serif;
}
.evt-drawer-open { transform: translateX(0); }

/* Header */
.evt-hd {
  background: linear-gradient(135deg, #138E9C 0%, #27C8D8 100%);
  padding: 18px 20px 16px;
  flex-shrink: 0;
  position: relative;
}
.evt-hd-actions {
  position: absolute; top: 12px; right: 12px;
  display: flex; align-items: center; gap: 6px;
}
.evt-close {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(255,255,255,0.15); border: none;
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.evt-close:hover { background: rgba(255,255,255,0.28); }
.evt-copy-link {
  height: 30px; padding: 0 10px; border-radius: 8px;
  background: rgba(255,255,255,0.15); border: none;
  color: #fff; cursor: pointer; display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; transition: background 0.15s; white-space: nowrap;
}
.evt-copy-link:hover { background: rgba(255,255,255,0.28); }
.evt-hd-body { padding-right: 110px; }
.evt-hd-num { font-size: 11px; font-weight: 600; color: #8EEAF3; letter-spacing: 0.5px; margin-bottom: 4px; }
.evt-hd-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 4px; line-height: 1.35;
}
.evt-hd-meta { font-size: 12px; color: #A7EEF5; margin: 0 0 12px; }
.evt-hd-badges { display: flex; flex-wrap: wrap; gap: 6px; }

/* Scrollable body */
.evt-body { flex: 1; overflow-y: auto; padding: 0 0 16px; }

/* Section */
.evt-sec {
  padding: 16px 20px;
  border-bottom: 1px solid #F1F5F9;
}
.evt-sec-last { border-bottom: none; }
.evt-sec-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.evt-sec-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: #27C8D8;
  text-transform: uppercase; letter-spacing: 0.6px;
  margin: 0 0 12px;
}
.evt-sec-head .evt-sec-title { margin-bottom: 0; }

/* Edit button */
.evt-edit-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 6px; border: 1.5px solid #E2E8F0;
  font-size: 11px; font-weight: 500; color: #374151; background: #F8FAFC;
  cursor: pointer; transition: all 0.13s; flex-shrink: 0;
}
.evt-edit-btn:hover { border-color: #27C8D8; color: #27C8D8; background: #E0F9FA; }

/* Ejecución */
.evt-ejec-pct-tag {
  font-size: 12px; font-weight: 700; color: #27C8D8;
  background: #E0F9FA; padding: 2px 8px; border-radius: 99px;
}
.evt-ejec-pct-tag.ejec-done { background: #F0FDF4; color: #16A34A; }
.evt-ejec-bar-wrap {
  height: 6px; background: #E2E8F0; border-radius: 99px;
  overflow: hidden; margin-bottom: 12px;
}
.evt-ejec-fill { height: 100%; background: #27C8D8; border-radius: 99px; transition: width 0.3s; }
.evt-ejec-full { background: #16A34A; }
.evt-flags-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.evt-flag {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
}
.evt-flag-on  { background: #F0FDF4; color: #166534; }
.evt-flag-off { background: #F8FAFC; color: #94A3B8; border: 1px solid #E2E8F0; }

/* Key-value grid */
.evt-kv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
.evt-kv { display: flex; flex-direction: column; gap: 2px; }
.evt-k { font-size: 10px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; }
.evt-v { font-size: 13px; color: #0F172A; font-weight: 500; }
.evt-v-empty { color: #CBD5E1; font-style: italic; font-weight: 400; }
.evt-money { color: #0F172A; }

/* Observations */
.evt-obs-block { margin-bottom: 10px; }
.evt-obs-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; display: block; margin-bottom: 4px; }
.evt-obs-text { margin: 0; font-size: 12px; color: #374151; background: #F8FAFC; border-radius: 8px; padding: 8px 10px; line-height: 1.5; }

/* Client card */
.evt-cliente-card {
  display: flex; align-items: flex-start; gap: 10px;
  background: #F0F7FF; border-radius: 10px; padding: 10px 12px;
  border: 1.5px solid #A7EEF5;
}
.evt-cliente-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: #27C8D8; color: #fff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.evt-cliente-info { display: flex; flex-direction: column; gap: 2px; }
.evt-cliente-name { font-size: 14px; font-weight: 700; color: #0F172A; }
.evt-cliente-sub  { font-size: 11px; color: #64748B; }

/* Inline save feedback */
.evt-inline-save { margin-top: 8px; font-size: 11px; display: flex; align-items: center; gap: 6px; }

/* Edit form fields */
.evt-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.evt-info-fields { grid-template-columns: 1fr 1fr; }
.evt-fin-fields { grid-template-columns: 1fr 1fr; }
.evt-field { display: flex; flex-direction: column; gap: 5px; }
.evt-field-full { grid-column: 1 / -1; }
.evt-fl { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; }
.dso-select, .dso-input { width: 100%; }

/* Products */
.evt-items-loading { display: flex; flex-direction: column; gap: 6px; }
.evt-items-list { display: flex; flex-direction: column; gap: 4px; }
.evt-item-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; background: #F8FAFC; border-radius: 8px;
  font-size: 12px;
}
.evt-item-name { flex: 1; font-weight: 500; color: #0F172A; }
.evt-item-qty  { color: #64748B; white-space: nowrap; }
.evt-item-price { font-weight: 600; color: #27C8D8; white-space: nowrap; }
.evt-item-third { border-left: 3px solid #A78BFA; }
.evt-item-badge-tp {
  font-size: 9px; font-weight: 700; background: #EDE9FE; color: #6D28D9;
  padding: 1px 5px; border-radius: 4px; vertical-align: middle; margin-left: 4px;
}
.evt-empty-items { font-size: 12px; color: #94A3B8; font-style: italic; margin: 0; }

/* Save bar */
/* VAL ADM footer button */
.evt-val-footer {
  padding: 12px 20px; border-top: 1px solid #E2E8F0;
  background: #F8FAFC; flex-shrink: 0;
}
.evt-val-btn {
  width: 100%; padding: 11px 16px; border-radius: 10px; border: none;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.18s;
}
.evt-val-btn-ok {
  background: #27C8D8; color: #fff;
}
.evt-val-btn-ok:hover { background: #1BAEBB; }
.evt-val-btn-revert {
  background: #F0FDF4; color: #166534;
  border: 1.5px solid #BBF7D0;
}
.evt-val-btn-revert:hover { background: #DCFCE7; }

.evt-save-bar {
  padding: 8px 20px; border-top: 1px solid #E2E8F0;
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  font-size: 12px; background: #fff;
}
.evt-save-msg { color: #64748B; }
.evt-save-ok { display: inline-flex; align-items: center; gap: 4px; color: #166534; background: #F0FDF4; padding: 3px 8px; border-radius: 6px; }
.evt-save-err { color: #991B1B; background: #FEF2F2; padding: 3px 8px; border-radius: 6px; }

@media (max-width: 560px) {
  .evt-drawer { width: 100vw; }
  .evt-kv-grid, .evt-fields, .evt-fin-fields { grid-template-columns: 1fr; }
}

/* ── Documentos section ── */
.docs-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.docs-header-actions { display: flex; gap: 6px; align-items: center; }

.docs-refresh-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; background: #F1F5F9;
  border: 1px solid #E2E8F0; border-radius: 6px; cursor: pointer;
  color: #64748B; transition: background 0.15s;
}
.docs-refresh-btn:hover { background: #E2E8F0; }

.docs-zip-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: #fff;
  background: #27C8D8; border: none; border-radius: 6px;
  padding: 4px 10px; cursor: pointer; transition: background 0.15s;
}
.docs-zip-btn:hover:not(:disabled) { background: #138E9C; }
.docs-zip-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.docs-box {
  max-height: 160px; overflow-y: auto;
  border: 1px solid #E2E8F0; border-radius: 10px;
  background: #F8FAFC; padding: 6px;
  display: flex; flex-direction: column; gap: 4px;
}
.docs-box::-webkit-scrollbar { width: 4px; }
.docs-box::-webkit-scrollbar-track { background: transparent; }
.docs-box::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

.docs-empty {
  padding: 12px; text-align: center; font-size: 12px; color: #94A3B8;
}

.docs-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px; background: #fff;
  border: 1px solid #E2E8F0; border-radius: 7px;
  transition: background 0.1s; min-width: 0;
}
.docs-chip:hover { background: #E0F9FA; border-color: #A7EEF5; }

.docs-chip-tipo {
  font-size: 9px; font-weight: 700; color: #fff;
  background: #64748B; border-radius: 4px;
  padding: 1px 5px; white-space: nowrap; flex-shrink: 0; text-transform: uppercase;
}
.docs-chip-icon { color: #64748B; flex-shrink: 0; }
.docs-chip-label {
  font-size: 11px; font-weight: 500; color: #334155;
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.docs-chip-actions { display: flex; gap: 4px; flex-shrink: 0; margin-left: auto; }
.docs-chip-btn {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 5px; text-decoration: none;
  color: #475569; background: #F1F5F9; border: 1px solid #E2E8F0;
  transition: background 0.1s;
}
.docs-chip-btn:hover { background: #CCEFF2; color: #27C8D8; border-color: #A7EEF5; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* ── Searchable select ── */
.ss-wrap { position: relative; }
.ss-input { width: 100%; padding-right: 24px; }
.ss-clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  font-size: 11px; color: #94A3B8; cursor: pointer; line-height: 1;
}
.ss-clear:hover { color: #475569; }
.ss-dropdown {
  position: absolute; z-index: 200; top: calc(100% + 3px); left: 0; right: 0;
  background: #fff; border: 1.5px solid #E2E8F0; border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  overflow-y: auto; max-height: 220px;
}
.ss-option {
  padding: 7px 10px; font-size: 12px; color: #334155; cursor: pointer;
  transition: background 0.1s;
}
.ss-option:hover { background: #E0F9FA; }
.ss-option-active { background: #E0F9FA; font-weight: 600; color: #27C8D8; }
.ss-option-none { color: #94A3B8; font-style: italic; }
.ss-no-results { color: #94A3B8; font-style: italic; cursor: default; }
</style>
