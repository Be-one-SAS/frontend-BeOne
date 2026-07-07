import api from './api'

// ─────────────────────────────────────────────────────────
// USERS SERVICE
// Base endpoint: /users
// ─────────────────────────────────────────────────────────

/**
 * GET /users
 * Obtiene la lista completa de usuarios del sistema.
 */
export const getUsers = async () => {
  try {
    const response = await api.get('/users')
    return response.data
  } catch (error) {
    console.error('[users.service] Error en getUsers:', error)
    throw error
  }
}

/**
 * GET /users/collaborators
 * Candidatos para "Gestionar Colaboradores" en una cotización — usuarios
 * activos de TODA la organización (cualquier sede), a diferencia de
 * getUsers() que filtra por organigrama y deja a la mayoría de roles
 * viéndose solo a sí mismos.
 */
export const getCollaboratorCandidates = async () => {
  try {
    const response = await api.get('/users/collaborators')
    return response.data
  } catch (error) {
    console.error('[users.service] Error en getCollaboratorCandidates:', error)
    throw error
  }
}

/**
 * GET /users/:id
 * Obtiene un usuario por su ID.
 * @param {number|string} id
 */
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`)
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en getUserById(${id}):`, error)
    throw error
  }
}

/**
 * POST /users
 * Crea un nuevo usuario en el sistema.
 * @param {Object} payload - { fullName, email, username, password, role, status, ciudad, documento, telefono, notas }
 */
export const createUser = async (payload) => {
  try {
    const response = await api.post('/users', payload)
    return response.data
  } catch (error) {
    console.error('[users.service] Error en createUser:', error)
    throw error
  }
}

/**
 * PATCH /users/:id
 * Edita los datos de un usuario existente.
 * @param {number|string} id
 * @param {Object} payload - Campos a actualizar
 */
export const updateUser = async (id, payload) => {
  try {
    const { id: _, ...body } = payload
    const response = await api.patch(`/users/${id}`, body)
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en updateUser(${id}):`, error)
    throw error
  }
}

/**
 * PATCH /users/:id/role
 * Cambia el rol asignado a un usuario.
 * @param {number|string} id
 * @param {string} role - Valor del enum UserRole
 */
export const updateUserRole = async (id, role) => {
  try {
    const response = await api.patch(`/users/${id}/role`, { role })
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en updateUserRole(${id}):`, error)
    throw error
  }
}

/**
 * PATCH /users/:id/toggle-active
 * Activa o desactiva un usuario (invierte el campo isActive).
 * @param {number|string} id
 */
export const toggleUserStatus = async (id) => {
  try {
    const response = await api.patch(`/users/${id}/toggle-active`)
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en toggleUserStatus(${id}):`, error)
    throw error
  }
}

/**
 * PATCH /users/:id/reassign
 * Reasigna el superior (parentId) de un usuario.
 * @param {number|string} id
 * @param {number} newParentId
 */
export const reassignUser = async (id, newParentId) => {
  try {
    const response = await api.patch(`/users/${id}/reassign`, { newParentId })
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en reassignUser(${id}):`, error)
    throw error
  }
}

/**
 * POST /users/:id/resend-bienvenida
 * Genera una contraseña temporal y reenvía el correo de bienvenida.
 * @param {number|string} id
 */
export const resendBienvenida = async (id) => {
  try {
    const response = await api.post(`/users/${id}/resend-bienvenida`)
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en resendBienvenida(${id}):`, error)
    throw error
  }
}

/**
 * DELETE /users/:id
 * Elimina permanentemente un usuario.
 * ⚠️  Solo disponible para ADMIN.
 * @param {number|string} id
 */
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`)
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en deleteUser(${id}):`, error)
    throw error
  }
}

export const adminSetPassword = async (id, newPassword) => {
  try {
    const response = await api.patch(`/users/${id}/password`, { newPassword })
    return response.data
  } catch (error) {
    console.error(`[users.service] Error en adminSetPassword(${id}):`, error)
    throw error
  }
}
