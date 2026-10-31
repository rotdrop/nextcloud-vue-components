import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  define: {
    APP_NAME: JSON.stringify('nextcloud-vue-components-test'),
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
})
