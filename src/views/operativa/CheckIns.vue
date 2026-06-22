<template>
  <div class="chk-page">

    <!-- ══════════════════════════════════════════
         MODO: LISTA
    ══════════════════════════════════════════ -->
    <template v-if="view === 'list'">
      <div class="chk-header">
        <h1 class="chk-title">Check-ins</h1>
        <div class="chk-header-actions">
          <button class="chk-refresh-btn" :disabled="loading" @click="loadCheckins">
            <RefreshCw :size="16" :class="{ spin: loading }" />
          </button>
          <button class="chk-checklists-btn" @click="openChecklistsView">
            <ClipboardList :size="16" />
            Checklists
          </button>
          <button class="chk-new-btn" @click="openQuotationPicker">
            <Plus :size="16" />
            Nuevo check-in
          </button>
        </div>
      </div>

      <!-- Buscador -->
      <div class="chk-search-wrap">
        <Search :size="15" class="chk-search-icon" />
        <input
          v-model="search"
          class="chk-search"
          placeholder="Buscar por evento, dispositivo, coordinador..."
          type="search"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="chk-state">
        <div class="chk-spinner" />
        <span>Cargando check-ins...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="chk-error">
        <AlertCircle :size="18" />
        <span>{{ error }}</span>
        <button @click="loadCheckins">Reintentar</button>
      </div>

      <!-- Vacío -->
      <div v-else-if="filteredCheckins.length === 0" class="chk-state">
        <ClipboardList :size="40" color="#CBD5E1" />
        <p>{{ search ? 'Sin resultados' : 'Aún no hay check-ins registrados' }}</p>
      </div>

      <!-- Lista de tarjetas -->
      <div v-else class="chk-list">
        <div
          v-for="chk in filteredCheckins"
          :key="chk.id"
          class="chk-card-item"
          @click="goToDetail(chk.id)"
        >
          <div class="chk-card-main">
            <div class="chk-card-meta">
              <span class="chk-card-num">#{{ chk.numeroEvento }}</span>
              <span class="chk-card-name">{{ chk.nombreEvento || '—' }}</span>
            </div>
            <div class="chk-card-device">
              <Cpu :size="13" />
              {{ chk.nombreDispositivo || '—' }}
            </div>
            <div v-if="chk.quotation || chk.quotationId" class="chk-card-qt">
              <Building2 :size="11" />
              {{ chk.quotation?.empresa || `COT-${chk.quotation?.numero ?? chk.quotationId}` }}
            </div>
          </div>
          <div class="chk-card-right">
            <div class="chk-card-info">
              <span class="chk-card-coord">
                <User :size="12" />
                {{ chk.nombreCoordinador }}
              </span>
              <span class="chk-card-date">
                <Calendar :size="12" />
                {{ fmtDate(chk.fecha) }}
              </span>
            </div>
            <ChevronRight :size="16" class="chk-card-arrow" />
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════
         MODO: DETALLE DEL CHECK-IN
    ══════════════════════════════════════════ -->
    <template v-else-if="view === 'detail'">
      <div class="chk-header">
        <button class="chk-back-btn" @click="view = 'list'">
          <ArrowLeft :size="16" /> Volver
        </button>
        <h1 class="chk-title">
          {{ selected ? `#${selected.numeroEvento} · ${selected.nombreEvento}` : 'Detalle' }}
        </h1>
        <button v-if="selected" class="chk-flow-btn" @click="openFlow">
          <Play :size="14" /> Abrir flujo
        </button>
      </div>

      <div v-if="detailLoading" class="chk-state">
        <div class="chk-spinner" />
        <span>Cargando...</span>
      </div>

      <template v-else-if="selected">

        <!-- Banner cotización -->
        <div v-if="selected.quotation || selected.quotationId" class="chk-qt-banner">
          <Building2 :size="15" class="chk-qt-banner-icon" />
          <div class="chk-qt-banner-info">
            <span class="chk-qt-banner-tag">Cotización vinculada</span>
            <span class="chk-qt-banner-detail">
              {{ selected.quotation
                ? `COT-${selected.quotation.numero} · ${selected.quotation.empresa}`
                : `COT-${selected.quotationId}` }}
            </span>
          </div>
        </div>

        <!-- ── Datos generales ── -->
        <div class="chk-card">
          <div class="chk-section-header"><FileText :size="15" /> Datos generales</div>
          <div class="chk-detail-grid">
            <div class="chk-detail-field">
              <span class="chk-detail-label">Correo</span>
              <span class="chk-detail-val">{{ selected.correo || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Fecha</span>
              <span class="chk-detail-val">{{ fmtDate(selected.fecha) }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Coordinador</span>
              <span class="chk-detail-val">{{ selected.nombreCoordinador || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Dinamizador</span>
              <span class="chk-detail-val">{{ selected.nombreDinamizador || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Nombre del evento</span>
              <span class="chk-detail-val">{{ selected.nombreEvento || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Número de evento</span>
              <span class="chk-detail-val">{{ selected.numeroEvento ?? '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Dispositivo</span>
              <span class="chk-detail-val">{{ selected.nombreDispositivo || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- ── Datos del cliente ── -->
        <div class="chk-card">
          <div class="chk-section-header"><User :size="15" /> Datos del cliente</div>
          <div class="chk-detail-grid">
            <div class="chk-detail-field">
              <span class="chk-detail-label">Representante</span>
              <span class="chk-detail-val">{{ selected.nombreRepresentanteCliente || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Teléfono</span>
              <span class="chk-detail-val">{{ selected.telefonoCliente || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Cremalleras</span>
              <span class="chk-detail-val">{{ selected.cremalleras ?? '—' }}</span>
            </div>
          </div>
        </div>

        <!-- ── Lista de chequeo por juego (solo lectura) ── -->
        <div v-if="detailChecklistJuegos.length > 0" class="chk-card chk-checklist-section">
          <div class="chk-section-header"><ClipboardList :size="15" /> Lista de chequeo por juego</div>
          <div class="chk-juegos-grid">
            <div v-for="juego in detailChecklistJuegos" :key="juego.id" class="chk-juego-card chk-juego-card--readonly">
              <div class="chk-juego-header">
                <div class="chk-juego-icon">
                  <Package :size="14" />
                </div>
                <div class="chk-juego-meta">
                  <span class="chk-juego-name">{{ juego.nombre }}</span>
                  <span v-if="juego.qty > 1" class="chk-juego-qty">x{{ juego.qty }}</span>
                </div>
                <span class="chk-juego-required-badge">Requerido</span>
              </div>
              <div class="chk-puntos-list chk-puntos-readonly">
                <div v-for="asp in aspectosChecklist" :key="asp.id" class="chk-punto-row-ro">
                  <span class="chk-punto-ro-dot" />
                  <span class="chk-punto-ro-label">{{ asp.texto }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Aspectos de inspección ── -->
        <div v-if="selected.aspectosInspeccion?.length" class="chk-card">
          <div class="chk-section-header"><ClipboardList :size="15" /> Aspectos de inspección</div>
          <div class="chk-aspectos-list">
            <div class="chk-aspecto-row chk-aspecto-head">
              <span class="chk-aspecto-pregunta">Aspecto</span>
              <span class="chk-aspecto-resp-col">Respuesta</span>
            </div>
            <div
              v-for="(a, idx) in selected.aspectosInspeccion"
              :key="a.aspectoId ?? idx"
              class="chk-aspecto-row"
              :class="{ 'chk-aspecto-row-alt': idx % 2 === 1 }"
            >
              <span class="chk-aspecto-pregunta">{{ a.pregunta }}</span>
              <span
                class="chk-detail-resp-badge"
                :class="a.respuesta ? `resp-${a.respuesta.toLowerCase()}` : 'resp-nd'"
              >
                {{ RESPUESTA_LABEL[a.respuesta] ?? a.respuesta ?? '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Observaciones y anclajes ── -->
        <div class="chk-card">
          <div class="chk-section-header"><MessageSquare :size="15" /> Observaciones y anclajes</div>
          <div class="chk-detail-grid">
            <div class="chk-detail-field chk-field-full">
              <span class="chk-detail-label">Observaciones del dinamizador</span>
              <span class="chk-detail-val">{{ selected.observacionesDinamizador || '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Total puntos de anclaje</span>
              <span class="chk-detail-val">{{ selected.puntosAnclajeTotal ?? '—' }}</span>
            </div>
            <div class="chk-detail-field">
              <span class="chk-detail-label">Puntos sin anclar</span>
              <span class="chk-detail-val">{{ selected.puntosAnclajeSinAnclar ?? '—' }}</span>
            </div>
            <div class="chk-detail-field chk-field-full">
              <span class="chk-detail-label">Observaciones del cliente</span>
              <span class="chk-detail-val">{{ selected.observacionesCliente || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- ── Fotos de evidencia ── -->
        <div v-if="detailPhotoUrls.length" class="chk-card">
          <div class="chk-section-header"><Camera :size="15" /> Fotos de evidencia</div>
          <div class="chk-foto-grid">
            <div v-for="(url, i) in detailPhotoUrls" :key="i" class="chk-foto-preview-wrap">
              <img :src="url" class="chk-foto-preview" :alt="`Foto ${i + 1}`" />
            </div>
          </div>
        </div>

      </template>
    </template>

    <!-- ══════════════════════════════════════════
         MODO: CHECKLISTS POR EVENTO
    ══════════════════════════════════════════ -->
    <template v-else-if="view === 'checklists'">
      <!-- Header fijo tipo app móvil -->
      <div class="ckv-header">
        <button class="ckv-back" @click="view = 'list'">
          <ArrowLeft :size="18" />
        </button>
        <div class="ckv-header-text">
          <span class="ckv-header-title">Checklists</span>
          <span class="ckv-header-sub">por evento</span>
        </div>
        <div class="ckv-legend">
          <span class="ckv-dot ckv-dot--blue" />
          <span class="ckv-dot ckv-dot--green" />
          <span class="ckv-dot ckv-dot--gray" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="quotationsLoading" class="ckv-empty">
        <div class="chk-spinner" />
        <span>Cargando eventos...</span>
      </div>

      <!-- Vacío -->
      <div v-else-if="filteredApprovedQuotations.length === 0" class="ckv-empty">
        <ClipboardList :size="48" color="#CBD5E1" />
        <p>No hay eventos aprobados disponibles</p>
      </div>

      <!-- Lista de eventos -->
      <div v-else class="ckv-list">
        <div
          v-for="qt in filteredApprovedQuotations"
          :key="qt.id"
          class="ckv-card"
        >
          <!-- Cabecera del evento con barra de progreso -->
          <div class="ckv-card-header">
            <div class="ckv-card-info">
              <span class="ckv-card-num">COT-{{ qt.numero }}</span>
              <span class="ckv-card-empresa">{{ qt.empresa }}</span>
            </div>
            <div class="ckv-card-stats">
              <!-- Cuenta cuántos juegos con checklist están completos -->
              <span class="ckv-stat-done">
                {{ getAllJuegosForQt(qt).filter(j => j.requiereChecklist && isChecklistDone(j.id)).length }}
              </span>
              <span class="ckv-stat-sep">/</span>
              <span class="ckv-stat-total">
                {{ getAllJuegosForQt(qt).filter(j => j.requiereChecklist).length }}
              </span>
              <span class="ckv-stat-label">listos</span>
            </div>
          </div>

          <!-- Barra de progreso del evento -->
          <div class="ckv-evt-bar-bg">
            <div
              class="ckv-evt-bar-fill"
              :style="{
                width: getAllJuegosForQt(qt).filter(j => j.requiereChecklist).length > 0
                  ? (getAllJuegosForQt(qt).filter(j => j.requiereChecklist && isChecklistDone(j.id)).length /
                     getAllJuegosForQt(qt).filter(j => j.requiereChecklist).length * 100) + '%'
                  : '0%'
              }"
            />
          </div>

          <!-- Filas de juegos -->
          <div class="ckv-juegos">
            <div
              v-for="juego in getAllJuegosForQt(qt)"
              :key="juego.id"
              class="ckv-jrow"
              :class="{
                'ckv-jrow--blue':  juego.requiereChecklist && !isChecklistDone(juego.id),
                'ckv-jrow--green': juego.requiereChecklist && isChecklistDone(juego.id),
                'ckv-jrow--gray':  !juego.requiereChecklist,
              }"
            >
              <!-- Fila principal: toca para expandir -->
              <component
                :is="juego.requiereChecklist ? 'button' : 'div'"
                class="ckv-jrow-main"
                v-bind="juego.requiereChecklist ? { type: 'button' } : {}"
                @click="juego.requiereChecklist && toggleJuegoChecklist(juego.id)"
              >
                <!-- Icono de estado -->
                <div class="ckv-jrow-icon">
                  <Check v-if="juego.requiereChecklist && isChecklistDone(juego.id)" :size="16" stroke-width="3" />
                  <ClipboardList v-else-if="juego.requiereChecklist" :size="16" />
                  <Package v-else :size="16" />
                </div>

                <!-- Nombre del juego -->
                <div class="ckv-jrow-body">
                  <span class="ckv-jrow-nombre">{{ juego.nombre }}</span>
                  <span v-if="juego.qty > 1" class="ckv-jrow-qty">× {{ juego.qty }} unidades</span>
                </div>

                <!-- Estado / Progreso -->
                <div class="ckv-jrow-end">
                  <template v-if="juego.requiereChecklist">
                    <span
                      class="ckv-jrow-badge"
                      :class="isChecklistDone(juego.id) ? 'ckv-badge--green' : 'ckv-badge--blue'"
                    >
                      {{ isChecklistDone(juego.id)
                        ? 'Listo'
                        : `${getChecklistViewCount(juego.id)}/${aspectosChecklist.length}` }}
                    </span>
                    <ChevronRight
                      :size="16"
                      class="ckv-jrow-arrow"
                      :class="{ open: activeJuegoId === juego.id }"
                    />
                  </template>
                  <span v-else class="ckv-jrow-badge ckv-badge--gray">Sin lista</span>
                </div>
              </component>

              <!-- Minibarra de progreso del juego (solo si requiere) -->
              <div v-if="juego.requiereChecklist && !isChecklistDone(juego.id) && getChecklistViewCount(juego.id) > 0" class="ckv-jrow-minibar-bg">
                <div
                  class="ckv-jrow-minibar-fill"
                  :style="{ width: (getChecklistViewCount(juego.id) / aspectosChecklist.length * 100) + '%' }"
                />
              </div>

              <!-- Panel expandido del checklist -->
              <div
                v-if="juego.requiereChecklist && activeJuegoId === juego.id"
                class="ckv-panel"
              >
                <div class="ckv-panel-header">
                  <ClipboardList :size="14" />
                  Aspectos a inspeccionar
                  <span class="ckv-panel-count">
                    {{ getChecklistViewCount(juego.id) }}/{{ aspectosChecklist.length }}
                  </span>
                </div>

                <label
                  v-for="(asp, idx) in aspectosChecklist"
                  :key="asp.id"
                  class="ckv-item"
                  :class="{ 'ckv-item--checked': checklistViewState[juego.id]?.[idx] }"
                >
                  <span class="ckv-item-cb-wrap">
                    <input
                      type="checkbox"
                      :checked="checklistViewState[juego.id]?.[idx]"
                      @change="setChecklistPoint(juego.id, idx, $event.target.checked)"
                      class="ckv-item-native"
                    />
                    <span class="ckv-item-cb" />
                  </span>
                  <span class="ckv-item-label">{{ asp.texto }}</span>
                  <Check v-if="checklistViewState[juego.id]?.[idx]" :size="14" class="ckv-item-check-icon" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Espacio seguro al final para móvil -->
      <div class="ckv-safe-bottom" />
    </template>

    <!-- ══════════════════════════════════════════
         MODO: SELECTOR DE COTIZACIÓN
    ══════════════════════════════════════════ -->
    <template v-else-if="view === 'picker'">
      <div class="chk-header">
        <button class="chk-back-btn" @click="view = 'list'">
          <ArrowLeft :size="16" /> Volver
        </button>
        <h1 class="chk-title">Seleccionar cotización</h1>
      </div>

      <div class="chk-search-wrap">
        <Search :size="15" class="chk-search-icon" />
        <input
          v-model="quotationSearch"
          class="chk-search"
          placeholder="Buscar por empresa, número o cliente..."
          type="search"
          autofocus
        />
      </div>

      <div v-if="quotationsLoading" class="chk-state">
        <div class="chk-spinner" />
        <span>Cargando cotizaciones...</span>
      </div>

      <div v-else-if="filteredApprovedQuotations.length === 0" class="chk-state">
        <ClipboardList :size="40" color="#CBD5E1" />
        <p>{{ quotationSearch ? 'Sin resultados' : 'No hay cotizaciones aprobadas disponibles' }}</p>
      </div>

      <div v-else class="chk-list">
        <div
          v-for="qt in filteredApprovedQuotations"
          :key="qt.id"
          class="chk-qt-card"
          @click="selectQuotation(qt)"
        >
          <div class="chk-qt-card-main">
            <div class="chk-qt-num">COT-{{ qt.numero }}</div>
            <div class="chk-qt-company">{{ qt.empresa }}</div>
            <div v-if="qt.cliente?.name" class="chk-qt-client">
              <User :size="11" /> {{ qt.cliente.name }}
            </div>
          </div>
          <div class="chk-qt-card-right">
            <span class="chk-qt-status-badge">Aprobada</span>
            <span class="chk-qt-date">
              <Calendar :size="11" />
              {{ fmtDate(qt.fechaCotizacion) }}
            </span>
            <ChevronRight :size="16" class="chk-card-arrow" />
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════
         MODO: FORMULARIO
    ══════════════════════════════════════════ -->
    <template v-else-if="view === 'form'">
      <div class="chk-header">
        <button class="chk-back-btn" @click="selectedQuotation ? view = 'picker' : view = 'list'">
          <ArrowLeft :size="16" /> Volver
        </button>
        <h1 class="chk-title">Nuevo check-in</h1>
      </div>

      <!-- Banner de cotización vinculada -->
      <div v-if="selectedQuotation" class="chk-qt-banner">
        <Building2 :size="15" class="chk-qt-banner-icon" />
        <div class="chk-qt-banner-info">
          <span class="chk-qt-banner-tag">Cotización vinculada</span>
          <span class="chk-qt-banner-detail">
            COT-{{ selectedQuotation.numero }} · {{ selectedQuotation.empresa }}
          </span>
        </div>
        <button type="button" class="chk-qt-banner-change" @click="openQuotationPicker">
          Cambiar
        </button>
      </div>

      <form class="chk-form" @submit.prevent="submitForm">

        <!-- ── Sección 1: Datos generales ── -->
        <div class="chk-card">
          <div class="chk-section-header">
            <FileText :size="15" /> Datos generales
          </div>

          <div class="chk-field-grid">
            <div class="chk-field">
              <label class="chk-label">Correo <span class="chk-req">*</span></label>
              <input
                v-model="form.correo"
                type="email"
                class="chk-input"
                :class="{ 'chk-input-error': errors.correo }"
                placeholder="correo@ejemplo.com"
              />
              <span v-if="errors.correo" class="chk-error-msg">{{ errors.correo }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Fecha <span class="chk-req">*</span></label>
              <input
                v-model="form.fecha"
                type="date"
                class="chk-input"
                :class="{ 'chk-input-error': errors.fecha }"
              />
              <span v-if="errors.fecha" class="chk-error-msg">{{ errors.fecha }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Coordinador <span class="chk-req">*</span></label>
              <select
                v-model="form.nombreCoordinador"
                class="chk-select"
                :class="{ 'chk-input-error': errors.nombreCoordinador }"
                :disabled="coordsLoading"
              >
                <option value="" disabled>
                  {{ coordsLoading ? 'Cargando coordinadores...' : 'Seleccionar coordinador' }}
                </option>
                <option v-for="c in coordOptions" :key="c" :value="c">{{ c }}</option>
              </select>
              <span v-if="errors.nombreCoordinador" class="chk-error-msg">{{ errors.nombreCoordinador }}</span>
            </div>

            <div v-if="form.nombreCoordinador === 'Otro'" class="chk-field">
              <label class="chk-label">Otro coordinador <span class="chk-req">*</span></label>
              <input
                v-model="form.otroCoordinador"
                type="text"
                class="chk-input"
                :class="{ 'chk-input-error': errors.otroCoordinador }"
                placeholder="Nombre del coordinador"
              />
              <span v-if="errors.otroCoordinador" class="chk-error-msg">{{ errors.otroCoordinador }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Nombre del dinamizador <span class="chk-req">*</span></label>
              <input
                v-model="form.nombreDinamizador"
                type="text"
                class="chk-input"
                :class="{ 'chk-input-error': errors.nombreDinamizador }"
                placeholder="Nombre completo"
              />
              <span v-if="errors.nombreDinamizador" class="chk-error-msg">{{ errors.nombreDinamizador }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Nombre del evento <span class="chk-req">*</span></label>
              <input
                v-model="form.nombreEvento"
                type="text"
                class="chk-input"
                :class="{ 'chk-input-error': errors.nombreEvento }"
                placeholder="Nombre del evento"
              />
              <span v-if="errors.nombreEvento" class="chk-error-msg">{{ errors.nombreEvento }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Número de evento <span class="chk-req">*</span></label>
              <input
                v-model.number="form.numeroEvento"
                type="number"
                class="chk-input"
                :class="{ 'chk-input-error': errors.numeroEvento }"
                placeholder="0"
                min="0"
              />
              <span v-if="errors.numeroEvento" class="chk-error-msg">{{ errors.numeroEvento }}</span>
            </div>

            <!-- Selector de dispositivo con búsqueda -->
            <div class="chk-field">
              <label class="chk-label">Dispositivo <span class="chk-req">*</span></label>
              <button
                type="button"
                class="chk-device-btn"
                :class="{ 'chk-input-error': errors.nombreDispositivo }"
                @click="showDevicePicker = true"
              >
                <span :class="form.nombreDispositivo ? 'chk-device-selected' : 'chk-device-placeholder'">
                  {{ form.nombreDispositivo || 'Seleccionar dispositivo...' }}
                </span>
                <Search :size="14" />
              </button>
              <span v-if="errors.nombreDispositivo" class="chk-error-msg">{{ errors.nombreDispositivo }}</span>
            </div>
          </div>
        </div>

        <!-- ── Sección 2: Datos del cliente ── -->
        <div class="chk-card">
          <div class="chk-section-header">
            <User :size="15" /> Datos del cliente
          </div>

          <div class="chk-field-grid">
            <div class="chk-field">
              <label class="chk-label">Representante del cliente <span class="chk-req">*</span></label>
              <input
                v-model="form.nombreRepresentanteCliente"
                type="text"
                class="chk-input"
                :class="{ 'chk-input-error': errors.nombreRepresentanteCliente }"
                placeholder="Nombre del representante"
              />
              <span v-if="errors.nombreRepresentanteCliente" class="chk-error-msg">{{ errors.nombreRepresentanteCliente }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Teléfono del cliente <span class="chk-req">*</span></label>
              <input
                v-model="form.telefonoCliente"
                type="text"
                class="chk-input"
                :class="{ 'chk-input-error': errors.telefonoCliente }"
                placeholder="Número de contacto"
              />
              <span v-if="errors.telefonoCliente" class="chk-error-msg">{{ errors.telefonoCliente }}</span>
            </div>

            <div class="chk-field">
              <label class="chk-label">Cremalleras</label>
              <input
                v-model.number="form.cremalleras"
                type="number"
                class="chk-input"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        <!-- ── Sección 3: Lista de chequeo por juego ── -->
        <div v-if="checklistJuegos.length > 0" class="chk-card chk-checklist-section">
          <div class="chk-section-header">
            <ClipboardList :size="15" /> Lista de chequeo por juego
          </div>

          <div class="chk-juegos-grid">
            <div
              v-for="juego in checklistJuegos"
              :key="juego.id"
              class="chk-juego-card"
              :class="{ 'chk-juego-card--done': isJuegoComplete(juego.id) }"
            >
              <!-- Cabecera del juego -->
              <div class="chk-juego-header">
                <div class="chk-juego-icon">
                  <Package :size="14" />
                </div>
                <div class="chk-juego-meta">
                  <span class="chk-juego-name">{{ juego.nombre }}</span>
                  <span v-if="juego.qty > 1" class="chk-juego-qty">x{{ juego.qty }}</span>
                </div>
                <span class="chk-juego-count" :class="{ done: isJuegoComplete(juego.id) }">
                  <Check v-if="isJuegoComplete(juego.id)" :size="11" stroke-width="3" />
                  <template v-else>{{ getCheckedCount(juego.id) }}/{{ aspectosChecklist.length }}</template>
                </span>
              </div>

              <!-- Barra de progreso -->
              <div class="chk-juego-bar-bg">
                <div
                  class="chk-juego-bar-fill"
                  :style="{ width: checklistProgress(juego.id) + '%' }"
                  :class="{ full: isJuegoComplete(juego.id) }"
                />
              </div>

              <!-- Puntos a verificar -->
              <div class="chk-puntos-list">
                <label
                  v-for="(asp, idx) in aspectosChecklist"
                  :key="asp.id"
                  class="chk-punto-row"
                  :class="{ checked: checklistItems[juego.id]?.[idx] }"
                >
                  <span class="chk-punto-cb-wrap">
                    <input
                      type="checkbox"
                      :checked="checklistItems[juego.id]?.[idx]"
                      @change="checklistItems[juego.id][idx] = $event.target.checked"
                      class="chk-punto-native-cb"
                    />
                    <span class="chk-punto-cb" />
                  </span>
                  <span class="chk-punto-label">{{ asp.texto }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Sección 4: Aspectos a inspeccionar ── -->
        <div class="chk-card">
          <div class="chk-section-header">
            <ClipboardList :size="15" /> Aspectos a inspeccionar
          </div>

          <!-- Skeleton mientras cargan los aspectos -->
          <div v-if="aspectosLoading" class="chk-aspectos-skeleton">
            <div v-for="n in 6" :key="n" class="chk-skeleton-row">
              <div class="chk-skeleton-text" />
              <div class="chk-skeleton-btns">
                <div class="chk-skeleton-btn" />
                <div class="chk-skeleton-btn" />
                <div class="chk-skeleton-btn" />
              </div>
            </div>
          </div>

          <div v-else-if="aspectosError" class="chk-aspectos-empty">
            <span>{{ aspectosError }}</span>
          </div>

          <div v-else-if="form.aspectosInspeccion.length === 0" class="chk-aspectos-empty">
            <span>No hay aspectos activos. Configúralos en el panel de administración.</span>
          </div>

          <div v-else class="chk-aspectos-list">
            <span v-if="errors.aspectos" class="chk-error-msg chk-aspectos-error">{{ errors.aspectos }}</span>
            <!-- Cabecera de columnas -->
            <div class="chk-aspecto-row chk-aspecto-head">
              <span class="chk-aspecto-pregunta">Aspecto</span>
              <div class="chk-aspecto-btns">
                <span>SI</span>
                <span>NO</span>
                <span>N/A</span>
              </div>
            </div>

            <div
              v-for="(aspecto, idx) in form.aspectosInspeccion"
              :key="aspecto.aspectoId"
              class="chk-aspecto-row"
              :class="{ 'chk-aspecto-row-alt': idx % 2 === 1, 'chk-aspecto-unanswered': errors.aspectos && aspecto.respuesta === null }"
            >
              <span class="chk-aspecto-pregunta">{{ aspecto.pregunta }}</span>
              <div class="chk-aspecto-btns">
                <button
                  v-for="resp in RESPUESTAS"
                  :key="resp"
                  type="button"
                  class="chk-resp-btn"
                  :class="{ active: aspecto.respuesta === resp, [`resp-${resp.toLowerCase()}`]: aspecto.respuesta === resp }"
                  @click="aspecto.respuesta = aspecto.respuesta === resp ? null : resp"
                >
                  {{ RESPUESTA_LABEL[resp] }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Sección 4: Observaciones y anclajes ── -->
        <div class="chk-card">
          <div class="chk-section-header">
            <MessageSquare :size="15" /> Observaciones y anclajes
          </div>

          <div class="chk-field-grid">
            <div class="chk-field chk-field-full">
              <label class="chk-label">Observaciones del dinamizador</label>
              <textarea
                v-model="form.observacionesDinamizador"
                class="chk-textarea"
                rows="3"
                placeholder="Escribe las observaciones del dinamizador..."
              />
            </div>

            <div class="chk-field">
              <label class="chk-label">Total de puntos de anclaje</label>
              <input
                v-model.number="form.puntosAnclajeTotal"
                type="number"
                class="chk-input"
                placeholder="0"
                min="0"
              />
            </div>

            <div class="chk-field">
              <label class="chk-label">Puntos sin anclar</label>
              <input
                v-model.number="form.puntosAnclajeSinAnclar"
                type="number"
                class="chk-input"
                placeholder="0"
                min="0"
              />
            </div>

            <div class="chk-field chk-field-full">
              <label class="chk-label">Observaciones del cliente</label>
              <textarea
                v-model="form.observacionesCliente"
                class="chk-textarea"
                rows="3"
                placeholder="Escribe las observaciones del cliente..."
              />
            </div>
          </div>
        </div>

        <!-- ── Sección 5: Fotos de evidencia ── -->
        <div class="chk-card">
          <div class="chk-section-header">
            <Camera :size="15" /> Fotos de evidencia
          </div>

          <div class="chk-foto-area">
            <div class="chk-foto-grid">
              <div v-for="(slot, idx) in fotoSlots" :key="idx" class="chk-foto-slot">
                <div v-if="slot.preview" class="chk-foto-preview-wrap">
                  <img :src="slot.preview" class="chk-foto-preview" alt="Preview" />
                  <button type="button" class="chk-foto-remove" @click="removeFoto(idx)">
                    <X :size="14" />
                  </button>
                </div>
                <label v-else class="chk-foto-drop">
                  <Camera :size="24" color="#94A3B8" />
                  <span class="chk-foto-label">Foto {{ idx + 1 }}</span>
                  <span class="chk-foto-hint">JPG o PNG · máx. 10 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    class="chk-foto-input"
                    @change="onFotoChange($event, idx)"
                  />
                </label>
              </div>

              <button type="button" class="chk-foto-add-btn" @click="addFotoSlot">
                <Plus :size="22" />
                <span>Agregar foto</span>
              </button>
            </div>
            <span v-if="errors.foto" class="chk-error-msg">{{ errors.foto }}</span>
          </div>
        </div>

        <!-- ── Error de envío ── -->
        <div v-if="submitError" class="chk-submit-error">
          <AlertCircle :size="16" />
          {{ submitError }}
        </div>

        <!-- ── Barra de progreso de upload ── -->
        <div v-if="uploadProgress !== null" class="chk-upload-wrap">
          <div class="chk-upload-bar" :style="{ width: uploadProgress + '%' }" />
          <span class="chk-upload-label">Subiendo {{ uploadProgress }}%</span>
        </div>

        <!-- ── Acciones ── -->
        <div class="chk-form-actions">
          <button type="button" class="chk-btn-cancel" @click="view = 'list'">
            Cancelar
          </button>
          <button type="submit" class="chk-btn-submit" :disabled="submitting">
            <Loader2 v-if="submitting" :size="16" class="spin" />
            <CheckCircle2 v-else-if="submitSuccess" :size="16" />
            <span v-if="submitting">Guardando...</span>
            <span v-else-if="submitSuccess">¡Guardado!</span>
            <span v-else>Guardar check-in</span>
          </button>
        </div>
      </form>
    </template>

    <!-- ══════════════════════════════════════════
         MODO: FLUJO DEL EVENTO
    ══════════════════════════════════════════ -->
    <template v-else-if="view === 'flow'">

      <!-- Botón volver compacto -->
      <div class="chk-header">
        <button class="chk-back-btn" @click="view = 'list'">
          <ArrowLeft :size="16" /> Volver
        </button>
      </div>

      <!-- Loading -->
      <div v-if="detailLoading" class="chk-state">
        <div class="chk-spinner" />
        <span>Cargando...</span>
      </div>

      <div v-else-if="selected" class="chk-flow-wrap">

        <!-- ── Panel superior oscuro ── -->
        <div class="chk-live-panel">
          <!-- Decoración de fondo -->
          <div class="chk-live-panel-glow" />

          <div class="chk-live-top">
            <div class="chk-live-event-info">
              <p class="chk-live-event-num">#{{ selected.numeroEvento }}</p>
              <h2 class="chk-live-event-name">{{ selected.nombreEvento }}</h2>
              <div class="chk-live-meta">
                <span><User :size="11" />{{ selected.nombreCoordinador }}</span>
                <span><Calendar :size="11" />{{ fmtDate(selected.fecha) }}</span>
                <span><Cpu :size="11" />{{ selected.nombreDispositivo }}</span>
              </div>
              <div v-if="selected.quotation || selected.quotationId" class="chk-live-qt-row">
                <Building2 :size="11" />
                <span>{{ selected.quotation?.empresa || selected.quotation?.numero ? `${selected.quotation.empresa} · COT-${selected.quotation.numero}` : `COT-${selected.quotationId}` }}</span>
              </div>
            </div>
            <div class="chk-live-badge">
              <span class="chk-live-dot" />
              EN VIVO
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="chk-live-progress">
            <div class="chk-live-progress-row">
              <span class="chk-live-progress-label">Progreso del evento</span>
              <span class="chk-live-progress-pct">{{ eventProgress }}%</span>
            </div>
            <div class="chk-live-bar">
              <div class="chk-live-fill" :style="{ width: eventProgress + '%' }" />
            </div>
            <!-- Marcadores de etapa -->
            <div class="chk-live-markers">
              <div
                v-for="(s, i) in FIXED_STAGES"
                :key="s.id"
                class="chk-live-marker"
                :class="stageStatuses[s.id]"
                :style="{ left: ((i + 1) / FIXED_STAGES.length * 100) + '%' }"
                :title="s.label"
              />
            </div>
          </div>
        </div>

        <!-- ── Timeline ── -->
        <div class="chk-live-timeline">

          <template v-for="(item, idx) in timelineItems" :key="item.id">

            <!-- ── Etapa fija ── -->
            <div v-if="item.type === 'stage'" class="chk-ln-row">
              <div class="chk-ln-axis">
                <div
                  class="chk-ln-num"
                  :class="stageStatuses[item.id]"
                  :style="stageStatuses[item.id] !== 'pending' ? { background: item.color } : {}"
                >
                  <Check v-if="stageStatuses[item.id] === 'done'" :size="18" />
                  <span v-else>{{ stageIndex(item.id) + 1 }}</span>
                </div>
                <div
                  v-if="idx < timelineItems.length - 1"
                  class="chk-ln-line"
                  :class="stageStatuses[item.id]"
                />
              </div>

              <div
                class="chk-ln-card"
                :class="stageStatuses[item.id]"
                :style="{ '--c': item.color }"
              >
                <!-- Cabecera -->
                <div class="chk-ln-card-top">
                  <div>
                    <span class="chk-ln-step">Paso {{ stageIndex(item.id) + 1 }} de {{ FIXED_STAGES.length }}</span>
                    <h3 class="chk-ln-title">{{ item.label }}</h3>
                  </div>
                  <span class="chk-ln-status" :class="stageStatuses[item.id]">
                    <template v-if="stageStatuses[item.id] === 'done'">
                      <Check :size="11" /> Completado
                    </template>
                    <template v-else-if="stageStatuses[item.id] === 'active'">
                      <span class="chk-ln-pulse" /> En curso
                    </template>
                    <template v-else>
                      Próximo
                    </template>
                  </span>
                </div>

                <!-- Contenido — solo si activo o completado -->
                <template v-if="stageStatuses[item.id] !== 'pending'">
                  <div class="chk-foto-grid">
                    <div v-for="(slot, si) in item.data.photos" :key="si" class="chk-foto-slot">
                      <div v-if="slot.preview" class="chk-foto-preview-wrap">
                        <img :src="slot.preview" class="chk-foto-preview" alt="Preview" />
                        <button type="button" class="chk-foto-remove" @click="removeStagePhoto(item.id, si)">
                          <X :size="14" />
                        </button>
                      </div>
                      <label v-else class="chk-foto-drop chk-foto-drop--sm">
                        <Camera :size="18" color="#94A3B8" />
                        <span class="chk-foto-label">Foto {{ si + 1 }}</span>
                        <input type="file" accept="image/jpeg,image/png" class="chk-foto-input" @change="onStagePhotoChange($event, item.id, si)" />
                      </label>
                    </div>
                    <button type="button" class="chk-foto-add-btn chk-foto-add-btn--sm" @click="addStagePhotoSlot(item.id)">
                      <Plus :size="15" />
                    </button>
                  </div>

                  <textarea
                    v-model="item.data.note"
                    class="chk-ln-note"
                    placeholder="Nota de este momento..."
                    rows="2"
                  />

                  <div v-if="stageStatuses[item.id] === 'active'" class="chk-ln-actions">
                    <button type="button" class="chk-ln-spont-btn" @click="addSpontaneous(item.id)">
                      <Zap :size="12" /> Momento espontáneo
                    </button>
                    <button type="button" class="chk-ln-complete-btn" @click="completeStage(item.id)">
                      <CheckCircle2 :size="14" /> Completar etapa
                    </button>
                  </div>
                </template>

                <!-- Estado bloqueado -->
                <div v-else class="chk-ln-locked">
                  <Lock :size="15" />
                  Disponible al completar la etapa anterior
                </div>
              </div>
            </div>

            <!-- ── Momento espontáneo ── -->
            <div v-else class="chk-ln-row chk-ln-row--spont">
              <div class="chk-ln-axis">
                <div class="chk-ln-spont-dot">
                  <Zap :size="10" color="#fff" />
                </div>
                <div v-if="idx < timelineItems.length - 1" class="chk-ln-line chk-ln-line--spont" />
              </div>

              <div class="chk-ln-spont-card">
                <div class="chk-ln-spont-top">
                  <span class="chk-ln-spont-label"><Zap :size="11" /> Momento capturado</span>
                  <button type="button" class="chk-ln-spont-del" @click="removeSpontaneous(item.id)">
                    <X :size="12" />
                  </button>
                </div>
                <div class="chk-foto-grid">
                  <div v-for="(slot, si) in item.photos" :key="si" class="chk-foto-slot">
                    <div v-if="slot.preview" class="chk-foto-preview-wrap">
                      <img :src="slot.preview" class="chk-foto-preview" alt="Preview" />
                      <button type="button" class="chk-foto-remove" @click="removeSpontPhoto(item.id, si)"><X :size="14" /></button>
                    </div>
                    <label v-else class="chk-foto-drop chk-foto-drop--sm">
                      <Camera :size="16" color="#94A3B8" />
                      <span class="chk-foto-label">Foto</span>
                      <input type="file" accept="image/jpeg,image/png" class="chk-foto-input" @change="onSpontPhotoChange($event, item.id, si)" />
                    </label>
                  </div>
                  <button type="button" class="chk-foto-add-btn chk-foto-add-btn--sm" @click="addSpontPhotoSlot(item.id)">
                    <Plus :size="14" />
                  </button>
                </div>
                <textarea v-model="item.note" class="chk-ln-note chk-ln-note--spont" placeholder="Nota..." rows="1" />
              </div>
            </div>

          </template>

        </div>

        <!-- FAB: captura en cualquier momento -->
        <button
          class="chk-flow-fab"
          type="button"
          :title="'Capturar momento en ' + (currentActiveStage?.label ?? 'etapa actual')"
          @click="addSpontaneous(currentActiveStage?.id ?? 'final')"
        >
          <Camera :size="22" />
        </button>

      </div>
    </template>

    <!-- ══════════════════════════════════════════
         MODAL: Selector de dispositivo
    ══════════════════════════════════════════ -->
    <ModalReutilizable :show="showDevicePicker" @close="showDevicePicker = false">
      <div class="chk-picker">
        <h3 class="chk-picker-title">Seleccionar dispositivo</h3>
        <div class="chk-picker-search-wrap">
          <Search :size="15" class="chk-picker-search-icon" />
          <input
            v-model="deviceSearch"
            class="chk-picker-search"
            placeholder="Buscar dispositivo..."
            autofocus
            type="search"
          />
        </div>
        <div class="chk-picker-list">
          <div v-if="filteredDevices.length === 0" class="chk-picker-empty">
            Sin resultados
          </div>
          <button
            v-for="dev in filteredDevices"
            :key="dev"
            type="button"
            class="chk-picker-item"
            :class="{ active: form.nombreDispositivo === dev }"
            @click="selectDevice(dev)"
          >
            <Cpu :size="14" />
            {{ dev }}
            <Check v-if="form.nombreDispositivo === dev" :size="14" class="chk-picker-check" />
          </button>
        </div>
      </div>
    </ModalReutilizable>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import {
  RefreshCw, Search, AlertCircle, ClipboardList, Plus, ChevronRight,
  User, Calendar, Cpu, ArrowLeft, FileText, MessageSquare, Camera,
  X, Loader2, CheckCircle2, Check, Package,
  Play, Clock, Timer, Flag, Zap, Lock, Building2,
} from 'lucide-vue-next'
import ModalReutilizable from '../../components/modal/ModalReutilizable.vue'
import {
  COORDINADORES, DISPOSITIVOS,
  RESPUESTAS, RESPUESTA_LABEL, RESPUESTA_COLOR,
} from '../../constants/checkin.constants.js'
import { getCheckins, getCheckinById, createCheckin } from '../../services/checkins.service.js'
import { getAspectos } from '../../services/aspectos.service.js'
import { getQuotations, getQuotationById, getCoordinadores, patchQuotation } from '../../services/quotation.service.ts'

// ─── Estado global de la vista ───────────────────────────────────────────────
const view = ref('list') // 'list' | 'picker' | 'form' | 'flow'

// ─── Cotización vinculada ─────────────────────────────────────────────────────
const quotations        = ref([])
const quotationsLoading = ref(false)
const quotationSearch   = ref('')
const selectedQuotation = ref(null)

const filteredApprovedQuotations = computed(() => {
  const approved = quotations.value.filter(q => q.quotationStatus?.name === 'Aprobada')
  if (!quotationSearch.value.trim()) return approved
  const q = quotationSearch.value.toLowerCase()
  return approved.filter(qt =>
    (qt.empresa || '').toLowerCase().includes(q) ||
    String(qt.numero || '').includes(q) ||
    (qt.cliente?.name || '').toLowerCase().includes(q)
  )
})

async function openQuotationPicker() {
  quotationSearch.value = ''
  view.value = 'picker'
  if (quotations.value.length) return
  quotationsLoading.value = true
  try {
    const res = await getQuotations()
    quotations.value = res.data ?? res
  } catch {
    // keep empty; user sees empty state
  } finally {
    quotationsLoading.value = false
  }
}

// ── Vista de checklists por evento ────────────────────────────
const STORAGE_KEY = 'be1_chk_v1'

const loadStoredState = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
const saveStoredState = (state) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* */ }
}

const checklistViewState = ref({})
const activeJuegoId      = ref(null)

const getAllJuegosForQt = (qt) => {
  const all = [...(qt.items ?? []), ...(qt.thirdPartyItems ?? [])]
  const seenIds = new Set()
  return all
    .map(i => ({
      id:               i.id,
      nombre:           i.product?.dispositivo || i.product?.nombre
                        || i.catalogProduct?.dispositivo || i.catalogProduct?.nombre || '—',
      qty:              i.cantidadProducto || i.cantidad || 1,
      requiereChecklist: !!i.requiereChecklist,
    }))
    .filter(j => { if (seenIds.has(j.id)) return false; seenIds.add(j.id); return true })
}

const ensureChecklistState = (juegoId) => {
  if (!checklistViewState.value[juegoId]) {
    checklistViewState.value = {
      ...checklistViewState.value,
      [juegoId]: aspectosChecklist.value.map(() => false),
    }
  }
}

const getChecklistViewCount = (juegoId) => {
  ensureChecklistState(juegoId)
  return (checklistViewState.value[juegoId] || []).filter(Boolean).length
}

const isChecklistDone = (juegoId) =>
  aspectosChecklist.value.length > 0 &&
  getChecklistViewCount(juegoId) === aspectosChecklist.value.length

const setChecklistPoint = (juegoId, idx, val) => {
  ensureChecklistState(juegoId)
  const copy = [...checklistViewState.value[juegoId]]
  copy[idx] = val
  checklistViewState.value = { ...checklistViewState.value, [juegoId]: copy }
  saveStoredState(checklistViewState.value)
}

const toggleJuegoChecklist = (juegoId) => {
  ensureChecklistState(juegoId)
  activeJuegoId.value = activeJuegoId.value === juegoId ? null : juegoId
}

async function openChecklistsView() {
  view.value          = 'checklists'
  activeJuegoId.value = null
  checklistViewState.value = loadStoredState()
  const loads = []
  if (!quotations.value.length) {
    quotationsLoading.value = true
    loads.push(
      getQuotations()
        .then(res => { quotations.value = res.data ?? res })
        .catch(() => {})
        .finally(() => { quotationsLoading.value = false })
    )
  }
  if (!aspectosChecklist.value.length) {
    loads.push(
      getAspectos()
        .then(data => { aspectosChecklist.value = data.map(a => ({ id: a.id, texto: a.texto })) })
        .catch(() => {})
    )
  }
  await Promise.all(loads)
}

// ─── Coordinadores y dispositivos del evento ─────────────────────────────────
const quotationCoordinadores = ref([])
const quotationDevices       = ref([])
const coordsLoading          = ref(false)

const coordOptions = computed(() =>
  quotationCoordinadores.value.length
    ? [...quotationCoordinadores.value, 'Otro']
    : COORDINADORES
)

const deviceList = computed(() =>
  quotationDevices.value.length ? quotationDevices.value : DISPOSITIVOS
)

async function loadQuotationCoordinadores(quotationId) {
  coordsLoading.value = true
  quotationCoordinadores.value = []
  try {
    const res = await getCoordinadores(quotationId)
    const data = Array.isArray(res.data) ? res.data : []
    quotationCoordinadores.value = data
      .map(c => c.user?.fullName || c.fullName || c.nombre || '')
      .filter(Boolean)
  } catch { /* silently */ } finally {
    coordsLoading.value = false
  }
}

async function loadQuotationDevices(quotationId) {
  quotationDevices.value = []
  checklistJuegos.value  = []
  checklistItems.value   = {}
  try {
    const res = await getQuotationById(quotationId)
    const qt  = res.data ?? res
    const all = [...(qt.items ?? []), ...(qt.thirdPartyItems ?? [])]
    const seen = new Set()
    quotationDevices.value = all
      .map(i => i.product?.dispositivo || i.product?.nombre || i.dispositivo || i.nombre)
      .filter(name => name && !seen.has(name) && seen.add(name))

    // Juegos que requieren lista de chequeo
    const seenChecklist = new Set()
    checklistJuegos.value = all
      .filter(i => i.requiereChecklist)
      .map(i => ({
        id:     i.id,
        nombre: i.product?.dispositivo || i.product?.nombre
                || i.catalogProduct?.dispositivo || i.catalogProduct?.nombre
                || i.dispositivo || i.nombre || '—',
        qty:    i.cantidadProducto || i.cantidad || 1,
      }))
      .filter(j => {
        if (seenChecklist.has(j.nombre)) return false
        seenChecklist.add(j.nombre)
        return true
      })

    // Inicializar estado de cada punto por juego
    for (const j of checklistJuegos.value) {
      checklistItems.value[j.id] = aspectosChecklist.value.map(() => false)
    }
  } catch { /* silently */ }
}

// ── Lista de chequeo por juego ────────────────────────────────
const aspectosChecklist = ref([])  // [{ id, texto }] — cargados dinámicamente

const checklistJuegos = ref([])
const checklistItems  = ref({})

const getCheckedCount   = (id) => (checklistItems.value[id] || []).filter(Boolean).length
const isJuegoComplete   = (id) => aspectosChecklist.value.length > 0 && getCheckedCount(id) === aspectosChecklist.value.length
const checklistProgress = (id) => aspectosChecklist.value.length
  ? Math.round((getCheckedCount(id) / aspectosChecklist.value.length) * 100)
  : 0

async function selectQuotation(qt) {
  selectedQuotation.value = qt
  Object.assign(form, initialForm())
  Object.keys(errors).forEach(k => delete errors[k])
  submitError.value   = null
  submitSuccess.value = false
  fotoSlots.value = INITIAL_SLOTS()
  form.nombreEvento   = qt.empresa   || ''
  form.numeroEvento   = qt.numero    ?? null
  form.fecha          = qt.fechaCotizacion
    ? qt.fechaCotizacion.split('T')[0]
    : new Date().toISOString().split('T')[0]
  form.nombreRepresentanteCliente = qt.cliente?.name || qt.contacto || ''
  view.value = 'form'
  await Promise.all([
    loadAspectos(),
    loadQuotationCoordinadores(qt.id),
    loadQuotationDevices(qt.id),
  ])
  // Auto-selección cuando hay un único valor disponible
  if (!form.nombreCoordinador && quotationCoordinadores.value.length === 1) {
    form.nombreCoordinador = quotationCoordinadores.value[0]
  }
  if (!form.nombreDispositivo && quotationDevices.value.length === 1) {
    form.nombreDispositivo = quotationDevices.value[0]
  }
}

// ─── Lista ───────────────────────────────────────────────────────────────────
const checkins = ref([])
const loading  = ref(false)
const error    = ref(null)
const search   = ref('')

const filteredCheckins = computed(() => {
  if (!search.value.trim()) return checkins.value
  const q = search.value.toLowerCase()
  return checkins.value.filter(c =>
    (c.nombreEvento     || '').toLowerCase().includes(q) ||
    (c.nombreDispositivo || '').toLowerCase().includes(q) ||
    (c.nombreCoordinador || '').toLowerCase().includes(q) ||
    String(c.numeroEvento  || '').includes(q)
  )
})

async function loadCheckins() {
  loading.value = true
  error.value   = null
  try {
    checkins.value = await getCheckins()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error cargando check-ins'
  } finally {
    loading.value = false
  }
}

// ─── Flujo del evento ────────────────────────────────────────────────────────
const selected               = ref(null)
const detailLoading          = ref(false)
const detailChecklistJuegos  = ref([])   // juegos con requiereChecklist en la cotización del detalle

const FIXED_STAGES = [
  { id: 'inicio',  label: 'Inicio del evento',    color: '#16A34A', iconComp: Play  },
  { id: 'despues', label: 'Después de un tiempo',  color: '#0284C7', iconComp: Clock },
  { id: 'mitad',   label: 'Mitad del evento',       color: '#D97706', iconComp: Timer },
  { id: 'final',   label: 'Final del evento',        color: '#7C3AED', iconComp: Flag  },
]

const emptySlot  = () => ({ file: null, preview: null })
const emptySlots = () => [emptySlot(), emptySlot(), emptySlot()]

const stageData = reactive({
  inicio:  { photos: emptySlots(), note: '' },
  despues: { photos: emptySlots(), note: '' },
  mitad:   { photos: emptySlots(), note: '' },
  final:   { photos: emptySlots(), note: '' },
})

const spontaneousItems = ref([])

// Estado de cada etapa: 'active' | 'done' | 'pending'
const stageStatuses = reactive({
  inicio:  'active',
  despues: 'pending',
  mitad:   'pending',
  final:   'pending',
})

const eventProgress = computed(() => {
  const done = FIXED_STAGES.filter(s => stageStatuses[s.id] === 'done').length
  return Math.round((done / FIXED_STAGES.length) * 100)
})

const currentActiveStage = computed(() =>
  FIXED_STAGES.find(s => stageStatuses[s.id] === 'active') ?? null
)

function stageIndex(stageId) {
  return FIXED_STAGES.findIndex(s => s.id === stageId)
}

async function completeStage(stageId) {
  stageStatuses[stageId] = 'done'
  const next = FIXED_STAGES[stageIndex(stageId) + 1]
  if (next) stageStatuses[next.id] = 'active'
  if (stageId === 'final') {
    const quotationId = selected.value?.quotation?.id ?? selected.value?.quotationId
    if (quotationId) {
      try { await patchQuotation(quotationId, { eventoFinalizado: true }) } catch { /* non-critical */ }
    }
  }
}

const timelineItems = computed(() => {
  const items = []
  for (const stage of FIXED_STAGES) {
    items.push({ type: 'stage', ...stage, data: stageData[stage.id] })
    spontaneousItems.value
      .filter(s => s.afterStageId === stage.id)
      .forEach(s => items.push({ type: 'spontaneous', iconComp: Zap, ...s }))
  }
  return items
})

function addSpontaneous(afterStageId) {
  spontaneousItems.value.push({
    id:           `spont-${spontaneousItems.value.length}-${afterStageId}`,
    afterStageId,
    photos:       [emptySlot()],
    note:         '',
  })
}

function removeSpontaneous(id) {
  spontaneousItems.value = spontaneousItems.value.filter(s => s.id !== id)
}

function validatePhoto(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return false
  if (file.size > 10 * 1024 * 1024) return false
  return true
}

function onStagePhotoChange(e, stageId, idx) {
  const file = e.target.files?.[0]
  if (!file || !validatePhoto(file)) return
  stageData[stageId].photos[idx] = { file, preview: URL.createObjectURL(file) }
}

function removeStagePhoto(stageId, idx) {
  stageData[stageId].photos[idx] = emptySlot()
}

function addStagePhotoSlot(stageId) {
  stageData[stageId].photos.push(emptySlot())
}

function onSpontPhotoChange(e, spontId, idx) {
  const file = e.target.files?.[0]
  if (!file || !validatePhoto(file)) return
  const item = spontaneousItems.value.find(s => s.id === spontId)
  if (item) item.photos[idx] = { file, preview: URL.createObjectURL(file) }
}

function removeSpontPhoto(spontId, idx) {
  const item = spontaneousItems.value.find(s => s.id === spontId)
  if (item) item.photos[idx] = emptySlot()
}

function addSpontPhotoSlot(spontId) {
  const item = spontaneousItems.value.find(s => s.id === spontId)
  if (item) item.photos.push(emptySlot())
}

async function goToFlow(id) {
  // Reiniciar estado del flujo
  for (const key of Object.keys(stageData)) {
    stageData[key].photos = emptySlots()
    stageData[key].note   = ''
  }
  spontaneousItems.value = []
  stageStatuses.inicio  = 'active'
  stageStatuses.despues = 'pending'
  stageStatuses.mitad   = 'pending'
  stageStatuses.final   = 'pending'

  view.value          = 'flow'
  detailLoading.value = true
  selected.value      = null
  try {
    selected.value = await getCheckinById(id)
    const rawUrls = selected.value.fotosUrl
      ?? (selected.value.fotoUrl ? [selected.value.fotoUrl] : [])
    const urls = Array.isArray(rawUrls) ? rawUrls : [rawUrls].filter(Boolean)
    urls.forEach((url, i) => {
      if (i < stageData.inicio.photos.length) {
        stageData.inicio.photos[i] = { file: null, preview: url }
      } else {
        stageData.inicio.photos.push({ file: null, preview: url })
      }
    })
  } catch {
    view.value = 'list'
  } finally {
    detailLoading.value = false
  }
}

async function goToDetail(id) {
  view.value               = 'detail'
  detailLoading.value      = true
  selected.value           = null
  detailChecklistJuegos.value = []
  try {
    selected.value = await getCheckinById(id)
    const quotationId = selected.value?.quotation?.id ?? selected.value?.quotationId
    if (quotationId) {
      try {
        const res = await getQuotationById(quotationId)
        const qt  = res.data ?? res
        const all = [...(qt.items ?? []), ...(qt.thirdPartyItems ?? [])]
        const seen = new Set()
        detailChecklistJuegos.value = all
          .filter(i => i.requiereChecklist)
          .map(i => ({
            id:     i.id,
            nombre: i.product?.dispositivo || i.product?.nombre
                    || i.catalogProduct?.dispositivo || i.catalogProduct?.nombre || '—',
            qty:    i.cantidadProducto || i.cantidad || 1,
          }))
          .filter(j => {
            if (seen.has(j.nombre)) return false
            seen.add(j.nombre)
            return true
          })
      } catch { /* silently */ }
    }
  } catch {
    view.value = 'list'
  } finally {
    detailLoading.value = false
  }
}

function openFlow() {
  for (const key of Object.keys(stageData)) {
    stageData[key].photos = emptySlots()
    stageData[key].note   = ''
  }
  spontaneousItems.value = []
  stageStatuses.inicio  = 'active'
  stageStatuses.despues = 'pending'
  stageStatuses.mitad   = 'pending'
  stageStatuses.final   = 'pending'

  const rawUrls = selected.value?.fotosUrl
    ?? (selected.value?.fotoUrl ? [selected.value.fotoUrl] : [])
  const urls = Array.isArray(rawUrls) ? rawUrls : [rawUrls].filter(Boolean)
  urls.forEach((url, i) => {
    if (i < stageData.inicio.photos.length) {
      stageData.inicio.photos[i] = { file: null, preview: url }
    } else {
      stageData.inicio.photos.push({ file: null, preview: url })
    }
  })

  view.value = 'flow'
}

const detailPhotoUrls = computed(() => {
  if (!selected.value) return []
  const raw = selected.value.fotosUrl
    ?? (selected.value.fotoUrl ? [selected.value.fotoUrl] : [])
  return (Array.isArray(raw) ? raw : [raw]).filter(Boolean)
})

// ─── Formulario ──────────────────────────────────────────────────────────────
const initialForm = () => ({
  quotationId:                 null,
  correo:                      '',
  fecha:                       new Date().toISOString().split('T')[0],
  nombreCoordinador:           '',
  otroCoordinador:             '',
  nombreDinamizador:           '',
  nombreEvento:                '',
  numeroEvento:                null,
  nombreDispositivo:           '',
  nombreRepresentanteCliente:  '',
  telefonoCliente:             '',
  cremalleras:                 null,
  aspectosInspeccion:          [],
  observacionesDinamizador:    '',
  puntosAnclajeTotal:          null,
  puntosAnclajeSinAnclar:      null,
  observacionesCliente:        '',
})

const aspectosLoading = ref(false)
const aspectosError   = ref(null)

async function loadAspectos() {
  aspectosLoading.value = true
  aspectosError.value   = null
  try {
    const data = await getAspectos()
    aspectosChecklist.value = data.map(a => ({ id: a.id, texto: a.texto }))
    form.aspectosInspeccion = data.map(a => ({
      aspectoId: a.id,
      pregunta:  a.texto,
      respuesta: null,
    }))
  } catch {
    aspectosError.value = 'Error al cargar aspectos. Intenta de nuevo.'
  } finally {
    aspectosLoading.value = false
  }
}

const form          = reactive(initialForm())
const errors        = reactive({})
const submitting    = ref(false)
const submitSuccess = ref(false)
const submitError   = ref(null)
const uploadProgress = ref(null)

// Fotos
const INITIAL_SLOTS = () => [
  { file: null, preview: null },
  { file: null, preview: null },
  { file: null, preview: null },
]
const fotoSlots = ref(INITIAL_SLOTS())

function onFotoChange(e, idx) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    errors.foto = 'Solo se aceptan imágenes JPG o PNG'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    errors.foto = 'La imagen no puede superar 10 MB'
    return
  }
  errors.foto = ''
  fotoSlots.value[idx].file    = file
  fotoSlots.value[idx].preview = URL.createObjectURL(file)
}

function removeFoto(idx) {
  fotoSlots.value[idx].file    = null
  fotoSlots.value[idx].preview = null
}

function addFotoSlot() {
  fotoSlots.value.push({ file: null, preview: null })
}

async function goToForm() {
  selectedQuotation.value      = null
  quotationCoordinadores.value = []
  quotationDevices.value       = []
  Object.assign(form, initialForm())
  Object.keys(errors).forEach(k => delete errors[k])
  submitError.value   = null
  submitSuccess.value = false
  fotoSlots.value = INITIAL_SLOTS()
  view.value = 'form'
  await loadAspectos()
}

// Validación
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let valid = true

  const req = (field, label) => {
    const val = form[field]
    if (!val && val !== 0) { errors[field] = `${label} es requerido`; valid = false }
  }

  req('correo',                     'El correo')
  req('fecha',                      'La fecha')
  req('nombreCoordinador',          'El coordinador')
  req('nombreDinamizador',          'El dinamizador')
  req('nombreEvento',               'El nombre del evento')
  req('numeroEvento',               'El número de evento')
  req('nombreDispositivo',          'El dispositivo')
  req('nombreRepresentanteCliente', 'El representante')
  req('telefonoCliente',            'El teléfono')

  if (form.nombreCoordinador === 'Otro' && !form.otroCoordinador) {
    errors.otroCoordinador = 'Especifica el coordinador'; valid = false
  }

  const unanswered = form.aspectosInspeccion.filter(a => a.respuesta === null)
  if (unanswered.length > 0) {
    errors.aspectos = `Todos los aspectos son obligatorios. Faltan ${unanswered.length} por responder.`
    valid = false
  }

  return valid
}

async function submitForm() {
  if (!validate()) return

  submitting.value    = true
  submitError.value   = null
  uploadProgress.value = null

  const payload = {
    ...(selectedQuotation.value?.id ? { quotationId: selectedQuotation.value.id } : {}),
    correo:                      form.correo,
    fecha:                       form.fecha,
    nombreCoordinador:           form.nombreCoordinador,
    otroCoordinador:             form.otroCoordinador || null,
    nombreDinamizador:           form.nombreDinamizador,
    nombreEvento:                form.nombreEvento,
    numeroEvento:                form.numeroEvento,
    nombreDispositivo:           form.nombreDispositivo,
    nombreRepresentanteCliente:  form.nombreRepresentanteCliente,
    telefonoCliente:             form.telefonoCliente,
    cremalleras:                 form.cremalleras,
    aspectosInspeccion:          form.aspectosInspeccion,
    observacionesDinamizador:    form.observacionesDinamizador || null,
    puntosAnclajeTotal:          form.puntosAnclajeTotal,
    puntosAnclajeSinAnclar:      form.puntosAnclajeSinAnclar,
    observacionesCliente:        form.observacionesCliente || null,
  }

  const fotos = fotoSlots.value.map(s => s.file).filter(Boolean)

  try {
    await createCheckin(payload, fotos, (pct) => {
      uploadProgress.value = pct
    })
    submitSuccess.value = true
    if (selectedQuotation.value?.id) {
      const fields = { encuesta: true, ...(fotos.length > 0 ? { registroFotografico: true } : {}) }
      try { await patchQuotation(selectedQuotation.value.id, fields) } catch { /* non-critical */ }
    }
    await loadCheckins()
    setTimeout(() => { view.value = 'list'; submitSuccess.value = false }, 1200)
  } catch (e) {
    submitError.value = e?.response?.data?.message || 'Error al guardar el check-in'
  } finally {
    submitting.value     = false
    uploadProgress.value = null
  }
}

// ─── Selector de dispositivo ──────────────────────────────────────────────────
const showDevicePicker = ref(false)
const deviceSearch     = ref('')

const filteredDevices = computed(() => {
  if (!deviceSearch.value.trim()) return deviceList.value
  const q = deviceSearch.value.toLowerCase()
  return deviceList.value.filter(d => d.toLowerCase().includes(q))
})

function selectDevice(dev) {
  form.nombreDispositivo = dev
  showDevicePicker.value = false
  deviceSearch.value     = ''
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Carga inicial
loadCheckins()
</script>

<style scoped>
.chk-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding-bottom: 40px;
  font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.chk-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chk-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  flex: 1;
}
.chk-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chk-refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #64748B;
  transition: background 0.15s;
}
.chk-refresh-btn:hover { background: #F8FAFC; }
.chk-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.chk-new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #054EAF;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s;
}
.chk-new-btn:hover { background: #03368A; }
.chk-back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
}
.chk-back-btn:hover { border-color: #054EAF; color: #054EAF; }

/* ── Search ── */
.chk-search-wrap {
  position: relative;
}
.chk-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.chk-search {
  width: 100%;
  padding: 9px 12px 9px 32px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
  background: #fff;
  transition: border-color 0.15s;
}
.chk-search:focus { border-color: #054EAF; }

/* ── Estados (loading / error / vacío) ── */
.chk-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: #94A3B8;
  font-size: 13px;
}
.chk-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #E2E8F0;
  border-top-color: #054EAF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.chk-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  color: #DC2626;
  font-size: 13px;
}
.chk-error button {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid #DC2626;
  border-radius: 6px;
  background: none;
  color: #DC2626;
  cursor: pointer;
  font-size: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Lista de tarjetas ── */
.chk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chk-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  gap: 16px;
}
.chk-card-item:hover {
  border-color: #054EAF;
  box-shadow: 0 2px 10px rgba(5,78,175,.08);
}
.chk-card-main { flex: 1; min-width: 0; }
.chk-card-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.chk-card-num {
  font-size: 11px;
  font-weight: 700;
  color: #054EAF;
  letter-spacing: 0.4px;
}
.chk-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chk-card-device {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}
.chk-card-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.chk-card-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}
.chk-card-coord, .chk-card-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748B;
}
.chk-card-arrow { color: #CBD5E1; }

/* ── Formulario y tarjetas ── */
.chk-form { display: flex; flex-direction: column; gap: 20px; }
.chk-card {
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  padding: 20px 24px;
}
.chk-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
}

/* ── Fields ── */
.chk-field-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 860px) {
  .chk-field-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .chk-field-grid { grid-template-columns: 1fr; }
}
.chk-field { display: flex; flex-direction: column; gap: 5px; }
.chk-field-full { grid-column: 1 / -1; }
.chk-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.chk-req { color: #EF4444; }
.chk-input, .chk-select {
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  background: #F8FAFC;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.chk-select { cursor: pointer; }
.chk-input:focus, .chk-select:focus { border-color: #054EAF; background: #fff; }
.chk-input-error { border-color: #EF4444 !important; }
.chk-error-msg { font-size: 11px; color: #EF4444; }
.chk-textarea {
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  background: #F8FAFC;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.5;
}
.chk-textarea:focus { border-color: #054EAF; background: #fff; }

/* ── Selector de dispositivo ── */
.chk-device-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background: #F8FAFC;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: border-color 0.15s;
  color: #94A3B8;
}
.chk-device-btn:hover { border-color: #054EAF; }
.chk-device-selected { color: #0F172A; }
.chk-device-placeholder { color: #94A3B8; }

/* ── Skeleton de aspectos ── */
.chk-aspectos-skeleton { display: flex; flex-direction: column; gap: 6px; padding: 4px 0; }
.chk-skeleton-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 6px 8px;
}
.chk-skeleton-text {
  flex: 1; height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: chk-shimmer 1.4s infinite;
}
.chk-skeleton-btns { display: flex; gap: 6px; flex-shrink: 0; }
.chk-skeleton-btn {
  width: 38px; height: 26px; border-radius: 6px;
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: chk-shimmer 1.4s infinite;
}
@keyframes chk-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Grilla de aspectos ── */
.chk-aspectos-error { display: block; margin-bottom: 8px; }
.chk-aspecto-unanswered { background: #FFF5F5 !important; }
.chk-aspectos-empty {
  font-size: 12px;
  color: #94A3B8;
  padding: 10px 4px;
  text-align: center;
}
.chk-aspectos-list { display: flex; flex-direction: column; }
.chk-aspecto-head {
  background: #F8FAFC;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.chk-aspecto-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 10px;
  border-bottom: 1px solid #F1F5F9;
  gap: 16px;
}
.chk-aspecto-row:last-child { border-bottom: none; }
.chk-aspecto-row-alt { background: #FAFBFC; }
.chk-aspecto-pregunta {
  font-size: 13px;
  color: #0F172A;
  flex: 1;
  line-height: 1.4;
}
.chk-aspecto-btns {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.chk-aspecto-head .chk-aspecto-btns span {
  width: 50px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
}
.chk-resp-btn {
  width: 50px;
  height: 34px;
  border-radius: 8px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.12s;
  font-family: 'Inter', sans-serif;
}
.chk-resp-btn:hover { border-color: #054EAF; color: #054EAF; }
.chk-resp-btn.active.resp-si        { background: #DCFCE7; border-color: #16A34A; color: #16A34A; }
.chk-resp-btn.active.resp-no        { background: #FEE2E2; border-color: #DC2626; color: #DC2626; }
.chk-resp-btn.active.resp-no_aplica { background: #F1F5F9; border-color: #64748B; color: #64748B; }

.chk-badge-resp {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

/* ── Fotos ── */
.chk-foto-area { display: flex; flex-direction: column; gap: 12px; }
.chk-foto-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}
.chk-foto-slot { flex-shrink: 0; }
.chk-foto-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 160px;
  height: 148px;
  border: 2px dashed #E2E8F0;
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.15s;
  background: #F8FAFC;
}
.chk-foto-drop:hover { border-color: #054EAF; }
.chk-foto-label { font-size: 13px; font-weight: 600; color: #64748B; }
.chk-foto-hint  { font-size: 11px; color: #94A3B8; text-align: center; padding: 0 8px; }
.chk-foto-input { display: none; }
.chk-foto-preview-wrap { position: relative; width: 160px; }
.chk-foto-preview {
  width: 160px;
  height: 148px;
  object-fit: cover;
  border-radius: 14px;
  border: 1.5px solid #E2E8F0;
  display: block;
}
.chk-foto-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(15,23,42,.6);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.chk-foto-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 160px;
  height: 148px;
  border: 2px dashed #CBD5E1;
  border-radius: 14px;
  cursor: pointer;
  background: #fff;
  color: #94A3B8;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
  flex-shrink: 0;
}
.chk-foto-add-btn:hover {
  border-color: #054EAF;
  color: #054EAF;
  background: #EFF6FF;
}
.chk-foto-placeholder {
  width: 160px;
  height: 148px;
  border-radius: 14px;
  border: 1.5px dashed #E2E8F0;
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #CBD5E1;
  font-size: 12px;
  font-weight: 500;
}

/* ── Upload progress ── */
.chk-upload-wrap {
  position: relative;
  height: 6px;
  background: #E2E8F0;
  border-radius: 99px;
  overflow: hidden;
}
.chk-upload-bar {
  height: 100%;
  background: #054EAF;
  border-radius: 99px;
  transition: width 0.2s ease;
}
.chk-upload-label {
  font-size: 11px;
  color: #64748B;
  margin-top: 4px;
  display: block;
}

/* ── Error de submit ── */
.chk-submit-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  font-size: 13px;
  color: #DC2626;
}

/* ── Acciones del form ── */
.chk-form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.chk-btn-cancel {
  padding: 11px 24px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
}
.chk-btn-cancel:hover { border-color: #94A3B8; }
.chk-btn-submit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 24px;
  border: none;
  border-radius: 10px;
  background: #054EAF;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s;
}
.chk-btn-submit:hover:not(:disabled) { background: #03368A; }
.chk-btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }

/* ── Detalle ── */
.chk-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 860px) {
  .chk-detail-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .chk-detail-grid { grid-template-columns: 1fr; }
}
.chk-detail-field { display: flex; flex-direction: column; gap: 3px; }
.chk-detail-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; }
.chk-detail-val   { font-size: 14px; color: #0F172A; line-height: 1.5; }

/* ── Modal picker ── */
.chk-picker { padding: 4px 0; }
.chk-picker-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 14px;
}
.chk-picker-search-wrap { position: relative; margin-bottom: 12px; }
.chk-picker-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.chk-picker-search {
  width: 100%;
  padding: 9px 12px 9px 32px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.chk-picker-search:focus { border-color: #054EAF; }
.chk-picker-list {
  max-height: 340px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chk-picker-empty { font-size: 13px; color: #94A3B8; text-align: center; padding: 20px; }
.chk-picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.chk-picker-item:hover { background: #F1F5F9; }
.chk-picker-item.active { background: #EEF4FF; color: #054EAF; font-weight: 600; }
.chk-picker-check { margin-left: auto; color: #054EAF; }

.spin { animation: spin 0.8s linear infinite; }

/* ══════════════════════════════════════════════════
   FLUJO DEL EVENTO — LIVE VIEW
══════════════════════════════════════════════════ */

.chk-flow-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 100px;
}

/* ── Panel superior oscuro ── */
.chk-live-panel {
  background: #0F172A;
  border-radius: 20px;
  padding: 24px 28px 20px;
  position: relative;
  overflow: hidden;
  color: #fff;
}
.chk-live-panel-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(5,78,175,.5) 0%, transparent 70%);
  pointer-events: none;
}
.chk-live-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
  gap: 16px;
}
.chk-live-event-num {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.5px;
  margin: 0 0 5px;
}
.chk-live-event-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 10px;
  line-height: 1.2;
}
.chk-live-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.chk-live-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748B;
}
/* Badge EN VIVO */
.chk-live-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.25);
  color: #FCA5A5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 7px 14px;
  border-radius: 20px;
  flex-shrink: 0;
  white-space: nowrap;
}
.chk-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
  animation: live-pulse 1.6s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,.6); }
  50%       { opacity: .7; box-shadow: 0 0 0 4px rgba(239,68,68,0); }
}

/* Barra de progreso */
.chk-live-progress { position: relative; }
.chk-live-progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.chk-live-progress-label { font-size: 11px; color: #475569; font-weight: 500; }
.chk-live-progress-pct   { font-size: 16px; font-weight: 800; color: #38BDF8; line-height: 1; }
.chk-live-bar {
  height: 6px;
  background: rgba(255,255,255,.08);
  border-radius: 99px;
  overflow: hidden;
  position: relative;
}
.chk-live-fill {
  height: 100%;
  background: linear-gradient(90deg, #054EAF 0%, #38BDF8 100%);
  border-radius: 99px;
  transition: width 0.5s cubic-bezier(.4,0,.2,1);
  position: relative;
}
.chk-live-fill::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38BDF8;
  box-shadow: 0 0 10px rgba(56,189,248,.9);
  animation: live-pulse 1.6s ease-in-out infinite;
}
.chk-live-markers {
  position: absolute;
  top: 26px;
  left: 0;
  right: 0;
  height: 6px;
  pointer-events: none;
}
.chk-live-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,.15);
  border: 1.5px solid rgba(255,255,255,.2);
  transition: all 0.4s;
}
.chk-live-marker.done   { background: #38BDF8; border-color: #38BDF8; box-shadow: 0 0 6px rgba(56,189,248,.6); }
.chk-live-marker.active { background: #fff; border-color: #fff; box-shadow: 0 0 8px rgba(255,255,255,.7); }

/* ── Timeline ── */
.chk-live-timeline {
  display: flex;
  flex-direction: column;
}

/* Fila de timeline (etapa o espontáneo) */
.chk-ln-row {
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.chk-ln-row--spont { }

/* Eje izquierdo: número + línea */
.chk-ln-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 44px;
}

/* Círculo numerado */
.chk-ln-num {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  transition: background 0.35s, box-shadow 0.35s;
  z-index: 1;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.chk-ln-num.active { box-shadow: 0 0 0 4px color-mix(in srgb, var(--c, #054EAF) 20%, transparent); }
.chk-ln-num.done   { }

/* Línea conectora */
.chk-ln-line {
  width: 3px;
  flex: 1;
  min-height: 20px;
  border-radius: 99px;
  margin: 4px 0;
  background: #E2E8F0;
  position: relative;
  overflow: hidden;
  transition: background 0.35s;
}
.chk-ln-line.done {
  background: #16A34A;
}
.chk-ln-line.active {
  background: linear-gradient(180deg, var(--c, #054EAF) 0%, #E2E8F0 100%);
}
.chk-ln-line.active::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  right: 0;
  height: 40%;
  background: rgba(255,255,255,.5);
  border-radius: 99px;
  animation: flow-line 1.8s linear infinite;
}
@keyframes flow-line {
  0%   { top: -40%; }
  100% { top: 120%; }
}
.chk-ln-line--spont {
  background: rgba(245,158,11,.25);
}

/* Dot espontáneo */
.chk-ln-spont-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #F59E0B;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(245,158,11,.4);
  margin: 7px;
}

/* ── Tarjeta de etapa ── */
.chk-ln-card {
  flex: 1;
  min-width: 0;
  border-radius: 16px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  padding: 18px 22px;
  margin-bottom: 8px;
  align-self: flex-start;
  transition: border-color 0.3s, box-shadow 0.3s, opacity 0.3s;
}
.chk-ln-card.done {
  background: #F0FDF4;
  border-color: #BBF7D0;
  opacity: 0.88;
}
.chk-ln-card.active {
  border-color: var(--c, #054EAF);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--c, #054EAF) 10%, transparent),
              0 4px 24px rgba(0,0,0,.06);
}
.chk-ln-card.pending {
  background: #FAFBFC;
  border-style: dashed;
  border-color: #D1D5DB;
  opacity: 0.65;
}

/* Cabecera de la tarjeta */
.chk-ln-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.chk-ln-step {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin-bottom: 4px;
}
.chk-ln-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}
.chk-ln-card.done    .chk-ln-title { color: #166534; }
.chk-ln-card.pending .chk-ln-title { color: #94A3B8; }

/* Badge de estado */
.chk-ln-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}
.chk-ln-status.done    { background: #DCFCE7; color: #15803D; }
.chk-ln-status.active  { background: #EFF6FF; color: #054EAF; }
.chk-ln-status.pending { background: #F1F5F9; color: #94A3B8; }

/* Pulso "En curso" */
.chk-ln-pulse {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #054EAF;
  animation: live-pulse 1.2s ease-in-out infinite;
}

/* Estado bloqueado */
.chk-ln-locked {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 2px;
  font-size: 13px;
  color: #CBD5E1;
}

/* Nota */
.chk-ln-note {
  width: 100%;
  margin-top: 14px;
  padding: 10px 13px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  background: #F8FAFC;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.15s;
}
.chk-ln-note:focus { border-color: #054EAF; background: #fff; }
.chk-ln-note::placeholder { color: #CBD5E1; }
.chk-ln-note--spont { margin-top: 10px; }

/* Botones de acción */
.chk-ln-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.chk-ln-spont-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: 1.5px solid #FDE68A;
  border-radius: 20px;
  background: #FFFBEB;
  color: #D97706;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.chk-ln-spont-btn:hover { background: #FEF3C7; }

.chk-ln-complete-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  background: var(--c, #054EAF);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 0.15s;
}
.chk-ln-complete-btn:hover { opacity: 0.85; }

/* ── Tarjeta espontánea ── */
.chk-ln-spont-card {
  flex: 1;
  min-width: 0;
  background: #FFFBEB;
  border: 1.5px solid #FDE68A;
  border-left: 4px solid #F59E0B;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  align-self: flex-start;
}
.chk-ln-spont-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.chk-ln-spont-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #D97706;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.chk-ln-spont-del {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #FEF3C7;
  color: #D97706;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.12s;
}
.chk-ln-spont-del:hover { background: #FDE68A; }

/* Tamaño reducido para fotos en el flujo */
.chk-foto-drop--sm {
  width: 120px !important;
  height: 108px !important;
}
.chk-foto-drop--sm .chk-foto-label { font-size: 12px; }
.chk-foto-add-btn--sm {
  width: 120px !important;
  height: 108px !important;
  font-size: 12px;
}

/* ── FAB de captura ── */
.chk-flow-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #054EAF;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(5,78,175,.5);
  z-index: 200;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}
.chk-flow-fab:hover {
  background: #03368A;
  transform: scale(1.07);
  box-shadow: 0 6px 32px rgba(5,78,175,.6);
}

/* ── Botón "Abrir flujo" ── */
.chk-flow-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #0F172A;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s;
  flex-shrink: 0;
}
.chk-flow-btn:hover { background: #1E293B; }

/* ── Badges de respuesta en el detalle ── */
.chk-aspecto-resp-col {
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  width: 90px;
  text-align: center;
  flex-shrink: 0;
}
.chk-detail-resp-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}
.chk-detail-resp-badge.resp-si        { background: #DCFCE7; color: #16A34A; }
.chk-detail-resp-badge.resp-no        { background: #FEE2E2; color: #DC2626; }
.chk-detail-resp-badge.resp-no_aplica { background: #F1F5F9; color: #64748B; }
.chk-detail-resp-badge.resp-nd        { background: #F1F5F9; color: #94A3B8; }

/* ══════════════════════════════════════════════════
   COTIZACIÓN — picker, banner, badges
══════════════════════════════════════════════════ */

/* Tarjetas en la vista picker */
.chk-qt-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  cursor: pointer;
  gap: 16px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.chk-qt-card:hover {
  border-color: #054EAF;
  box-shadow: 0 2px 10px rgba(5,78,175,.08);
}
.chk-qt-card-main { flex: 1; min-width: 0; }
.chk-qt-num {
  font-size: 11px;
  font-weight: 700;
  color: #054EAF;
  letter-spacing: 0.4px;
  margin-bottom: 3px;
}
.chk-qt-company {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}
.chk-qt-client {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}
.chk-qt-card-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.chk-qt-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  background: #DCFCE7;
  color: #15803D;
  white-space: nowrap;
}
.chk-qt-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748B;
  white-space: nowrap;
}

/* Banner en el formulario */
.chk-qt-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 12px;
}
.chk-qt-banner-icon { color: #054EAF; flex-shrink: 0; }
.chk-qt-banner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.chk-qt-banner-tag {
  font-size: 10px;
  font-weight: 700;
  color: #3B82F6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.chk-qt-banner-detail {
  font-size: 14px;
  font-weight: 600;
  color: #1D4ED8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chk-qt-banner-change {
  flex-shrink: 0;
  padding: 5px 12px;
  border: 1.5px solid #93C5FD;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #054EAF;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background 0.15s;
}
.chk-qt-banner-change:hover { background: #DBEAFE; }

/* Badge de cotización en tarjetas de la lista */
.chk-card-qt {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #3B82F6;
  margin-top: 4px;
}

/* Fila de cotización en el panel LIVE */
.chk-live-qt-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #38BDF8;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.06);
}

/* ════════════════════════════════════════════════
   LISTA DE CHEQUEO POR JUEGO
   ════════════════════════════════════════════════ */
.chk-checklist-section { background: #F8FAFC; }

.chk-juegos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

@media (max-width: 600px) {
  .chk-juegos-grid { grid-template-columns: 1fr; }
}

/* Tarjeta por juego */
.chk-juego-card {
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.chk-juego-card--done {
  border-color: #6EE7B7;
  background: #F0FDF4;
}

/* Cabecera */
.chk-juego-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chk-juego-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}

.chk-juego-card--done .chk-juego-icon {
  background: #D1FAE5;
  color: #059669;
}

.chk-juego-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.chk-juego-name {
  font-size: 13px;
  font-weight: 700;
  color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chk-juego-qty {
  font-size: 10px;
  font-weight: 600;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
}

.chk-juego-count {
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  font-family: 'Inter', sans-serif;
  background: #F1F5F9;
  border-radius: 99px;
  padding: 2px 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: background 0.2s, color 0.2s;
}

.chk-juego-count.done {
  background: #D1FAE5;
  color: #059669;
}

/* Barra de progreso */
.chk-juego-bar-bg {
  height: 4px;
  background: #E2E8F0;
  border-radius: 99px;
  overflow: hidden;
}

.chk-juego-bar-fill {
  height: 100%;
  background: #38BDF8;
  border-radius: 99px;
  transition: width 0.3s ease, background 0.3s;
}

.chk-juego-bar-fill.full {
  background: #10B981;
}

/* Puntos de verificación */
.chk-puntos-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chk-punto-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.chk-punto-row:hover { background: #F8FAFC; }
.chk-punto-row.checked { background: #F0FDF4; }

/* Checkbox custom */
.chk-punto-cb-wrap {
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.chk-punto-native-cb {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.chk-punto-cb {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid #CBD5E1;
  background: #fff;
  transition: border-color 0.18s, background 0.18s;
}

.chk-punto-native-cb:checked + .chk-punto-cb {
  background: #10B981;
  border-color: #10B981;
}

.chk-punto-native-cb:checked + .chk-punto-cb::after {
  content: '';
  display: block;
  width: 10px;
  height: 6px;
  border-left: 2.5px solid #fff;
  border-bottom: 2.5px solid #fff;
  transform: rotate(-45deg) translate(2px, 1px);
}

.chk-punto-label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  font-family: 'Inter', sans-serif;
  transition: color 0.15s, text-decoration 0.15s;
  line-height: 1.4;
}

.chk-punto-row.checked .chk-punto-label {
  color: #059669;
  text-decoration: line-through;
  text-decoration-color: #A7F3D0;
}

/* ── Detalle: solo lectura ── */
.chk-juego-card--readonly {
  background: #FAFAFA;
  cursor: default;
}

.chk-juego-required-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 99px;
  background: #EFF6FF;
  color: #1D4ED8;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
}

.chk-puntos-readonly { gap: 0; }

.chk-punto-row-ro {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 7px;
}

.chk-punto-row-ro:nth-child(even) { background: #F1F5F9; }

.chk-punto-ro-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #CBD5E1;
  flex-shrink: 0;
}

.chk-punto-ro-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  line-height: 1.4;
}

/* ════════════════════════════════════════════════
   VISTA: CHECKLISTS POR EVENTO
   ════════════════════════════════════════════════ */
.chk-checklists-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 9px;
  border: 1.5px solid #E2E8F0;
  background: #F8FAFC;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.chk-checklists-btn:hover { border-color: #6EE7B7; background: #F0FDF4; color: #059669; }

/* Lista de eventos */
/* ══════════════════════════════════════════════════════
   CHECKLIST VIEW — Mobile-first
══════════════════════════════════════════════════════ */

/* Header fijo */
.ckv-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #E2E8F0;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.ckv-back {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  color: #374151;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.ckv-back:hover { background: #F1F5F9; }

.ckv-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ckv-header-title {
  font-size: 17px; font-weight: 800; color: #0F1A2E;
  font-family: 'Inter', sans-serif; line-height: 1;
}
.ckv-header-sub {
  font-size: 11px; font-weight: 500; color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

/* Leyenda compacta en header */
.ckv-legend {
  display: flex; align-items: center; gap: 5px; flex-shrink: 0;
}
.ckv-dot {
  width: 9px; height: 9px; border-radius: 50%;
}
.ckv-dot--blue  { background: #3B82F6; }
.ckv-dot--green { background: #10B981; }
.ckv-dot--gray  { background: #CBD5E1; }

/* Estado vacío/cargando */
.ckv-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 64px 24px; color: #94A3B8;
  font-family: 'Inter', sans-serif; font-size: 14px; text-align: center;
}

/* Lista de eventos */
.ckv-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

/* Tarjeta de evento */
.ckv-card {
  border-radius: 16px;
  border: 1.5px solid #E2E8F0;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

/* Header de la tarjeta */
.ckv-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 10px;
  background: #F8FAFC;
}

.ckv-card-info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.ckv-card-num {
  font-size: 10px; font-weight: 700; color: #94A3B8;
  font-family: 'Inter', sans-serif; letter-spacing: 0.06em; text-transform: uppercase;
}
.ckv-card-empresa {
  font-size: 15px; font-weight: 800; color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Estadística de checklists completados */
.ckv-card-stats {
  display: flex; align-items: baseline; gap: 2px; flex-shrink: 0;
}
.ckv-stat-done {
  font-size: 20px; font-weight: 800; color: #10B981;
  font-family: 'Inter', sans-serif; line-height: 1;
}
.ckv-stat-sep {
  font-size: 14px; font-weight: 600; color: #CBD5E1;
  font-family: 'Inter', sans-serif;
}
.ckv-stat-total {
  font-size: 14px; font-weight: 700; color: #64748B;
  font-family: 'Inter', sans-serif;
}
.ckv-stat-label {
  font-size: 10px; font-weight: 600; color: #94A3B8;
  font-family: 'Inter', sans-serif; margin-left: 3px;
}

/* Barra de progreso del evento */
.ckv-evt-bar-bg {
  height: 4px; background: #E2E8F0;
}
.ckv-evt-bar-fill {
  height: 100%; background: #10B981;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 2px 2px 0;
}

/* Contenedor de juegos */
.ckv-juegos { display: flex; flex-direction: column; }

/* Fila de juego */
.ckv-jrow {
  border-bottom: 1px solid #F1F5F9;
  position: relative;
}
.ckv-jrow:last-child { border-bottom: none; }

/* Colores por estado */
.ckv-jrow--blue  { background: #fff; }
.ckv-jrow--green { background: #F0FDF4; }
.ckv-jrow--gray  { background: #FAFAFA; }

/* Botón / div principal del juego */
.ckv-jrow-main {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: default;
  -webkit-tap-highlight-color: transparent;
  min-height: 64px;
}
button.ckv-jrow-main {
  cursor: pointer;
  transition: background 0.12s;
}
button.ckv-jrow-main:active { background: rgba(0,0,0,0.03); }

/* Icono de estado circular */
.ckv-jrow-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.ckv-jrow--blue  .ckv-jrow-icon { background: #EFF6FF; color: #3B82F6; }
.ckv-jrow--green .ckv-jrow-icon { background: #D1FAE5; color: #059669; }
.ckv-jrow--gray  .ckv-jrow-icon { background: #F1F5F9; color: #CBD5E1; }

/* Cuerpo del texto */
.ckv-jrow-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.ckv-jrow-nombre {
  font-size: 14px; font-weight: 700; color: #0F1A2E;
  font-family: 'Inter', sans-serif;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ckv-jrow--gray .ckv-jrow-nombre { color: #94A3B8; }
.ckv-jrow-qty {
  font-size: 11px; font-weight: 500; color: #94A3B8;
  font-family: 'Inter', sans-serif;
}

/* Extremo derecho: badge + flecha */
.ckv-jrow-end {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}

.ckv-jrow-badge {
  font-size: 12px; font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
}
.ckv-badge--blue  { background: #EFF6FF; color: #1D4ED8; }
.ckv-badge--green { background: #D1FAE5; color: #059669; }
.ckv-badge--gray  { background: #F1F5F9; color: #94A3B8; }

.ckv-jrow-arrow {
  color: #CBD5E1;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s;
  flex-shrink: 0;
}
.ckv-jrow-arrow.open {
  transform: rotate(90deg);
  color: #10B981;
}

/* Minibarra de progreso del juego */
.ckv-jrow-minibar-bg {
  height: 3px;
  background: #E0E7FF;
  margin: 0 16px 8px;
  border-radius: 99px;
}
.ckv-jrow-minibar-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 99px;
  transition: width 0.3s ease;
}

/* Panel expandido del checklist */
.ckv-panel {
  border-top: 1.5px solid #EEF2FF;
  background: #FAFBFF;
  padding: 4px 12px 12px;
}

.ckv-panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 6px;
  font-size: 11px; font-weight: 700; color: #6366F1;
  font-family: 'Inter', sans-serif; letter-spacing: 0.03em;
  text-transform: uppercase;
}
.ckv-panel-count {
  margin-left: auto;
  font-size: 12px; font-weight: 700; color: #94A3B8;
  font-family: 'Inter', sans-serif; letter-spacing: 0;
  text-transform: none;
}

/* Item de checklist */
.ckv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 6px;
  min-height: 52px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s;
}
.ckv-item:active { background: rgba(0,0,0,0.03); }
.ckv-item--checked { background: #F0FDF4; }

/* Checkbox personalizado grande para móvil */
.ckv-item-cb-wrap {
  position: relative;
  width: 26px; height: 26px;
  flex-shrink: 0;
}
.ckv-item-native {
  position: absolute; opacity: 0; width: 0; height: 0;
}
.ckv-item-cb {
  display: block;
  width: 26px; height: 26px;
  border-radius: 8px;
  border: 2.5px solid #D1D5DB;
  background: #fff;
  transition: border-color 0.15s, background 0.15s;
}
.ckv-item-native:checked + .ckv-item-cb {
  background: #10B981;
  border-color: #10B981;
}
.ckv-item-native:checked + .ckv-item-cb::after {
  content: '';
  display: block;
  width: 13px; height: 7px;
  border-left: 3px solid #fff;
  border-bottom: 3px solid #fff;
  transform: rotate(-45deg) translate(3px, 1px);
}

/* Texto del aspecto */
.ckv-item-label {
  flex: 1;
  font-size: 14px; font-weight: 500; color: #374151;
  font-family: 'Inter', sans-serif; line-height: 1.4;
  transition: color 0.15s;
}
.ckv-item--checked .ckv-item-label {
  color: #059669;
}

/* Ícono check al final cuando está marcado */
.ckv-item-check-icon {
  color: #10B981;
  flex-shrink: 0;
}

/* Espacio seguro al final (notch móvil) */
.ckv-safe-bottom {
  height: calc(24px + env(safe-area-inset-bottom, 0px));
}
</style>
