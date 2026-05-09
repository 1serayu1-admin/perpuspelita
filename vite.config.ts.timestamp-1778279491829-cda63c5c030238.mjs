// vite.config.ts
import { defineConfig } from "file:///D:/SERAYU%20PROJECT/serayu-digital-library/node_modules/vite/dist/node/index.js";
import react from "file:///D:/SERAYU%20PROJECT/serayu-digital-library/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/SERAYU%20PROJECT/serayu-digital-library/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\SERAYU PROJECT\\serayu-digital-library";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
    // VitePWA({
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
    //   workbox: {
    //     navigateFallbackDenylist: [/^\/~oauth/],
    //     globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2}"],
    //   },
    //   manifest: {
    //     name: "Perpustakaan Digital",
    //     short_name: "Perpustakaan",
    //     description: "Sistem Manajemen Perpustakaan Sekolah",
    //     theme_color: "#0369a1",
    //     background_color: "#f8fafc",
    //     display: "standalone",
    //     orientation: "portrait",
    //     scope: "/",
    //     start_url: "/dashboard",
    //     icons: [
    //       {
    //         src: "pwa-192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "maskable",
    //       },
    //     ],
    //   },
    // }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"]
  },
  optimizeDeps: {
    include: ["@tanstack/react-query", "react", "react-dom"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxTRVJBWVUgUFJPSkVDVFxcXFxzZXJheXUtZGlnaXRhbC1saWJyYXJ5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxTRVJBWVUgUFJPSkVDVFxcXFxzZXJheXUtZGlnaXRhbC1saWJyYXJ5XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9TRVJBWVUlMjBQUk9KRUNUL3NlcmF5dS1kaWdpdGFsLWxpYnJhcnkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgICAvLyBWaXRlUFdBKHtcclxuICAgIC8vICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgIC8vICAgaW5jbHVkZUFzc2V0czogW1wiZmF2aWNvbi5pY29cIiwgXCJwd2EtMTkyLnBuZ1wiLCBcInB3YS01MTIucG5nXCJdLFxyXG4gICAgLy8gICB3b3JrYm94OiB7XHJcbiAgICAvLyAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9+b2F1dGgvXSxcclxuICAgIC8vICAgICBnbG9iUGF0dGVybnM6IFtcIioqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLGpwZyxqcGVnLHdvZmYyfVwiXSxcclxuICAgIC8vICAgfSxcclxuICAgIC8vICAgbWFuaWZlc3Q6IHtcclxuICAgIC8vICAgICBuYW1lOiBcIlBlcnB1c3Rha2FhbiBEaWdpdGFsXCIsXHJcbiAgICAvLyAgICAgc2hvcnRfbmFtZTogXCJQZXJwdXN0YWthYW5cIixcclxuICAgIC8vICAgICBkZXNjcmlwdGlvbjogXCJTaXN0ZW0gTWFuYWplbWVuIFBlcnB1c3Rha2FhbiBTZWtvbGFoXCIsXHJcbiAgICAvLyAgICAgdGhlbWVfY29sb3I6IFwiIzAzNjlhMVwiLFxyXG4gICAgLy8gICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2Y4ZmFmY1wiLFxyXG4gICAgLy8gICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgLy8gICAgIG9yaWVudGF0aW9uOiBcInBvcnRyYWl0XCIsXHJcbiAgICAvLyAgICAgc2NvcGU6IFwiL1wiLFxyXG4gICAgLy8gICAgIHN0YXJ0X3VybDogXCIvZGFzaGJvYXJkXCIsXHJcbiAgICAvLyAgICAgaWNvbnM6IFtcclxuICAgIC8vICAgICAgIHtcclxuICAgIC8vICAgICAgICAgc3JjOiBcInB3YS0xOTIucG5nXCIsXHJcbiAgICAvLyAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcclxuICAgIC8vICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgIC8vICAgICAgIH0sXHJcbiAgICAvLyAgICAgICB7XHJcbiAgICAvLyAgICAgICAgIHNyYzogXCJwd2EtNTEyLnBuZ1wiLFxyXG4gICAgLy8gICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAvLyAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAvLyAgICAgICB9LFxyXG4gICAgLy8gICAgICAge1xyXG4gICAgLy8gICAgICAgICBzcmM6IFwicHdhLTUxMi5wbmdcIixcclxuICAgIC8vICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgLy8gICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgLy8gICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXHJcbiAgICAvLyAgICAgICB9LFxyXG4gICAgLy8gICAgIF0sXHJcbiAgICAvLyAgIH0sXHJcbiAgICAvLyB9KSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3QvanN4LXJ1bnRpbWVcIiwgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIl0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLCBcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVCxTQUFTLG9CQUFvQjtBQUMvVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBc0M1QyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsYUFBYSxxQkFBcUIsdUJBQXVCO0FBQUEsRUFDN0U7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyx5QkFBeUIsU0FBUyxXQUFXO0FBQUEsRUFDekQ7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
