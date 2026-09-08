import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  // GitHub Pages のプロジェクトページは /<repo>/ 配下に置かれる。
  // 相対パスにしておけば、どこに配置しても、ローカルで直接開いても動く。
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: { target: "es2020", cssCodeSplit: false, assetsInlineLimit: 100_000_000 },
});
