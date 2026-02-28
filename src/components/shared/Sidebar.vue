<template>
  <aside
    class="bg-card rounded-[0_24px_24px_0] py-6 px-3 w-[200px] shrink-0 flex flex-col gap-8 shadow-[var(--shadow-card)] overflow-hidden"
  >
    <div class="flex flex-col gap-6">
      <!-- Logo -->
      <div class="flex items-center justify-center">
        <img src="/assets/logo.png" alt="Logo de BeOne" class="max-w-[100px]" />
      </div>

      <!-- Navegación -->
      <nav class="flex flex-col space-y-1">

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
    <div class="mt-auto">
      <button
        @click="logoutClearStorange"
        class="text-sm text-red-500 font-medium flex items-center gap-2 hover:opacity-80 transition"
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