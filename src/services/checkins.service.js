import api from './api'

// GET /checkins → Checkin[]
export const getCheckins = async () => {
  const res = await api.get('/checkins')
  return res.data
}

// GET /checkins/:id → Checkin
export const getCheckinById = async (id) => {
  const res = await api.get(`/checkins/${id}`)
  return res.data
}

// POST /checkins (multipart/form-data) → Checkin
// payload:    objeto plano con los campos del formulario
// files:      File[]  (campo "foto", se envía uno por cada archivo)
// onProgress: (pct: number) => void
export const createCheckin = async (payload, files = [], onProgress = null) => {
  const form = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  })

  files.forEach(file => {
    if (file) form.append('foto', file)
  })

  const res = await api.post('/checkins', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })

  return res.data
}
