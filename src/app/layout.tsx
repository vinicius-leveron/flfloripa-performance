import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLFloripa Performance",
  description: "Plataforma de gestão de performance — Fundação Logosófica de Florianópolis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
