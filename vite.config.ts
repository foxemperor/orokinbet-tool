import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/orokinbet-tool/',
    build: {
    charset: 'utf8',
  },
})
