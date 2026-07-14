import { defineConfig } from 'vite'
import react from '@vitejs/react' // أو أي إضافات موجودة لديك بالفعل

export default defineConfig({
  base: '/baha-lite/', // أضف هذا السطر تماماً
  plugins: [react()],
})
