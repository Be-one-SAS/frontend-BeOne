<template>
  <aside
    class="bg-white/80 backdrop-blur-xl border-r border-gray-200
           py-6 m-6 rounded-4xl min-w-50 w-full max-w-70 overflow-hidden p-5"
  >
    <div class="flex flex-col gap-10">
      <!-- Logo -->
      <div class="flex items-center mb-6">
        <span class="font-bold text-xl text-blue-900">
          BeOne
        </span>
      </div>

      <!-- Navegación -->
      <nav class="flex flex-col space-y-3 text-gray-700 font-medium">

        <MenuItem
          icon="Home"
          label="Home"
          route="/"
        />

        <MenuItem
          icon="Comercial"
          label="Dpto Comercial"
          :items="[
            { name: 'Cotizar', route: '/admin/cotizar' },
            { name: 'Ver cotizaciones', route: '/admin/ver-cotizaciones' },
            { name: 'Proveedores', route: '/suppliers/suppliers' },
            { name: 'Clientes', route: '/customer/customer' },
            { name: 'Clientes directos', route: '/customer/price' },
            { name: 'Productos propios', route: '/products' },
            { name: 'Productos no propios', route: '/products/no-propios' },
          ]"
          :is-open="openMenu === 'Dpto Comercial'"
          @toggle="toggleMenu('Dpto Comercial')"
        />

        <MenuItem
          icon="Operativo"
          label="Dpto Operativo"
          :items="[
            { name: 'Reporte diario', route: '/operativa/reporte' },
            { name: 'Check-ins', route: '/operativa/checkins' },
          ]"
          :is-open="openMenu === 'Dpto Operativo'"
          @toggle="toggleMenu('Dpto Operativo')"
        />

        <MenuItem
          icon="Personal"
          label="Departamento de personal"
          :items="[
            { name: 'Listado', route: '/users/list' },
            { name: 'Roles', route: '/users/roles' },
          ]"
          :is-open="openMenu === 'Departamento de personal'"
          @toggle="toggleMenu('Departamento de personal')"
        />

        <MenuItem
          icon="Usuario"
          label="Usuarios"
          :items="[
            { name: 'Listado', route: '/users/list' },
            { name: 'Roles', route: '/users/roles' },
          ]"
          :is-open="openMenu === 'Usuarios'"
          @toggle="toggleMenu('Usuarios')"
        />

      </nav>
    </div>

    <!-- Logout -->
    <div class="mt-10">
      <button
        @click="logoutClearStorange"
        class="flex items-center gap-2 text-red-500 font-medium hover:underline"
      >
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import MenuItem from './MenuItem.vue'

const openMenu = ref(null)

const toggleMenu = (label) => {
  openMenu.value = openMenu.value === label ? null : label
}

const { setLogout } = useAuth()
const router = useRouter()

const logoutClearStorange = () => {
  setLogout()
  router.push('/login')
}
</script>