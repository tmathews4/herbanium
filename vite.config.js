import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // WSL2 doesn't deliver inotify events for files living on the
    // Windows filesystem (/mnt/c), so the default watcher never fires
    // and the dev server quietly serves whatever it read at startup —
    // edits appear to do nothing until you restart it. Polling is the
    // only thing that sees those changes. Costs a little CPU; costs a
    // lot less than debugging a change that was never being served.
    watch: { usePolling: true, interval: 300 },
  },
  plugins: [react()],
})
