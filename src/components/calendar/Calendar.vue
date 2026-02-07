<template>
  <div class="bg-gray-100 rounded-2xl shadow p-6 w-full">
    <h2 class="text-xl font-semibold text-gray-800 mb-6">
      Eventos Programados
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div v-for="(month, index) in months" :key="index">
        <h3 class="text-lg font-semibold text-blue-700 mb-4 capitalize">
          {{ month.name }}
        </h3>

        <!-- Header días -->
        <div class="grid grid-cols-7 text-center text-sm text-gray-500 mb-2">
          <div v-for="day in weekDays" :key="day">
            {{ day }}
          </div>
        </div>

        <!-- Calendario -->
        <div class="grid grid-cols-7 gap-2">
          <div
            v-for="day in month.days"
            :key="day.date"
            class="h-10 flex items-center justify-center rounded-lg text-sm transition"
            :class="getDayClass(day)"
          >
            {{ day.dayNumber }}
          </div>
        </div>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="flex gap-6 mt-6 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-green-300 rounded"></div>
        <span>Confirmado</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-yellow-300 rounded"></div>
        <span>En proceso</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getConfirmedDates } from "@/services/dashboard.service";

const confirmedDates = ref([]);
const months = ref([]);

const weekDays = ["D", "L", "M", "M", "J", "V", "S"];

onMounted(async () => {
  await loadDates();
  generateCalendar();
});

const loadDates = async () => {
  try {
    const response = await getConfirmedDates();
    confirmedDates.value = response.data;
  } catch (error) {
    console.error("Error cargando fechas:", error);
  }
};

const generateCalendar = () => {
  const now = new Date();
  months.value = [];

  for (let i = 0; i < 2; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.value.push(buildMonth(monthDate));
  }
};

const buildMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];

  // Espacios vacíos antes del mes
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({
      date: `empty-${month}-${i}`,
      dayNumber: "",
      isCurrentMonth: false,
      type: null,
    });
  }

  // Días reales del mes
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currentDate = new Date(year, month, d);
    const isoDate = currentDate.toISOString().split("T")[0];

    const found = confirmedDates.value.find(
      (item) => item.date === isoDate
    );

    days.push({
      date: isoDate,
      dayNumber: d,
      isCurrentMonth: true,
      type: found?.type || null,
    });
  }

  return {
    name: date.toLocaleString("es-ES", { month: "long", year: "numeric" }),
    days,
  };
};

const getDayClass = (day) => {
  if (!day.isCurrentMonth) return "text-gray-300";

  if (day.type === "CONFIRMED") {
    return "bg-green-300 text-green-900 font-semibold";
  }

  if (day.type === "IN_PROCESS") {
    return "bg-yellow-400 text-black font-semibold";
  }

  return "text-gray-800 hover:bg-gray-100";
};
</script>