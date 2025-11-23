import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Optimized manual chunks for better caching and initial load
        manualChunks: (id) => {
          // Core React framework - changes infrequently
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core'
          }

          // Firebase bundle - large and changes infrequently
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'firebase-vendor'
          }

          // Framer Motion - animation library, separate for optional loading
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-vendor'
          }

          // Icons - changes infrequently, cache separately
          if (id.includes('node_modules/react-icons/') || id.includes('node_modules/lucide-react/')) {
            return 'icons-vendor'
          }

          // Google AI SDK
          if (id.includes('node_modules/@google/generative-ai/')) {
            return 'google-ai-vendor'
          }

          // Other vendor dependencies
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }

          // Group screens by usage frequency for optimal loading

          // Core screens - loaded on initial app load
          if (id.includes('/screens/AuthScreen') ||
            id.includes('/screens/HomeScreen') ||
            id.includes('/screens/UserOnboardingScreen')) {
            return 'screens-core'
          }

          // Meditation features - frequently used together
          if (id.includes('/screens/MeditationScreen') ||
            id.includes('/screens/MeditationTimerScreen') ||
            id.includes('/screens/EmotionalReleaseScreen') ||
            id.includes('/screens/JournalScreen')) {
            return 'screens-meditation'
          }

          // AI features - used together, can be lazy loaded
          if (id.includes('/screens/AICoachScreen') ||
            id.includes('/screens/MindCoachScreen') ||
            id.includes('/screens/ConversationScreen') ||
            id.includes('/screens/AskQuestionScreen') ||
            id.includes('/screens/VoiceSessionScreen')) {
            return 'screens-ai'
          }

          // Content/exploration screens - less frequently accessed
          if (id.includes('/screens/VedicCalmScreen') ||
            id.includes('/screens/WisdomGitaScreen') ||
            id.includes('/screens/MidnightRelaxationScreen') ||
            id.includes('/screens/MidnightLaunderetteScreen') ||
            id.includes('/screens/ExploreScreen')) {
            return 'screens-content'
          }

          // Social/utility screens
          if (id.includes('/screens/SharingScreen') ||
            id.includes('/screens/ProfileScreen') ||
            id.includes('/screens/StreaksScreen') ||
            id.includes('/screens/EEGBrainHealthScreen')) {
            return 'screens-social'
          }

          // Exercise components - loaded on demand
          if (id.includes('/components/exercises/')) {
            return 'exercise-components'
          }

          // Context providers - needed early, separate chunk
          if (id.includes('/contexts/')) {
            return 'contexts'
          }

          // Shared components - needed across screens
          if (id.includes('/components/') && !id.includes('/exercises/')) {
            return 'components-shared'
          }
        },
      },
    },
    // Increase chunk size warning limit since we're optimizing splitting
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 3000,
    open: true,
  },
})
