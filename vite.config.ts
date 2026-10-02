import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (/node_modules\/(recharts|victory-vendor|d3-[^/]+)/.test(id)) return 'charts'
					if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'framework'
					if (id.includes('node_modules/framer-motion/')) return 'motion'
					if (id.includes('node_modules/@dnd-kit/')) return 'drag-and-drop'
					if (id.includes('node_modules/lucide-react/')) return 'icons'
				},
			},
		},
	},
})