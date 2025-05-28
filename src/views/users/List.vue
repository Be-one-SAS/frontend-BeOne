<template>
    <div class="bg-white shadow-md rounded-xl p-6 mx-auto space-y-8">
      <!-- Título -->
      <div>
        <h2 class="text-2xl font-bold text-blue-700">Crear Usuario</h2>
      </div>
  
      <!-- Formulario de Usuario -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputLabel label="Nombre Completo" v-model="nuevoUsuario.nombre" />
        <InputLabel label="Correo Electrónico" v-model="nuevoUsuario.correo" type="email" />
        <InputLabel label="Contraseña" v-model="nuevoUsuario.contrasena" type="password" />
  
        <div>
          <label class="block text-gray-800 font-medium mb-1">Rol</label>
          <select
            v-model="nuevoUsuario.rol"
            class="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option disabled value="">Selecciona un rol</option>
            <option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option>
          </select>
        </div>
      </div>
  
      <!-- Botón -->
      <div class="pt-4">
        <button
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow"
          @click="crearUsuario"
        >
          Crear Usuario
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import InputLabel from '@/components/input/InputLabel.vue'
import { reactive } from 'vue'

  
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
  
  const crearUsuario = () => {
    console.log('Usuario creado:', nuevoUsuario)
    // Aquí podrías hacer la petición a tu API para guardar el usuario
  }
  </script>