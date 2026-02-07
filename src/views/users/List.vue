<template>
  <div class="bg-white p-6 mx-auto space-y-8">
    <!-- Título -->
    <div>
      <h2 class="text-2xl font-bold text-blue-700">Crear Usuario</h2>
    </div>

    <!-- Mensajes -->
    <div v-if="mensaje"
      :class="`p-3 rounded-lg text-sm ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`">
      {{ mensaje }}
    </div>

    <!-- Formulario de Usuario -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputLabel label="Nombre Completo" v-model="nuevoUsuario.nombre" />
      <InputLabel label="Correo Electrónico" v-model="nuevoUsuario.correo" type="email" />
      <InputLabel label="Contraseña" v-model="nuevoUsuario.contrasena" type="password" />
      <InputLabel label="Sede" v-model="nuevoUsuario.contrasena" type="text" />
      <InputLabel label="Departamento" v-model="nuevoUsuario.contrasena" type="text" />
      <div>
        <label class="block text-gray-800 font-medium mb-1">Rol</label>
        <select v-model="nuevoUsuario.rol"
          class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option disabled value="">Selecciona un rol</option>
          <option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option>
        </select>
      </div>
    </div>

    <!-- Botón -->
    <div class="pt-4">
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow flex items-center justify-center gap-2"
        @click="crearUsuario" :disabled="isLoading">
        <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span>{{ isLoading ? 'Creando...' : 'Crear Usuario' }}</span>
      </button>
    </div>

   
  </div>

 <!-- Tabla de usuarios -->
 <div v-if="listaUsuarios.length > 0" class="overflow-x-auto mt-6 bg-white p-6">
      <table class="min-w-full bg-white shadow rounded-lg ">
        <thead>
          <tr class="bg-blue-100 text-left text-gray-700">
            <th class="py-3 px-4">Nombre</th>
            <th class="py-3 px-4">Correo</th>
            <th class="py-3 px-4">Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in listaUsuarios" :key="usuario.id" class="border-b hover:bg-gray-50">
            <td class="py-2 px-4">{{ usuario.fullName }}</td>
            <td class="py-2 px-4">{{ usuario.email }}</td>
            <td class="py-2 px-4">{{ usuario.roles?.[0]?.role?.name || 'Sin rol' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
</template>

<script setup>
import InputLabel from '@/components/input/InputLabel.vue'
import { reactive, ref } from 'vue'
import { createUser, getUsers } from '../../services/user.service'
import { onMounted } from 'vue'

const listaUsuarios = ref([])

const roles = [
  'Administrador',
  'Comité Ejecutivo',
  'Back Office',
  'Depto Administración',
  'Depto Comercial',
  'Depto Operación',
  'Coordinador General',
  'Coordinador',
  'Dinamizador',
]

const nuevoUsuario = reactive({
  nombre: '',
  correo: '',
  contrasena: '',
  rol: '',
})

const isLoading = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('success') // 'success' o 'error'

const limpiarCampos = () => {
  nuevoUsuario.nombre = ''
  nuevoUsuario.correo = ''
  nuevoUsuario.contrasena = ''
  nuevoUsuario.rol = ''
}

const crearUsuario = async () => {
  mensaje.value = ''
  isLoading.value = true

  try {
    await createUser({
      email: nuevoUsuario.correo,
      password: nuevoUsuario.contrasena,
      fullName: nuevoUsuario.nombre,
      role: nuevoUsuario.rol
    })

    mensaje.value = 'Usuario creado exitosamente.'
    mensajeTipo.value = 'success'
    limpiarCampos()
  } catch (error) {
    mensaje.value = error?.message || 'Error al crear el usuario.'
    mensajeTipo.value = 'error'
  } finally {
    isLoading.value = false
  }
}



const viewUsers = async () => {
  mensaje.value = ''
  isLoading.value = true

  try {
    const response = await getUsers()
    listaUsuarios.value = response.data // Guarda los usuarios
    console.log(response)
    mensaje.value = 'Usuarios cargados exitosamente.'
    mensajeTipo.value = 'success'
  } catch (error) {
    mensaje.value = error?.message || 'Error al obtener los usuarios.'
    mensajeTipo.value = 'error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  viewUsers()
})
</script>