import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.VITE_DEV_HOST || '85.209.0.78'
  const portCandidate = Number(env.VITE_DEV_PORT)
  const port = Number.isFinite(portCandidate) && portCandidate > 0 ? portCandidate : 5173

  return {
    plugins: [react()],
    server: {
      host,
      port,
      strictPort: true,
    },
    preview: {
      host,
      port,
      strictPort: true,
    },
  }
})
