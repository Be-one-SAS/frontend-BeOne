<script setup>
import TableDinamic from '@/components/tables/TableDinamic.vue';

const headers = [
    'ID de artículo / CATALOGO',
    'Seleccione Dispositivo',
    'Valor Cuadro Cotizador',
    'Estado',
    'Bodega'
];

const rows = [
    {
        'ID de artículo / CATALOGO': 10,
        'Seleccione Dispositivo': 'OCTOPUS INFLABLE',
        'Valor Cuadro Cotizador': 6000000,
        'Estado': 'Operativo - Estado ok',
        'Bodega': 'Bogotá'
    },
    {
        'ID de artículo / CATALOGO': 12,
        'Seleccione Dispositivo': 'ESCENARIO 8X8',
        'Valor Cuadro Cotizador': 4800000,
        'Estado': 'Operativo - Estado ok',
        'Bodega': 'Medellín'
    },
    {
        'ID de artículo / CATALOGO': 15,
        'Seleccione Dispositivo': 'TORRE LUZ LED',
        'Valor Cuadro Cotizador': 2500000,
        'Estado': 'En reparación',
        'Bodega': 'Cali'
    },
    {
        'ID de artículo / CATALOGO': 18,
        'Seleccione Dispositivo': 'PANTALLA LED 3X2',
        'Valor Cuadro Cotizador': 7200000,
        'Estado': 'Operativo - Estado ok',
        'Bodega': 'Bogotá'
    },
    {
        'ID de artículo / CATALOGO': 22,
        'Seleccione Dispositivo': 'CÁMARA 360°',
        'Valor Cuadro Cotizador': 1900000,
        'Estado': 'Disponible',
        'Bodega': 'Barranquilla'
    }
];


</script>

<template>
  
  <TableDinamic :headers="headers" :rows="rows" />
  
</template>