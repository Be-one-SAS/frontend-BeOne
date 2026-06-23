<template>
  <div class="rpt-page">

    <!-- ═══════════════════════════════════════
         RESUMEN OPERATIVO
    ═══════════════════════════════════════ -->
    <section class="ops-section">
      <h2 class="ops-title">Resumen Operativo</h2>

      <div v-if="opsLoading" class="ops-loading">
        <div class="rpt-spinner sm" /><span>Cargando…</span>
      </div>

      <div v-else class="ops-grid">

        <!-- Tareas Pendientes -->
        <div class="ops-card ops-card--warn">
          <div class="ops-card-header">
            <span class="ops-icon">⏳</span>
            <span class="ops-label">Pendientes</span>
          </div>
          <div class="ops-val">{{ taskStats.pendiente }}</div>
          <div class="ops-sub">tareas sin iniciar</div>
          <div v-if="urgentTasks.length" class="ops-mini-list">
            <div v-for="t in urgentTasks.slice(0,3)" :key="t.id" class="ops-mini-item">
              <span class="ops-mini-dot warn" />
              <span class="ops-mini-text">{{ t.title ?? t.description ?? '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Tareas En Progreso -->
        <div class="ops-card ops-card--blue">
          <div class="ops-card-header">
            <span class="ops-icon">🔄</span>
            <span class="ops-label">En progreso</span>
          </div>
          <div class="ops-val">{{ taskStats.enProgreso }}</div>
          <div class="ops-sub">tareas activas</div>
          <div v-if="inProgressTasks.length" class="ops-mini-list">
            <div v-for="t in inProgressTasks.slice(0,3)" :key="t.id" class="ops-mini-item">
              <span class="ops-mini-dot blue" />
              <span class="ops-mini-text">{{ t.title ?? t.description ?? '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Tareas Completadas -->
        <div class="ops-card ops-card--green">
          <div class="ops-card-header">
            <span class="ops-icon">✅</span>
            <span class="ops-label">Completadas</span>
          </div>
          <div class="ops-val">{{ taskStats.completada }}</div>
          <div class="ops-sub">total finalizadas</div>
          <div class="ops-progress-bar">
            <div
              class="ops-progress-fill"
              :style="{ width: taskStats.total ? (taskStats.completada / taskStats.total * 100) + '%' : '0%' }"
            />
          </div>
          <div class="ops-sub" style="margin-top:4px">
            {{ taskStats.total ? Math.round(taskStats.completada / taskStats.total * 100) : 0 }}% del total
          </div>
        </div>

        <!-- Encuestas NPS -->
        <div class="ops-card ops-card--purple">
          <div class="ops-card-header">
            <span class="ops-icon">📊</span>
            <span class="ops-label">NPS Promedio</span>
          </div>
          <div class="ops-val" :class="npsClass(avgNps)">
            {{ avgNps !== null ? avgNps : '—' }}
            <span v-if="avgNps !== null" class="ops-val-unit">/10</span>
          </div>
          <div class="ops-sub">{{ totalRespuestas }} respuesta{{ totalRespuestas !== 1 ? 's' : '' }} · {{ encuestasActivas }} encuesta{{ encuestasActivas !== 1 ? 's' : '' }} activa{{ encuestasActivas !== 1 ? 's' : '' }}</div>
        </div>

      </div>
    </section>

    <!-- ═══════════════════════════════════════
         ENCUESTAS
    ═══════════════════════════════════════ -->
    <section class="enc-section">
      <div class="enc-section-header">
        <div>
          <h2 class="ops-title">Encuestas de Satisfacción</h2>
          <p class="rpt-sub">Gestión y seguimiento post-evento</p>
        </div>
        <span class="rpt-stat">
          <strong>{{ encuestas.length }}</strong> total ·
          <strong>{{ totalRespuestas }}</strong> respuesta{{ totalRespuestas !== 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="loading" class="rpt-loading">
        <div class="rpt-spinner" /><p>Cargando encuestas…</p>
      </div>

      <div v-else-if="!encuestas.length" class="rpt-empty">
        <ClipboardList :size="48" class="rpt-empty-icon" />
        <h3>Sin encuestas creadas</h3>
        <p>Las encuestas se generan desde la columna <strong>Enc.</strong> en el <a href="/admin/control">Control Operativo</a>.</p>
      </div>

      <div v-else class="rpt-grid">
        <div
          v-for="enc in encuestas" :key="enc.id"
          class="rpt-card"
          :class="{ 'rpt-card--inactive': !enc.activa }"
        >
          <div v-if="enc.imagen" class="rpt-card-cover" :style="{ backgroundImage: `url(${enc.imagen})` }" />

          <div class="rpt-card-body">
            <div class="rpt-card-header">
              <div class="rpt-card-info">
                <span class="rpt-card-num">#{{ enc.quotation?.numero }}</span>
                <span class="rpt-dot" />
                <span class="rpt-card-cliente">{{ enc.quotation?.cliente?.name ?? enc.quotation?.empresa ?? '—' }}</span>
              </div>
              <span class="rpt-badge" :class="enc.activa ? 'badge-active' : 'badge-inactive'">
                {{ enc.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </div>

            <p v-if="enc.titulo" class="rpt-card-titulo">{{ enc.titulo }}</p>

            <p v-if="enc.quotation?.operationWindow?.eventStartAt" class="rpt-card-date">
              <Calendar :size="11" />
              {{ formatDate(enc.quotation.operationWindow.eventStartAt) }}
            </p>

            <div class="rpt-card-meta">
              <span class="rpt-meta-item"><BarChart2 :size="11" />{{ enc._count?.respuestas ?? 0 }} resp.</span>
              <span class="rpt-meta-item"><ListChecks :size="11" />{{ enc.items?.length ?? 0 }} preg.</span>
            </div>

            <div class="rpt-card-actions">
              <button class="rpt-btn rpt-btn-primary" @click="openEditor(enc)">
                <Pencil :size="11" /> Editar
              </button>
              <button class="rpt-btn rpt-btn-secondary" @click="copyLink(enc)">
                <Check v-if="copiedId === enc.id" :size="11" /><Copy v-else :size="11" />
                {{ copiedId === enc.id ? 'Copiado' : 'Link' }}
              </button>
              <button v-if="enc._count?.respuestas > 0" class="rpt-btn rpt-btn-secondary" @click="openDetail(enc)">
                <Eye :size="11" /> Ver
              </button>
              <button class="rpt-btn rpt-btn-ghost" @click="handleToggle(enc)">
                <ToggleLeft v-if="enc.activa" :size="11" /><ToggleRight v-else :size="11" />
                {{ enc.activa ? 'Pausar' : 'Activar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>


    <!-- ═══════════════════════════════════════
         REGISTRO DE TURNO
    ═══════════════════════════════════════ -->
    <section class="rt-section">
      <div class="rt-section-header">
        <div>
          <h2 class="ops-title">Registro de Turno</h2>
          <p class="rpt-sub">Entrada, salida y notas del equipo logístico y operativo</p>
        </div>
        <div class="rt-header-actions">
          <!-- Selector de evento -->
          <select v-model="rtQuotationId" class="rt-select" @change="loadRegistros">
            <option :value="null" disabled>Seleccionar evento…</option>
            <option v-for="q in rtQuotations" :key="q.id" :value="q.id">
              #{{ q.numero }} — {{ q.cliente?.name ?? q.empresa ?? '—' }}
            </option>
          </select>
          <button v-if="rtQuotationId" class="rt-btn-link" :class="{ 'rt-btn-link--copied': rtLinkCopied }" @click="copyTurnoLink" :title="rtLinkCopied ? 'Link copiado' : 'Copiar link de turno'">
            <Check v-if="rtLinkCopied" :size="13" />
            <Copy v-else :size="13" />
            {{ rtLinkCopied ? 'Copiado' : 'Link turno' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="rtLoading" class="rpt-loading"><div class="rpt-spinner" /><p>Cargando registros…</p></div>

      <!-- Sin evento seleccionado -->
      <div v-else-if="!rtQuotationId" class="rt-empty">
        <ClockIcon :size="36" class="rt-empty-icon" />
        <p>Selecciona un evento para ver o registrar turnos</p>
      </div>

      <!-- Sin equipo logístico/operativo en el evento -->
      <div v-else-if="!rtRoster.length" class="rt-empty">
        <ClockIcon :size="36" class="rt-empty-icon" />
        <p>Este evento no tiene personal logístico u operativo asignado</p>
      </div>

      <!-- Tabla roster -->
      <div v-else class="rt-table-wrap">
        <table class="rt-table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rol</th>
              <th>Ingreso</th>
              <th>Salida</th>
              <th>Horas</th>
              <th>Notas</th>
              <th v-if="canManageTurnos"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rtRoster" :key="row.user.id" :class="{ 'rt-row--pending': !row.registro }">
              <td>
                <div class="rt-user-cell">
                  <div class="rt-avatar" :class="row.registro ? 'rt-avatar--active' : ''">{{ initials(row.user.fullName) }}</div>
                  <span>{{ row.user.fullName }}</span>
                </div>
              </td>
              <td><span class="rt-role-badge" :class="rtRoleClass(row.user.role)">{{ row.user.role }}</span></td>
              <td class="rt-time">
                <span v-if="row.registro?.horaIngreso">{{ formatTime(row.registro.horaIngreso) }}</span>
                <span v-else class="rt-pending-text">Aún no inicia</span>
              </td>
              <td class="rt-time">
                <span v-if="row.registro?.horaSalida">{{ formatTime(row.registro.horaSalida) }}</span>
                <span v-else class="rt-pending-text">—</span>
              </td>
              <td class="rt-hours">
                <span v-if="row.registro?.horaIngreso && row.registro?.horaSalida">{{ calcHours(row.registro.horaIngreso, row.registro.horaSalida) }}</span>
                <span v-else class="rt-pending-text">—</span>
              </td>
              <td class="rt-notas">{{ row.registro?.notas ?? '—' }}</td>
              <td v-if="canManageTurnos" class="rt-actions-cell">
                <button v-if="!row.registro" class="rt-btn-registrar" @click="openRtModalForUser(row.user)" title="Registrar turno">
                  <Plus :size="11" /> Registrar
                </button>
                <template v-else>
                  <button class="rt-action-btn" title="Editar" @click="openRtModal(row.registro)"><Pencil :size="12" /></button>
                  <button class="rt-action-btn rt-action-btn--danger" title="Eliminar" @click="confirmDeleteRegistro(row.registro)"><Trash2 :size="12" /></button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumen horas -->
      <div v-if="rtRoster.length && rtRegistros.length" class="rt-summary">
        <span>{{ rtRegistros.length }} de {{ rtRoster.length }} registrado{{ rtRegistros.length !== 1 ? 's' : '' }}</span>
        <span>·</span>
        <span>{{ rtTotalHoras }}h totales</span>
      </div>
    </section>

    <!-- Modal Registro de Turno -->
    <Transition name="modal-fade">
      <div v-if="rtModalOpen" class="rpt-modal-overlay" @click.self="closeRtModal">
        <div class="rpt-modal rt-modal">
          <div class="ed-modal-header">
            <h2 class="ed-modal-title">{{ rtEditing ? 'Editar turno' : 'Nuevo turno' }}</h2>
            <button class="ed-close" @click="closeRtModal">✕</button>
          </div>

          <div class="rt-form">
            <!-- Persona -->
            <div class="rt-form-group">
              <label class="rt-label">Persona <span class="rt-required">*</span></label>
              <select v-model="rtForm.userId" class="rt-input">
                <option :value="null" disabled>Seleccionar…</option>
                <option v-for="u in rtEligibleUsers" :key="u.id" :value="u.id">
                  {{ u.fullName }} — {{ u.role }}
                </option>
              </select>
            </div>

            <!-- Fecha -->
            <div class="rt-form-group">
              <label class="rt-label">Fecha <span class="rt-required">*</span></label>
              <input v-model="rtForm.fecha" type="date" class="rt-input" />
            </div>

            <!-- Ingreso / Salida -->
            <div class="rt-form-row">
              <div class="rt-form-group">
                <label class="rt-label">Hora de ingreso</label>
                <input v-model="rtForm.horaIngreso" type="time" class="rt-input" />
              </div>
              <div class="rt-form-group">
                <label class="rt-label">Hora de salida</label>
                <input v-model="rtForm.horaSalida" type="time" class="rt-input" />
              </div>
            </div>

            <!-- Preview horas -->
            <div v-if="rtForm.horaIngreso && rtForm.horaSalida" class="rt-hours-preview">
              <ClockIcon :size="12" />
              {{ calcHoursFromTimes(rtForm.horaIngreso, rtForm.horaSalida) }} horas de trabajo
            </div>

            <!-- Notas -->
            <div class="rt-form-group">
              <label class="rt-label">Notas</label>
              <textarea v-model="rtForm.notas" class="rt-input rt-textarea" rows="3" placeholder="Observaciones del turno…" />
            </div>

            <!-- Footer -->
            <div class="rt-form-footer">
              <button class="rpt-btn rpt-btn-ghost" @click="closeRtModal">Cancelar</button>
              <button class="rpt-btn rpt-btn-primary" :disabled="rtSaving || !rtForm.userId || !rtForm.fecha" @click="saveRegistro">
                <Loader2 v-if="rtSaving" :size="12" class="spin" />
                {{ rtEditing ? 'Guardar cambios' : 'Registrar turno' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ═══════════════════════════════════════
         MODAL EDITOR
    ═══════════════════════════════════════ -->
    <Transition name="modal-fade">
      <div v-if="editorEnc" class="rpt-modal-overlay" @click.self="closeEditor">
        <div class="rpt-modal ed-modal">

          <!-- Header fijo -->
          <div class="ed-modal-header">
            <div class="ed-modal-meta">
              <span class="ed-modal-tag">Encuesta #{{ editorEnc.id }}</span>
              <h2 class="ed-modal-title">{{ editorEnc.quotation?.cliente?.name ?? editorEnc.quotation?.empresa ?? '—' }}</h2>
              <p class="ed-modal-sub">Cotización #{{ editorEnc.quotation?.numero }}</p>
            </div>
            <button class="ed-close" @click="closeEditor">✕</button>
          </div>

          <!-- Tabs -->
          <div class="ed-tabs">
            <button
              v-for="tab in tabs" :key="tab.key"
              class="ed-tab" :class="{ 'ed-tab--active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >{{ tab.label }}</button>
          </div>

          <!-- ── Tab: Apariencia ── -->
          <div v-if="activeTab === 'apariencia'" class="ed-pane">

            <!-- Cover -->
            <div class="ed-field-group">
              <label class="ed-field-label">Imagen de portada</label>
              <div class="ed-cover-area">
                <div
                  class="ed-cover-preview"
                  :style="editorEnc.imagen ? { backgroundImage: `url(${editorEnc.imagen})` } : {}"
                  :class="{ 'ed-cover-empty': !editorEnc.imagen }"
                >
                  <template v-if="!editorEnc.imagen">
                    <ImageIcon :size="32" class="ed-cover-icon" />
                    <span class="ed-cover-hint">Sin imagen de portada</span>
                  </template>
                  <div v-if="uploadingImg" class="ed-cover-loader"><div class="rpt-spinner" /></div>
                </div>
                <div class="ed-cover-actions">
                  <label class="rpt-btn rpt-btn-secondary" style="cursor:pointer;">
                    <Upload :size="12" /> Subir imagen
                    <input type="file" accept="image/*" style="display:none" @change="handleImgUpload" />
                  </label>
                  <p class="ed-cover-tip">JPG, PNG o WebP · máx 10MB · se recorta a 1200×600</p>
                </div>
              </div>
            </div>

            <!-- Título -->
            <div class="ed-field-group">
              <label class="ed-field-label">Título de la encuesta</label>
              <input v-model="editorForm.titulo" class="ed-input" placeholder="Ej. Encuesta post-evento UMNG 2026" @blur="saveHeader" />
            </div>

            <!-- Descripción -->
            <div class="ed-field-group">
              <label class="ed-field-label">Descripción <span class="ed-optional">opcional</span></label>
              <textarea v-model="editorForm.descripcion" class="ed-textarea" rows="2" placeholder="Breve texto introductorio que verá el cliente al abrir el formulario" @blur="saveHeader" />
            </div>

          </div>

          <!-- ── Tab: Preguntas ── -->
          <div v-if="activeTab === 'preguntas'" class="ed-pane">

            <!-- Formulario agregar pregunta -->
            <div class="ed-add-form">
              <p class="ed-add-form-title">Añadir pregunta</p>
              <div class="ed-type-grid">
                <button
                  v-for="t in tipoOptions" :key="t.tipo"
                  class="ed-type-btn"
                  :class="[`ed-type-btn--${t.tipo.toLowerCase()}`, { 'ed-type-btn--active': addingTipo === t.tipo }]"
                  @click="selectTipo(t)"
                >
                  <span class="ed-type-icon">{{ t.icon }}</span>
                  <span class="ed-type-name">{{ t.name }}</span>
                  <span class="ed-type-desc">{{ t.desc }}</span>
                </button>
              </div>

              <Transition name="slide-down">
                <div v-if="addingTipo" class="ed-add-inline">
                  <div class="ed-add-inline-type">
                    <span class="ed-item-badge" :class="`badge-${addingTipo.toLowerCase()}`">{{ tipoOptions.find(t=>t.tipo===addingTipo)?.icon }}</span>
                    <span style="font-size:12px;font-weight:600;color:#0f1a2e;">{{ tipoOptions.find(t=>t.tipo===addingTipo)?.name }}</span>
                  </div>
                  <input
                    ref="addLabelRef"
                    v-model="addingLabel"
                    class="ed-input"
                    :placeholder="tipoOptions.find(t=>t.tipo===addingTipo)?.placeholder"
                    @keydown.enter="confirmAddItem"
                    @keydown.escape="cancelAdd"
                  />
                  <div class="ed-add-inline-actions">
                    <button class="rpt-btn rpt-btn-primary" :disabled="!addingLabel.trim()" @click="confirmAddItem">
                      <Plus :size="12" /> Agregar pregunta
                    </button>
                    <button class="rpt-btn rpt-btn-ghost" @click="cancelAdd">Cancelar</button>
                    <label class="ed-req-check">
                      <input type="checkbox" v-model="addingRequerida" />
                      <span>Requerida</span>
                    </label>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Lista de preguntas -->
            <div class="ed-items-container">
              <div class="ed-items-header">
                <span class="ed-field-label">Preguntas actuales</span>
                <span class="ed-items-badge">{{ editorEnc.items?.length ?? 0 }}</span>
              </div>

              <div v-if="!editorEnc.items?.length" class="ed-items-empty">
                <ListChecks :size="32" class="ed-items-empty-icon" />
                <p>Sin preguntas. Añade una arriba.</p>
              </div>

              <div v-else class="ed-items-list">
                <div
                  v-for="(item, idx) in editorEnc.items" :key="item.id"
                  class="ed-item-card"
                >
                  <div class="ed-item-left">
                    <span class="ed-item-badge" :class="`badge-${item.tipo.toLowerCase()}`">
                      {{ tipoOptions.find(t => t.tipo === item.tipo)?.icon ?? item.tipo }}
                    </span>
                    <input
                      v-model="item.label"
                      class="ed-item-label-input"
                      @blur="saveItem(item)"
                    />
                  </div>
                  <div class="ed-item-right">
                    <label class="ed-req-chip" :class="{ 'ed-req-chip--on': item.requerida }" :title="item.requerida ? 'Requerida' : 'Opcional'">
                      <input type="checkbox" :checked="item.requerida" style="display:none" @change="toggleRequerida(item)" />
                      {{ item.requerida ? 'Req.' : 'Opc.' }}
                    </label>
                    <button class="ed-ord" :disabled="idx === 0" @click="moveItem(idx, -1)">↑</button>
                    <button class="ed-ord" :disabled="idx === (editorEnc.items?.length ?? 0) - 1" @click="moveItem(idx, 1)">↓</button>
                    <button class="ed-del" @click="removeItem(item)" title="Eliminar pregunta">
                      <Trash2 :size="13" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer del modal -->
          <div class="ed-modal-footer">
            <div class="ed-link-row">
              <span class="ed-link-label">Link público:</span>
              <code class="ed-link-code">{{ encuestaUrl(editorEnc.token) }}</code>
              <button class="rpt-btn rpt-btn-secondary" @click="copyEditorLink">
                <Check v-if="editorCopied" :size="11" /><Copy v-else :size="11" />
                {{ editorCopied ? 'Copiado' : 'Copiar' }}
              </button>
            </div>
            <button class="rpt-btn rpt-btn-primary" @click="closeEditor">Guardar y cerrar</button>
          </div>

        </div>
      </div>
    </Transition>


    <!-- ═══════════════════════════════════════
         MODAL RESPUESTAS
    ═══════════════════════════════════════ -->
    <Transition name="modal-fade">
      <div v-if="detailEnc" class="rpt-modal-overlay" @click.self="detailEnc = null">
        <div class="rpt-modal">
          <div class="rpt-modal-header">
            <div>
              <h2 class="rpt-modal-title">Respuestas — #{{ detailEnc.quotation?.numero }}</h2>
              <p class="rpt-modal-sub">{{ detailEnc.quotation?.cliente?.name ?? detailEnc.quotation?.empresa }}</p>
            </div>
            <button class="ed-close" @click="detailEnc = null">✕</button>
          </div>

          <div v-if="detailLoading" class="rpt-modal-loading"><div class="rpt-spinner" /></div>

          <template v-else-if="detailData">
            <div v-if="detailSummary.length" class="rpt-summary-row">
              <div v-for="m in detailSummary" :key="m.label" class="rpt-summary-item">
                <span class="rpt-dsm-val" :class="npsClass(m.avg)">{{ m.avg }}</span>
                <span class="rpt-dsm-lbl">{{ m.label }}</span>
              </div>
            </div>

            <div class="rpt-resp-list">
              <div v-for="(r, i) in detailData.respuestas" :key="r.id" class="rpt-resp-item">
                <div class="rpt-resp-head">
                  <span class="rpt-resp-num">Respuesta #{{ i + 1 }}</span>
                  <span class="rpt-resp-date">{{ formatDateFull(r.respondidoEn) }}</span>
                </div>
                <div class="rpt-resp-body">
                  <div v-for="ir in r.itemRespuestas" :key="ir.id" class="rpt-resp-row">
                    <span class="rpt-resp-lbl">{{ ir.item?.label }}</span>
                    <span class="rpt-resp-val">
                      <span v-if="ir.item?.tipo === 'NPS'" :class="npsClass(ir.valorNumerico)">{{ ir.valorNumerico }}/10</span>
                      <span v-else-if="ir.item?.tipo === 'STARS'">{{ '★'.repeat(ir.valorNumerico ?? 0) }}{{ '☆'.repeat(5 - (ir.valorNumerico ?? 0)) }}</span>
                      <span v-else-if="ir.item?.tipo === 'YESNO'" :class="ir.valorBoolean ? 'score-green' : 'score-red'">{{ ir.valorBoolean ? 'Sí' : 'No' }}</span>
                      <span v-else class="rpt-resp-text">{{ ir.valorTexto }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  ClipboardList, Copy, Check, Eye, ToggleLeft, ToggleRight,
  BarChart2, Calendar, Pencil, Upload, ListChecks, Plus, Trash2,
  ImageIcon, Clock as ClockIcon, Loader2,
} from 'lucide-vue-next'
import {
  getEncuestas, getEncuesta, toggleEncuesta,
  updateEncuesta, addItem as apiAddItem, updateItem as apiUpdateItem,
  deleteItem as apiDeleteItem, reorderItems as apiReorderItems,
  uploadImagen,
} from '@/services/encuestas.service'
import { getTasks } from '@/services/task.service'
import { getQuotations } from '@/services/quotation.service'
import {
  getRegistrosByQuotation, createRegistro, updateRegistro, deleteRegistro, getTurnoToken,
} from '@/services/registros-turno.service'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

// ── Tipos de pregunta ────────────────────────────────────────────
const tipoOptions = [
  { tipo: 'NPS',   icon: '0–10', name: 'NPS',      desc: 'Escala de recomendación', placeholder: '¿Con qué probabilidad nos recomendarías?' },
  { tipo: 'STARS', icon: '★',    name: 'Estrellas', desc: 'Valoración 1 a 5',        placeholder: 'Valoración del servicio prestado' },
  { tipo: 'TEXT',  icon: 'T',    name: 'Texto',     desc: 'Respuesta libre',          placeholder: 'Comentarios o sugerencias adicionales' },
  { tipo: 'YESNO', icon: 'S/N',  name: 'Sí / No',  desc: 'Respuesta binaria',        placeholder: '¿Volvería a contratarnos?' },
]

const tabs = [
  { key: 'apariencia', label: '🎨 Apariencia' },
  { key: 'preguntas',  label: '📋 Preguntas' },
]

// ── Estado ───────────────────────────────────────────────────────
const loading      = ref(true)
const encuestas    = ref([])
const copiedId     = ref(null)

// Ops
const opsLoading   = ref(true)
const tasks        = ref([])

// Editor
const editorEnc    = ref(null)
const editorForm   = ref({ titulo: '', descripcion: '' })
const activeTab    = ref('apariencia')
const uploadingImg = ref(false)
const editorCopied = ref(false)

// Add form
const addingTipo      = ref(null)
const addingLabel     = ref('')
const addingRequerida = ref(false)
const addLabelRef     = ref(null)

// Detalle
const detailEnc     = ref(null)
const detailData    = ref(null)
const detailLoading = ref(false)

// ── Computed ─────────────────────────────────────────────────────
const totalRespuestas = computed(() =>
  encuestas.value.reduce((s, e) => s + (e._count?.respuestas ?? 0), 0)
)
const encuestasActivas = computed(() => encuestas.value.filter(e => e.activa).length)

const avgNps = computed(() => {
  // This would need the full responses data; use null as placeholder
  return null
})

const taskStats = computed(() => {
  const all = tasks.value
  return {
    pendiente:  all.filter(t => t.status === 'PENDIENTE').length,
    enProgreso: all.filter(t => t.status === 'EN_PROGRESO').length,
    completada: all.filter(t => t.status === 'COMPLETADA').length,
    total:      all.length,
  }
})

const urgentTasks   = computed(() => tasks.value.filter(t => t.status === 'PENDIENTE'))
const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'EN_PROGRESO'))

const npsClass = (val) => {
  const n = parseFloat(val)
  return n >= 9 ? 'score-green' : n >= 7 ? 'score-yellow' : 'score-red'
}

// ── Formatters ───────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

const formatDateFull = (iso) =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const encuestaUrl = (token) => `${window.location.origin}/encuesta/${token}`

// ── Registro de Turno — Estado ──────────────────────────────────
const RT_MANAGER_ROLES = ['ADMIN', 'ADMINISTRADOR', 'DIRECCION', 'LIDER', 'SUPERVISOR', 'COORDINADOR']
const canManageTurnos = computed(() =>
  (user.value?.roles ?? []).some(r => RT_MANAGER_ROLES.includes(r))
)

const rtQuotations  = ref([])
const rtQuotationId = ref(null)
const rtRegistros   = ref([])
const rtLoading     = ref(false)
const rtModalOpen   = ref(false)
const rtEditing     = ref(null)
const rtSaving      = ref(false)
const rtEligibleUsers = ref([])

const rtLinkCopied = ref(false)

const copyTurnoLink = async () => {
  if (!rtQuotationId.value) return
  try {
    const { token } = await getTurnoToken(rtQuotationId.value)
    const url = `${window.location.origin}/turno/${token}`
    await navigator.clipboard.writeText(url)
    rtLinkCopied.value = true
    setTimeout(() => { rtLinkCopied.value = false }, 2500)
  } catch (_) {}
}

const rtFormDefault = () => ({ userId: null, fecha: '', horaIngreso: '', horaSalida: '', notas: '' })
const rtForm = ref(rtFormDefault())

// Roster: one row per LOGISTICA/OPERATIVO member, with their registro merged in
const RT_OP_ROLES = ['LOGISTICA', 'OPERATIVO']
const rtRoster = computed(() => {
  const registrosByUser = new Map(rtRegistros.value.map(r => [r.userId, r]))
  return rtEligibleUsers.value
    .filter(u => RT_OP_ROLES.includes(u.role))
    .map(u => ({ user: u, registro: registrosByUser.get(u.id) ?? null }))
})

const rtTotalHoras = computed(() =>
  rtRegistros.value.reduce((sum, r) => {
    if (!r.horaIngreso || !r.horaSalida) return sum
    const h = (new Date(r.horaSalida) - new Date(r.horaIngreso)) / 3600000
    return sum + (h > 0 ? h : 0)
  }, 0).toFixed(1)
)

// ── Registro de Turno — Helpers ─────────────────────────────────
const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const formatDateShort = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const calcHours = (inIso, outIso) => {
  if (!inIso || !outIso) return '—'
  const h = (new Date(outIso) - new Date(inIso)) / 3600000
  return h > 0 ? h.toFixed(1) + 'h' : '—'
}

const calcHoursFromTimes = (inTime, outTime) => {
  if (!inTime || !outTime) return '0'
  const [ih, im] = inTime.split(':').map(Number)
  const [oh, om] = outTime.split(':').map(Number)
  const h = (oh * 60 + om - (ih * 60 + im)) / 60
  return h > 0 ? h.toFixed(1) : '0'
}

const rtRoleClass = (role) => {
  const map = { LOGISTICA: 'rt-role--blue', OPERATIVO: 'rt-role--green', SUPERVISOR: 'rt-role--purple', COORDINADOR: 'rt-role--orange' }
  return map[role] ?? 'rt-role--gray'
}

// ── Registro de Turno — Acciones ─────────────────────────────────
const loadRtQuotations = async () => {
  try {
    const res = await getQuotations()
    const all = res.data ?? []
    rtQuotations.value = all.filter(q =>
      ['Aprobada', 'Pendiente'].includes(q.quotationStatus?.name ?? '')
    )
    if (rtQuotations.value.length && !rtQuotationId.value) {
      rtQuotationId.value = rtQuotations.value[rtQuotations.value.length - 1].id
      await loadRegistros()
    }
  } catch (_) {}
}

const loadRegistros = async () => {
  if (!rtQuotationId.value) return
  rtLoading.value = true
  try {
    const res = await getRegistrosByQuotation(rtQuotationId.value)
    rtRegistros.value = res ?? []
    // members and coordinadores are pivot arrays: { user: {...} }
    const q = rtQuotations.value.find(q => q.id === rtQuotationId.value)
    const memberUsers = (q?.members ?? []).map(m => m.user ?? m).filter(Boolean)
    const coordUsers  = (q?.coordinadores ?? []).map(c => c.user ?? c).filter(Boolean)
    const seen = new Set()
    rtEligibleUsers.value = [...memberUsers, ...coordUsers].filter(u => {
      if (!u?.id || seen.has(u.id)) return false
      seen.add(u.id); return true
    })
  } catch (_) { rtRegistros.value = [] }
  finally { rtLoading.value = false }
}

const openRtModalForUser = (u) => {
  rtEditing.value = null
  rtForm.value = { ...rtFormDefault(), userId: u.id }
  rtModalOpen.value = true
}

const openRtModal = (registro) => {
  rtEditing.value = registro
  if (registro) {
    const toDateInput = (iso) => iso ? new Date(iso).toISOString().slice(0, 10) : ''
    const toTimeInput = (iso) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
    rtForm.value = {
      userId:      registro.userId,
      fecha:       toDateInput(registro.fecha),
      horaIngreso: toTimeInput(registro.horaIngreso),
      horaSalida:  toTimeInput(registro.horaSalida),
      notas:       registro.notas ?? '',
    }
  } else {
    rtForm.value = rtFormDefault()
  }
  rtModalOpen.value = true
}

const closeRtModal = () => {
  rtModalOpen.value = false
  rtEditing.value = null
}

const buildDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

const saveRegistro = async () => {
  if (!rtForm.value.userId || !rtForm.value.fecha) return
  rtSaving.value = true
  try {
    const payload = {
      quotationId: rtQuotationId.value,
      userId:      rtForm.value.userId,
      fecha:       new Date(`${rtForm.value.fecha}T00:00:00`).toISOString(),
      horaIngreso: buildDateTime(rtForm.value.fecha, rtForm.value.horaIngreso),
      horaSalida:  buildDateTime(rtForm.value.fecha, rtForm.value.horaSalida),
      notas:       rtForm.value.notas || null,
    }
    if (rtEditing.value) {
      await updateRegistro(rtEditing.value.id, payload)
    } else {
      await createRegistro(payload)
    }
    closeRtModal()
    await loadRegistros()
  } catch (_) {}
  finally { rtSaving.value = false }
}

const confirmDeleteRegistro = async (r) => {
  if (!confirm(`¿Eliminar el registro de turno de ${r.user?.fullName}?`)) return
  try {
    await deleteRegistro(r.id)
    rtRegistros.value = rtRegistros.value.filter(x => x.id !== r.id)
  } catch (_) {}
}

// ── Mount ────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadEncuestas(), loadOps(), loadRtQuotations()])
})

const loadEncuestas = async () => {
  try {
    const res = await getEncuestas()
    encuestas.value = res.data ?? []
  } catch (_) {}
  finally { loading.value = false }
}

const loadOps = async () => {
  try {
    const res = await getTasks()
    tasks.value = res.data ?? []
  } catch (_) {}
  finally { opsLoading.value = false }
}

// ── Acciones encuesta ────────────────────────────────────────────
const copyLink = async (enc) => {
  await navigator.clipboard.writeText(encuestaUrl(enc.token))
  copiedId.value = enc.id
  setTimeout(() => { copiedId.value = null }, 2500)
}

const handleToggle = async (enc) => {
  try {
    const res = await toggleEncuesta(enc.id)
    enc.activa = res.data.activa
  } catch (_) {}
}

// ── Editor ───────────────────────────────────────────────────────
const openEditor = async (enc) => {
  activeTab.value = 'apariencia'
  addingTipo.value = null
  try {
    const res = await getEncuesta(enc.id)
    editorEnc.value = res.data
    editorForm.value = { titulo: res.data.titulo ?? '', descripcion: res.data.descripcion ?? '' }
  } catch (_) {
    editorEnc.value = { ...enc, items: enc.items ?? [] }
    editorForm.value = { titulo: enc.titulo ?? '', descripcion: enc.descripcion ?? '' }
  }
}

const closeEditor = async () => {
  try { await loadEncuestas() } catch (_) {}
  editorEnc.value = null
}

const saveHeader = async () => {
  if (!editorEnc.value) return
  try {
    await updateEncuesta(editorEnc.value.id, {
      titulo: editorForm.value.titulo || null,
      descripcion: editorForm.value.descripcion || null,
    })
    editorEnc.value.titulo = editorForm.value.titulo
    editorEnc.value.descripcion = editorForm.value.descripcion
  } catch (_) {}
}

const handleImgUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file || !editorEnc.value) return
  uploadingImg.value = true
  try {
    const res = await uploadImagen(editorEnc.value.id, file)
    editorEnc.value.imagen = res.data.imagen
  } catch (_) {}
  finally { uploadingImg.value = false }
}

const copyEditorLink = async () => {
  if (!editorEnc.value) return
  await navigator.clipboard.writeText(encuestaUrl(editorEnc.value.token))
  editorCopied.value = true
  setTimeout(() => { editorCopied.value = false }, 2500)
}

// ── Agregar preguntas ─────────────────────────────────────────────
const selectTipo = (t) => {
  if (addingTipo.value === t.tipo) { cancelAdd(); return }
  addingTipo.value = t.tipo
  addingLabel.value = ''
  addingRequerida.value = false
  nextTick(() => addLabelRef.value?.focus())
}

const cancelAdd = () => {
  addingTipo.value = null
  addingLabel.value = ''
}

const confirmAddItem = async () => {
  if (!addingLabel.value.trim() || !editorEnc.value) return
  try {
    const res = await apiAddItem(editorEnc.value.id, {
      tipo: addingTipo.value,
      label: addingLabel.value.trim(),
      requerida: addingRequerida.value,
    })
    editorEnc.value.items = [...(editorEnc.value.items ?? []), res.data]
    cancelAdd()
  } catch (_) {}
}

const saveItem = async (item) => {
  if (!editorEnc.value) return
  try {
    await apiUpdateItem(editorEnc.value.id, item.id, { label: item.label, requerida: item.requerida })
  } catch (_) {}
}

const toggleRequerida = async (item) => {
  item.requerida = !item.requerida
  await saveItem(item)
}

const removeItem = async (item) => {
  if (!editorEnc.value) return
  try {
    await apiDeleteItem(editorEnc.value.id, item.id)
    editorEnc.value.items = editorEnc.value.items.filter(i => i.id !== item.id)
  } catch (_) {}
}

const moveItem = async (idx, dir) => {
  if (!editorEnc.value?.items) return
  const items = [...editorEnc.value.items]
  const swapIdx = idx + dir
  if (swapIdx < 0 || swapIdx >= items.length) return
  ;[items[idx], items[swapIdx]] = [items[swapIdx], items[idx]]
  editorEnc.value.items = items
  try { await apiReorderItems(editorEnc.value.id, items.map(i => i.id)) } catch (_) {}
}

// ── Detalle respuestas ────────────────────────────────────────────
const detailSummary = computed(() => {
  if (!detailData.value?.respuestas?.length || !detailData.value?.items?.length) return []
  return detailData.value.items
    .filter(i => i.tipo === 'NPS' || i.tipo === 'STARS')
    .map(item => {
      const vals = detailData.value.respuestas
        .flatMap(r => r.itemRespuestas)
        .filter(ir => ir.itemId === item.id && ir.valorNumerico != null)
        .map(ir => ir.valorNumerico)
      if (!vals.length) return null
      return { label: item.label, avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) }
    }).filter(Boolean)
})

const openDetail = async (enc) => {
  detailEnc.value = enc
  detailData.value = null
  detailLoading.value = true
  try {
    const res = await getEncuesta(enc.id)
    detailData.value = res.data
  } catch (_) {}
  finally { detailLoading.value = false }
}
</script>

<style scoped>
.rpt-page { padding: 0; display: flex; flex-direction: column; gap: 32px; }

/* ── Shared ── */
.rpt-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2.5px solid #e2e8f0; border-top-color: #0f3460;
  animation: spin 0.8s linear infinite; flex-shrink: 0;
}
.rpt-spinner.sm { width: 20px; height: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.rpt-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 7px; border: 1px solid transparent;
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.13s;
  font-family: inherit; white-space: nowrap;
}
.rpt-btn-primary   { background: #0f3460; color: #fff; }
.rpt-btn-primary:hover:not(:disabled) { background: #1a4a80; }
.rpt-btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.rpt-btn-secondary { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
.rpt-btn-secondary:hover { background: #e2e8f0; }
.rpt-btn-ghost     { background: transparent; color: #94a3b8; }
.rpt-btn-ghost:hover { background: #f8fafc; color: #475569; }

/* ── Ops section ── */
.ops-section { }
.ops-title { font-size: 14px; font-weight: 800; color: #0f1a2e; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.5px; }

.ops-loading { display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 13px; padding: 20px 0; }

.ops-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }

.ops-card {
  background: #fff; border: 1px solid #e5eaf0; border-radius: 14px;
  padding: 16px; position: relative; overflow: hidden;
}
.ops-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
}
.ops-card--warn::before   { background: #f59e0b; }
.ops-card--blue::before   { background: #3b82f6; }
.ops-card--green::before  { background: #10b981; }
.ops-card--purple::before { background: #8b5cf6; }

.ops-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.ops-icon  { font-size: 16px; line-height: 1; }
.ops-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }

.ops-val { font-size: 32px; font-weight: 900; color: #0f1a2e; line-height: 1; }
.ops-val-unit { font-size: 14px; font-weight: 600; color: #94a3b8; margin-left: 2px; }
.ops-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

.ops-mini-list { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.ops-mini-item { display: flex; align-items: center; gap: 6px; }
.ops-mini-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ops-mini-dot.warn { background: #f59e0b; }
.ops-mini-dot.blue { background: #3b82f6; }
.ops-mini-text { font-size: 11px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ops-progress-bar { height: 6px; background: #e5eaf0; border-radius: 99px; overflow: hidden; margin-top: 10px; }
.ops-progress-fill { height: 100%; background: #10b981; border-radius: 99px; transition: width 0.4s ease; }

/* ── Enc section ── */
.enc-section { }
.enc-section-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.rpt-sub  { font-size: 12px; color: #64748b; margin: 2px 0 0; }
.rpt-stat { font-size: 12px; color: #64748b; align-self: flex-end; }

.rpt-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 0; color: #94a3b8; }
.rpt-empty { text-align: center; padding: 40px 20px; color: #64748b; }
.rpt-empty-icon { margin: 0 auto 12px; opacity: 0.3; display: block; }
.rpt-empty h3 { font-size: 15px; font-weight: 700; color: #0f1a2e; margin: 0 0 6px; }
.rpt-empty p  { font-size: 13px; margin: 0; }
.rpt-empty a  { color: #054EAF; }

.rpt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }

.rpt-card { background: #fff; border: 1px solid #e5eaf0; border-radius: 14px; overflow: hidden; transition: box-shadow 0.15s; }
.rpt-card:hover { box-shadow: 0 4px 20px rgba(15,26,46,0.09); }
.rpt-card--inactive { opacity: 0.6; }

.rpt-card-cover { height: 72px; background-size: cover; background-position: center; }
.rpt-card-body  { padding: 12px 14px 14px; }

.rpt-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.rpt-card-info   { display: flex; align-items: center; gap: 5px; min-width: 0; }
.rpt-card-num    { font-size: 12px; font-weight: 700; color: #0f1a2e; flex-shrink: 0; }
.rpt-dot         { width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1; }
.rpt-card-cliente { font-size: 12px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rpt-card-titulo  { font-size: 12px; font-weight: 600; color: #0f1a2e; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.rpt-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0; }
.badge-active   { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.badge-inactive { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }

.rpt-card-date { font-size: 11px; color: #94a3b8; margin: 0 0 6px; display: flex; align-items: center; gap: 3px; }
.rpt-card-meta { display: flex; gap: 10px; margin-bottom: 10px; }
.rpt-meta-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #64748b; }
.rpt-card-actions { display: flex; gap: 5px; flex-wrap: wrap; }

/* ── MODAL OVERLAY ── */
.rpt-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,26,46,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.rpt-modal {
  background: #fff; border-radius: 18px; width: 100%; max-width: 620px;
  max-height: 88vh; overflow-y: auto; box-shadow: 0 28px 72px rgba(0,0,0,0.28);
  display: flex; flex-direction: column;
}
.rpt-modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 24px 16px; border-bottom: 1px solid #e5eaf0;
  position: sticky; top: 0; background: #fff; z-index: 2;
}
.rpt-modal-title { font-size: 15px; font-weight: 800; color: #0f1a2e; margin: 0 0 2px; }
.rpt-modal-sub   { font-size: 12px; color: #64748b; margin: 0; }
.rpt-modal-loading { display: flex; justify-content: center; padding: 40px; }

/* ── EDITOR MODAL ── */
.ed-modal { max-width: 680px; }

.ed-modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 24px 0; background: #fff;
  position: sticky; top: 0; z-index: 2;
}
.ed-modal-tag  { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
.ed-modal-title { font-size: 16px; font-weight: 800; color: #0f1a2e; margin: 2px 0 2px; }
.ed-modal-sub  { font-size: 12px; color: #64748b; margin: 0; }
.ed-modal-meta { flex: 1; min-width: 0; }
.ed-close {
  background: none; border: none; font-size: 18px; color: #94a3b8;
  cursor: pointer; padding: 0; flex-shrink: 0; line-height: 1;
}
.ed-close:hover { color: #0f1a2e; }

/* Tabs */
.ed-tabs { display: flex; gap: 0; padding: 14px 24px 0; border-bottom: 1px solid #e5eaf0; background: #fff; position: sticky; top: 56px; z-index: 1; }
.ed-tab {
  padding: 8px 16px; font-size: 12px; font-weight: 600; color: #94a3b8;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; margin-bottom: -1px; font-family: inherit;
}
.ed-tab--active { color: #0f3460; border-bottom-color: #0f3460; }
.ed-tab:hover:not(.ed-tab--active) { color: #475569; }

/* Pane */
.ed-pane { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }

/* Fields */
.ed-field-group { display: flex; flex-direction: column; gap: 6px; }
.ed-field-label { font-size: 12px; font-weight: 700; color: #374151; }
.ed-optional { font-weight: 400; color: #94a3b8; margin-left: 4px; }
.ed-input {
  border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 12px;
  font-size: 13px; font-family: inherit; color: #0f1a2e; outline: none;
  transition: border-color 0.13s; width: 100%; box-sizing: border-box;
}
.ed-input:focus { border-color: #0f3460; }
.ed-textarea {
  border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 12px;
  font-size: 13px; font-family: inherit; color: #0f1a2e; outline: none;
  transition: border-color 0.13s; width: 100%; box-sizing: border-box; resize: vertical;
}
.ed-textarea:focus { border-color: #0f3460; }

/* Cover */
.ed-cover-area { display: flex; gap: 16px; align-items: flex-start; }
.ed-cover-preview {
  width: 180px; height: 90px; border-radius: 12px; flex-shrink: 0;
  background-size: cover; background-position: center;
  border: 1.5px solid #e2e8f0; position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
}
.ed-cover-empty { background: #f8faff; }
.ed-cover-icon { color: #cbd5e1; }
.ed-cover-hint { font-size: 10px; color: #94a3b8; }
.ed-cover-loader { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; }
.ed-cover-actions { display: flex; flex-direction: column; gap: 8px; }
.ed-cover-tip { font-size: 10px; color: #94a3b8; margin: 0; }

/* Add form */
.ed-add-form { background: #f8faff; border: 1.5px solid #e5eaf0; border-radius: 12px; padding: 16px; }
.ed-add-form-title { font-size: 12px; font-weight: 700; color: #374151; margin: 0 0 12px; }

.ed-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }

.ed-type-btn {
  border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff;
  padding: 10px 8px; cursor: pointer; font-family: inherit; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  transition: all 0.15s;
}
.ed-type-btn:hover { border-color: #0f3460; background: #eff6ff; }
.ed-type-btn--active { border-width: 2px; }
.ed-type-btn--nps.ed-type-btn--active   { border-color: #3b82f6; background: #eff6ff; }
.ed-type-btn--stars.ed-type-btn--active { border-color: #f59e0b; background: #fffbeb; }
.ed-type-btn--text.ed-type-btn--active  { border-color: #6b7280; background: #f9fafb; }
.ed-type-btn--yesno.ed-type-btn--active { border-color: #10b981; background: #f0fdf4; }

.ed-type-icon { font-size: 14px; font-weight: 900; color: #0f1a2e; }
.ed-type-name { font-size: 11px; font-weight: 700; color: #0f1a2e; }
.ed-type-desc { font-size: 9px; color: #94a3b8; }

.ed-add-inline { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.ed-add-inline-type { display: flex; align-items: center; gap: 8px; }
.ed-add-inline-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ed-req-check { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #475569; cursor: pointer; margin-left: auto; }
.ed-req-check input { accent-color: #0f3460; }

/* Items */
.ed-items-container { background: #f8faff; border: 1.5px solid #e5eaf0; border-radius: 12px; padding: 14px; }
.ed-items-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ed-items-badge { font-size: 11px; background: #e2e8f0; color: #475569; padding: 1px 7px; border-radius: 99px; font-weight: 700; }

.ed-items-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 0; color: #94a3b8; text-align: center; }
.ed-items-empty-icon { opacity: 0.3; }
.ed-items-empty p { font-size: 12px; margin: 0; }

.ed-items-list { display: flex; flex-direction: column; gap: 6px; }

.ed-item-card {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  background: #fff; border: 1px solid #e5eaf0; border-radius: 9px; padding: 9px 12px;
  transition: box-shadow 0.1s;
}
.ed-item-card:hover { box-shadow: 0 2px 8px rgba(15,26,46,0.07); }

.ed-item-left  { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.ed-item-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.ed-item-badge {
  font-size: 9px; font-weight: 800; padding: 3px 6px; border-radius: 5px;
  flex-shrink: 0; min-width: 30px; text-align: center;
}
.badge-nps   { background: #dbeafe; color: #1d4ed8; }
.badge-stars { background: #fef3c7; color: #92400e; }
.badge-text  { background: #f3f4f6; color: #374151; }
.badge-yesno { background: #d1fae5; color: #065f46; }

.ed-item-label-input {
  flex: 1; border: none; background: transparent; font-size: 13px; color: #0f1a2e;
  outline: none; font-family: inherit; min-width: 0; padding: 2px 0;
}
.ed-item-label-input:focus { border-bottom: 1.5px solid #0f3460; }

.ed-req-chip {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px;
  border: 1.5px solid #e2e8f0; background: #f8faff; color: #94a3b8;
  cursor: pointer; transition: all 0.13s; white-space: nowrap;
}
.ed-req-chip--on { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; }

.ed-ord {
  width: 24px; height: 24px; border: 1px solid #e2e8f0; border-radius: 5px;
  background: none; font-size: 12px; cursor: pointer; color: #64748b;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.ed-ord:hover:not(:disabled) { background: #e2e8f0; }
.ed-ord:disabled { opacity: 0.25; cursor: not-allowed; }

.ed-del {
  width: 26px; height: 26px; background: none; border: none;
  color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 5px; transition: background 0.1s; padding: 0;
}
.ed-del:hover { background: #fee2e2; }

/* Modal footer */
.ed-modal-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 24px; border-top: 1px solid #e5eaf0;
  background: #fff; position: sticky; bottom: 0; z-index: 2; flex-wrap: wrap;
}
.ed-link-row { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; overflow: hidden; }
.ed-link-label { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.ed-link-code {
  font-size: 10px; color: #475569; background: #f1f5f9; padding: 3px 8px;
  border-radius: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;
}

/* Respuestas modal */
.rpt-summary-row { display: flex; gap: 16px; padding: 14px 24px; border-bottom: 1px solid #e5eaf0; flex-wrap: wrap; }
.rpt-summary-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.rpt-dsm-val { font-size: 20px; font-weight: 900; }
.rpt-dsm-lbl { font-size: 10px; color: #94a3b8; text-align: center; max-width: 80px; }

.rpt-resp-list { padding: 14px 24px; display: flex; flex-direction: column; gap: 10px; }
.rpt-resp-item { border: 1px solid #e5eaf0; border-radius: 10px; overflow: hidden; }
.rpt-resp-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8faff; }
.rpt-resp-num  { font-size: 12px; font-weight: 700; color: #0f1a2e; }
.rpt-resp-date { font-size: 11px; color: #94a3b8; }
.rpt-resp-body { padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
.rpt-resp-row  { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
.rpt-resp-lbl  { color: #475569; flex: 1; }
.rpt-resp-val  { font-weight: 600; flex-shrink: 0; }
.rpt-resp-text { font-style: italic; color: #64748b; font-weight: 400; }

.score-green  { color: #065f46; }
.score-yellow { color: #92400e; }
.score-red    { color: #991b1b; }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.slide-down-enter-active { transition: all 0.2s ease; }
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to     { opacity: 0; transform: translateY(-4px); }

/* ═══ Registro de Turno ═══════════════════════════════════════ */
.rt-section {
  background: white;
  border-radius: 14px;
  border: 1px solid #E8EDF5;
  padding: 24px 28px;
  margin-bottom: 24px;
}
.rt-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.rt-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rt-select {
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  color: #0F1A2E;
  background: white;
  cursor: pointer;
  min-width: 200px;
}
.rt-btn-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: white;
  color: #6366F1;
  border: 1px solid #C7D2FE;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.rt-btn-link:hover { background: #EEF2FF; }
.rt-btn-link--copied { color: #059669; border-color: #A7F3D0; background: #ECFDF5; }
.rt-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #0F1A2E;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.rt-empty {
  text-align: center;
  padding: 40px 0;
  color: #94A3B8;
  font-size: 13px;
}
.rt-empty-icon { margin: 0 auto 10px; display: block; opacity: 0.4; }
.rt-table-wrap { overflow-x: auto; }
.rt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.rt-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: .04em;
  border-bottom: 1px solid #F1F5F9;
}
.rt-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #F8FAFC;
  color: #1E293B;
  vertical-align: middle;
}
.rt-table tr:last-child td { border-bottom: none; }
.rt-user-cell { display: flex; align-items: center; gap: 8px; }
.rt-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #EFF6FF;
  color: #2563EB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.rt-role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
}
.rt-role--blue   { background: #DBEAFE; color: #1D4ED8; }
.rt-role--green  { background: #D1FAE5; color: #065F46; }
.rt-role--purple { background: #EDE9FE; color: #6D28D9; }
.rt-role--orange { background: #FEF3C7; color: #92400E; }
.rt-role--gray   { background: #F1F5F9; color: #475569; }
.rt-time  { font-family: monospace; font-size: 12px; color: #334155; }
.rt-hours { font-weight: 700; color: #0F1A2E; }
.rt-notas { color: #64748B; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rt-actions-cell { display: flex; align-items: center; gap: 4px; }
.rt-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  background: white;
  color: #64748B;
  cursor: pointer;
  transition: all .15s;
}
.rt-action-btn:hover { background: #F8FAFC; color: #0F1A2E; }
.rt-action-btn--danger:hover { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
.rt-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
  font-size: 12px;
  color: #64748B;
}

/* Modal RT */
.rt-modal { max-width: 480px; }
.rt-form { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 14px; }
.rt-form-group { display: flex; flex-direction: column; gap: 5px; }
.rt-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rt-label { font-size: 12px; font-weight: 600; color: #374151; }
.rt-required { color: #EF4444; }
.rt-input {
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #0F1A2E;
  background: white;
  width: 100%;
  box-sizing: border-box;
}
.rt-input:focus { outline: none; border-color: #6366F1; box-shadow: 0 0 0 3px #EEF2FF; }
.rt-textarea { resize: vertical; min-height: 72px; }
.rt-hours-preview {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #F0FDF4;
  color: #166534;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}
.rt-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.rt-pending-text { color: #CBD5E1; font-style: italic; font-size: 11px; }
.rt-row--pending td { opacity: 0.75; }
.rt-avatar--active { background: #D1FAE5; color: #065F46; }
.rt-btn-registrar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.rt-btn-registrar:hover { background: #DBEAFE; }
</style>
