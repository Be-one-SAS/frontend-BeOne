<!-- components/layout/Sidebar.vue -->
<template>
  <aside class="w-64 min-h-screen bg-white shadow-md flex flex-col justify-between p-4 border-r border-blue-300">
    <div class="flex flex-col gap-10">
      <div class="flex items-center mb-10">
        <span class="ml-3 font-bold text-xl text-blue-900">BeOne</span>
      </div>

      <nav class="flex flex-col space-y-6 text-gray-700 font-medium">
        <MenuItem icon="Administrative" label="Home" route="/" />
        <MenuItem
          icon="Administrative"
          label="Dpto Comercial"
          :items="[
            { name: 'Cotizar', route: '/admin/cotizar' },
            { name: 'Consultar', route: '/admin/precios' },
            { name: 'Lista de precios', route: '/admin/precios' },
            { name: 'Proveedores', route: '/admin/proveedores' },
            { name: 'Customer', route: '/customer/customer' },
            { name: 'Reportes', route: '/admin/proveedores' },
          ]"
          :is-open="openMenu === 'Dpto Comercial'"
          @toggle="toggleMenu('Dpto Comercial')"
        />
        <MenuItem
          icon="Operational"
          label="Dpto Operativ0"
          :items="[
            { name: 'Reporte diario', route: '/operativa/reporte' },
            { name: 'Check-ins', route: '/operativa/checkins' },
          ]"
          :is-open="openMenu === 'Dpto Operativ0'"
          @toggle="toggleMenu('Dpto Operativ0')"
        />
        <MenuItem
          icon="User"
          label="Departamento de personal"
          :items="[
            { name: 'Listado', route: '/users/list' },
            { name: 'Roles', route: '/users/roles' },
          ]"
          :is-open="openMenu === 'Departamento de personal'"
          @toggle="toggleMenu('Departamento de personal')"
        />
        <MenuItem
          icon="User"
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

    <div class="mt-10 space-y-4">
      <button @click="logoutClearStorange" class="flex items-center gap-2 text-red-500 font-medium hover:underline">
        Logout
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth';
import MenuItem from './MenuItem.vue';

const openMenu = ref(null); // mantiene el label del menú abierto

const toggleMenu = (label) => {
  openMenu.value = openMenu.value === label ? null : label;
};

const { setLogout } = useAuth();
const router = useRouter();

const logoutClearStorange = () => {
  setLogout();
  router.push('/login');
};
</script>