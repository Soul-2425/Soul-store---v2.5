import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soul Store | Plataforma de Venta y Gestión B2B/B2C",
  description: "Recargas de juegos, streaming, cuentas exclusivas y panel para revendedores con tasas de cambio multidivisa en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen text-white antialiased selection:bg-[#FF007F] selection:text-white">
        {children}
      </body>
    </html>
  );
}
