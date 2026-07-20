import { defineConfig } from 'vitest/config'

// Unit tests run in Node (the CMI hash utility depends on node:crypto).
// Only the CMI library is covered here; component/e2e testing is out of scope.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
