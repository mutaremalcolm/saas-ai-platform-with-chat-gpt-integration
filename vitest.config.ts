import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        // Default excludes
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        
        // Config files
        '**/*.config.{js,ts,mjs}',
        
        // Test files
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        
        // Next.js specific
        'app/**/layout.tsx',
        'app/**/page.tsx',
        'app/**/loading.tsx',
        'app/**/error.tsx',
        'app/**/not-found.tsx',
        
        // Auth pages (Clerk)
        'app/(auth)/**',
        
        // Landing pages
        'app/(landing)/**',
        
        // Dashboard pages
        'app/(dashboard)/(routes)/**/page.tsx',
        'app/(dashboard)/(routes)/**/constants.ts',
        'app/(dashboard)/layout.tsx',
        
        // Root level files
        'middleware.ts',
        'constants.ts',
        
        // UI components 
        'components/ui/**',
      
      ],
      include: [
        'app/api/**/route.ts',
        'components/**/*.{tsx,ts}',
        'lib/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})