import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = 'romasaga_minigame'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? `/${repositoryName}/` : '/',
  plugins: [react()],
})
