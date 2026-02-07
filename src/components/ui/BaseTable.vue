<template>
  <div class="relative w-full">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200">

      <!-- Scroll horizontal -->
      <div class="overflow-x-auto rounded-2xl">

        <table
          class="min-w-max w-full text-sm text-left border-separate border-spacing-0"
        >
          <!-- HEADER -->
          <thead
            class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider sticky top-0 z-10"
          >
            <tr>
              <slot name="header" />
            </tr>
          </thead>

          <!-- BODY -->
          <tbody class="divide-y divide-gray-100">
            <slot name="body" />
          </tbody>

        </table>
      </div>
    </div>
  </div>
</template>