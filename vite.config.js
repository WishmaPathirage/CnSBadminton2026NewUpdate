import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/CnSBadminton2026NewUpdate/",
}));
