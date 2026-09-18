import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.jsx'],
    setupFiles: ['test/setup.mjs'],
    // Тесты намеренно подменяют глобальный fetch, поэтому файлы должны идти
    // последовательно, без гонки между разными имитациями API.
    fileParallelism: false,
  },
});
