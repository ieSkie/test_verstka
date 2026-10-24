import { defineConfig } from 'vite'

// Multi-page: у каждого макета свой index.html.
// Якоря (#projects и т.п.) работают нативно, на GitHub Pages не нужен SPA-роутер.
// base: './' — относительные пути, чтобы сайт работал из подпапки /<repo>/.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        svetly: 'svetly/index.html',
      },
    },
  },
})
