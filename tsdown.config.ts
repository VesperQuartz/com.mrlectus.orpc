import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: ["src/**"],
  // watch: true,
  exports: true,
  dts: true,
});
