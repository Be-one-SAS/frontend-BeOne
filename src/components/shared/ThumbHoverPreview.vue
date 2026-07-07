<template>
  <Teleport to="body">
    <div
      v-if="preview.visible"
      class="thumb-hover-preview"
      :style="{
        top: preview.top + 'px',
        left: preview.left + 'px',
        width: (preview.size || 240) + 'px',
        height: (preview.size || 240) + 'px',
      }"
    >
      <img :src="preview.src" alt="" />
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  preview: { type: Object, required: true },
})
</script>

<style scoped>
.thumb-hover-preview {
  position: fixed;
  background: #fff;
  border: 1px solid #E2EBF6;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
  padding: 8px;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-hover-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
</style>
