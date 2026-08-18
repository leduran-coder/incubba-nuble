import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Por defecto Next.js solo permite 1 MB en el envío de datos que hace
      // "Importar postulaciones" (manda todas las filas del CSV en una sola
      // petición). Con archivos grandes o respuestas de texto largas del
      // formulario, eso se supera fácil y el navegador muestra una página en
      // blanco / "This page couldn't load". Vercel tiene un tope real de
      // ~4.5 MB por función serverless que no se puede subir, así que
      // dejamos el límite de Next.js justo debajo de eso.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
