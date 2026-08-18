import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incubba Ñuble UBB · Portal de Evaluación",
  description: "Plataforma de evaluación y registro de postulaciones Incubba Ñuble UBB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gris-fondo text-gris-texto font-sans">{children}</body>
    </html>
  );
}
