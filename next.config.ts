import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compatibilidad con los enlaces del sistema anterior (servidor Python):
  // las URLs guardadas en pantallas/monitores siguen funcionando.
  async rewrites() {
    return [
      { source: "/admin.html", destination: "/" },
      { source: "/usuario.html", destination: "/usuario" },
    ];
  },
};

export default nextConfig;
