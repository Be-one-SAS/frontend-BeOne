<template>
    <aside class="w-64 min-h-screen bg-white shadow-md flex flex-col justify-between p-4 border-r border-blue-300">
        <!-- Logo y navegación -->
        <div class="flex flex-col gap-10">
            <div class="flex items-center mb-10">
                <span class="ml-3 font-bold text-xl text-blue-900">BeOne</span>
            </div>

            <nav class="space-y-6 text-gray-700 font-medium">
                <!-- Ítem con submenú -->
                <div>
                    <div class="flex items-center gap-2 cursor-pointer select-none mt-5"
                        @click="showAdminMenu = !showAdminMenu">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                        <span>Administrativo</span>
                        <svg class="w-4 h-4 ml-auto transition-transform duration-200"
                            :class="{ 'rotate-90': showAdminMenu }" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>

                    <div v-if="showAdminMenu" class="ml-7 mt-3 space-y-2 text-sm text-gray-600">
                        <a href="#" class="block hover:text-blue-700">Cotizar</a>
                        <a href="#" class="block hover:text-blue-700">Productos</a>
                        <a href="#" class="block hover:text-blue-700">Proveedores</a>
                    </div>
                </div>
            </nav>
        </div>

        <!-- Upgrade y logout -->
        <div class="mt-10 space-y-4">
            <div class="p-4 border rounded-md border-dashed text-sm text-gray-500">
                <p class="font-semibold text-gray-800 mb-1">
                    Upgrade to <span class="text-black">PRO Account</span>
                </p>
                <p>Start your PRO subscription today for only <span class="font-bold text-gray-800">$35/month</span></p>
                <div class="mt-4 h-20 bg-blue-100 rounded"></div>
            </div>

            <button @click="logout" class="flex items-center gap-2 text-red-500 font-medium hover:underline">
                Logout
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
            </button>
        </div>
    </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter()

const logout = router.push('/')

const showAdminMenu = ref(false)
</script>