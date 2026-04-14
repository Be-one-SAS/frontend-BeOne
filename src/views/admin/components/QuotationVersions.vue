<template>
  <div class="versions-manager-dropdown">
    <div class="versions-header">
      <div class="header-left">
        <History :size="16" class="icon-brand" />
        <span class="versions-title">Historial de Versiones</span>
      </div>
    </div>

    <!-- Lista de Versiones -->
    <div class="versions-list">
      <div v-if="loading" class="empty-versions">Cargando historial...</div>
      <div v-else-if="versions.length === 0" class="empty-versions">
        No hay versiones previas guardadas.
      </div>

      <div 
        v-else 
        v-for="(v, index) in versions" 
        :key="v.id" 
        class="version-card"
        :class="{ 'is-latest': index === 0 }"
      >
        <div class="version-info">
          <div class="version-main">
            <span class="version-number">Versión #{{ v.versionNumber }}</span>
            <span v-if="index === 0" class="latest-badge">Actual</span>
          </div>
          <div class="version-meta">
            <span class="meta-date">{{ formatDate(v.createdAt) }}</span>
            <span class="meta-dot">•</span>
            <span class="meta-author">{{ v.createdBy?.fullName || 'S/A' }}</span>
          </div>
        </div>

        <button 
          v-if="canManage && index !== 0"
          type="button" 
          class="restore-btn" 
          @click.stop="confirmRestore(v)"
          title="Restaurar esta versión"
        >
          <RotateCcw :size="13" />
          <span>Restaurar</span>
        </button>
      </div>
    </div>

    <!-- Modal de confirmación absoluto (dentro del dropdown) -->
    <div v-if="versionToRestore" class="confirm-overlay" @click.stop>
      <div class="confirm-box">
        <h4 class="confirm-title">¿Restaurar v#{{ versionToRestore.versionNumber }}?</h4>
        <p class="confirm-desc">Sobrescribirá los datos actuales.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="versionToRestore = null">No</button>
          <button class="btn-confirm" @click="executeRestore">
            {{ isRestoring ? '...' : 'Sí' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { History, RotateCcw } from 'lucide-vue-next' // Plus removido
import { getVersions, restoreVersion } from '@/services/quotation.service' // createVersion removido

const props = defineProps({
  quotationId: {
    type: [Number, String],
    required: true
  },
  canManage: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['version-restored'])

const versions = ref([])
const loading = ref(true)
const isRestoring = ref(false)
const versionToRestore = ref(null)

const fetchVersions = async () => {
  loading.value = true
  try {
    const { data } = await getVersions(props.quotationId)
    versions.value = (data || []).sort((a, b) => b.versionNumber - a.versionNumber)
  } catch (e) {
    console.error("Error cargando versiones", e)
  } finally {
    loading.value = false
  }
}

const confirmRestore = (v) => {
  versionToRestore.value = v
}

const executeRestore = async () => {
  if (!versionToRestore.value) return
  isRestoring.value = true
  try {
    const vNum = versionToRestore.value.versionNumber // ✅ Capturamos el número antes de limpiar
    await restoreVersion(props.quotationId, versionToRestore.value.id)
    emit('version-restored', vNum)
  } catch (e) {
    console.error("Error restaurando versión", e)
  } finally {
    isRestoring.value = false
    versionToRestore.value = null
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

onMounted(() => {
  fetchVersions()
})
</script>

<style scoped>
.versions-manager-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  background: white;
  border: 1px solid #E2EBF6;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(5,78,175,0.15);
  padding: 12px;
  z-index: 1000;
}

/* Triangulito superior */
.versions-manager-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: white;
  border-left: 1px solid #E2EBF6;
  border-top: 1px solid #E2EBF6;
  transform: rotate(45deg);
}

.versions-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F1F5F9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-brand {
  color: #054EAF;
}

.versions-title {
  font-size: 12px;
  font-weight: 700;
  color: #0F1A2E;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 2px;
}

.empty-versions {
  font-size: 11px;
  color: #94A3B8;
  text-align: center;
  padding: 10px 0;
}

.version-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}
.version-card:hover {
  border-color: #CBD5E1;
  background: #F1F5F9;
}

.is-latest {
  border-color: #BFDBFE;
  background: #EFF6FF;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.version-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.version-number {
  font-size: 12px;
  font-weight: 700;
  color: #0F1A2E;
}

.latest-badge {
  font-size: 9px;
  font-weight: 800;
  color: #1D4ED8;
  background: #DBEAFE;
  padding: 1px 5px;
  border-radius: 4px;
}

.version-meta {
  font-size: 10px;
  color: #64748B;
  display: flex;
  gap: 4px;
}

.restore-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  background: white;
  border: 1px solid #E2E8F0;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.restore-btn:hover {
  background: #054EAF;
  color: white;
  border-color: #054EAF;
}

/* Confirm Overlay (dentro del card para no salirse) */
.confirm-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.confirm-box {
  text-align: center;
  padding: 10px;
}

.confirm-title {
  font-size: 12px;
  font-weight: 700;
  color: #B91C1C;
  margin-bottom: 4px;
}

.confirm-desc {
  font-size: 10px;
  color: #64748B;
  margin-bottom: 10px;
}

.confirm-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.btn-cancel, .btn-confirm {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}
.btn-cancel { background: #F1F5F9; color: #475569; }
.btn-confirm { background: #B91C1C; color: white; }

.versions-list::-webkit-scrollbar { width: 3px; }
.versions-list::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
</style>
